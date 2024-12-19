import { Order } from '../types/order';
import { GoogleSheetsError } from '../utils/errorHandling';
import { getAccessToken } from '../utils/sheetsAuth';
import { withRetry } from '../utils/retryStrategy';
import SheetsQueue from '../utils/sheetsQueue';

// Update sheet name constant
export const SHEET_NAME = 'All_Orders';

export const SHEET_HEADERS = [
  'Order ID',
  'Name',
  'Contact Number',
  'Email',
  'Order Details',
  'Total Price',
  'Payment Method',
  'Status',
  'Payment Status',
  'Order Date',
  'Order Time',
  'Status Updated At',
  'Payment Updated At'
];

export async function exportOrders(orders: Order[]): Promise<void> {
  const queue = SheetsQueue.getInstance();

  return withRetry(async () => {
    try {
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        throw new GoogleSheetsError('Missing spreadsheet ID', 'CONFIG_ERROR');
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new GoogleSheetsError('Failed to get access token', 'AUTH_ERROR');
      }

      // Queue the export operation with a unique ID
      const exportId = `export-orders-${Date.now()}`;
      await queue.enqueue(exportId, async () => {
        // Ensure sheet exists and has headers
        await ensureSheetSetup(spreadsheetId, accessToken);

        // Prepare the data
        const rows = orders.map(order => {
          const orderDate = new Date(order.timestamp);
          const statusDate = order.statusTimestamp ? new Date(order.statusTimestamp) : null;
          const paymentDate = order.paymentTimestamp ? new Date(order.paymentTimestamp) : null;

          return [
            order.id,
            order.name,
            order.contactNumber || '',
            order.email || '',
            order.orderChoice,
            order.totalPrice.toString(),
            order.paymentMethod || 'Cash',
            order.status,
            order.isPaid ? 'Paid' : 'Unpaid',
            orderDate.toLocaleDateString(),
            orderDate.toLocaleTimeString(),
            statusDate ? `${statusDate.toLocaleDateString()} ${statusDate.toLocaleTimeString()}` : '',
            paymentDate ? `${paymentDate.toLocaleDateString()} ${paymentDate.toLocaleTimeString()}` : ''
          ];
        });

        // Update data in smaller chunks to avoid quota limits
        const CHUNK_SIZE = 500;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          
          const updateResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A${i + 2}:M${i + chunk.length + 1}?valueInputOption=RAW`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                values: chunk
              })
            }
          );

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new GoogleSheetsError(
              `Failed to update data: ${errorData.error?.message || 'Unknown error'}`,
              updateResponse.status.toString()
            );
          }

          // Add delay between chunks to avoid rate limits
          if (i + CHUNK_SIZE < rows.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      });

    } catch (error) {
      console.error('Export error:', error);
      throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to export to Google Sheets', 'UNKNOWN');
    }
  }, {
    maxAttempts: 5,
    delay: 2000,
    backoff: 2,
    shouldRetry: (error) => {
      if (error instanceof GoogleSheetsError) {
        return error.code === '429' || 
               error.code === 'TIMEOUT' ||
               error.message.includes('network') ||
               error.message.includes('Failed to fetch');
      }
      return false;
    }
  });
}

async function ensureSheetSetup(spreadsheetId: string, accessToken: string): Promise<void> {
  // Check if sheet exists
  const sheetsResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!sheetsResponse.ok) {
    throw new GoogleSheetsError('Failed to access spreadsheet', sheetsResponse.status.toString());
  }

  const sheetsData = await sheetsResponse.json();
  const targetSheet = sheetsData.sheets.find((s: any) => s.properties.title === SHEET_NAME);

  if (!targetSheet) {
    // Create sheet if it doesn't exist
    const createResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: { title: SHEET_NAME }
            }
          }]
        })
      }
    );

    if (!createResponse.ok) {
      throw new GoogleSheetsError('Failed to create sheet', createResponse.status.toString());
    }
  }

  // Update headers
  const headerResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A1:M1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [SHEET_HEADERS]
      })
    }
  );

  if (!headerResponse.ok) {
    throw new GoogleSheetsError('Failed to update headers', headerResponse.status.toString());
  }
}