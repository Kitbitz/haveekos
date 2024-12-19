import { Order } from '../types/order';
import { getAccessToken } from '../utils/sheetsAuth';
import { GoogleSheetsError } from '../utils/errorHandling';
import { withRetry } from '../utils/retryStrategy';

const ORDERS_SHEET = 'Orders';
const HEADERS = [
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

async function ensureSheetExists(spreadsheetId: string, sheetName: string, accessToken: string): Promise<void> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new GoogleSheetsError('Failed to check spreadsheet', response.status.toString());
    }

    const spreadsheet = await response.json();
    const sheetExists = spreadsheet.sheets.some(
      (sheet: any) => sheet.properties.title === sheetName
    );

    if (!sheetExists) {
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
                properties: { title: sheetName }
              }
            }]
          })
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new GoogleSheetsError(
          `Failed to create sheet: ${errorData.error?.message || 'Unknown error'}`,
          createResponse.status.toString()
        );
      }
    }
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to ensure sheet exists');
  }
}

async function ensureHeaders(spreadsheetId: string, sheetName: string, accessToken: string): Promise<void> {
  try {
    // First ensure the sheet exists
    await ensureSheetExists(spreadsheetId, sheetName, accessToken);

    // Check existing headers
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:M1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new GoogleSheetsError('Failed to check headers', response.status.toString());
    }

    const data = await response.json();
    const existingHeaders = data.values?.[0] || [];
    const needsHeaders = existingHeaders.length !== HEADERS.length || 
      !HEADERS.every((header, index) => existingHeaders[index] === header);

    if (needsHeaders) {
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:M1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [HEADERS]
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new GoogleSheetsError(
          `Failed to update headers: ${errorData.error?.message || 'Unknown error'}`,
          updateResponse.status.toString()
        );
      }
    }
  } catch (error) {
    console.error('Error ensuring headers:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to ensure headers');
  }
}

export const syncOrderToSheets = async (order: Order): Promise<void> => {
  return withRetry(async () => {
    try {
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        throw new GoogleSheetsError('Missing spreadsheet ID');
      }

      const accessToken = await getAccessToken();

      // Ensure sheet and headers exist
      await ensureHeaders(spreadsheetId, ORDERS_SHEET, accessToken);

      const orderDate = new Date(order.timestamp);
      const statusDate = order.statusTimestamp ? new Date(order.statusTimestamp) : null;
      const paymentDate = order.paymentTimestamp ? new Date(order.paymentTimestamp) : null;

      const rowData = [
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

      // Find existing order
      const findResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ORDERS_SHEET}!A:A`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!findResponse.ok) {
        throw new GoogleSheetsError('Failed to check existing orders', findResponse.status.toString());
      }

      const data = await findResponse.json();
      const orderIds = data.values?.slice(1).map((row: string[]) => row[0]) || [];
      const rowIndex = orderIds.indexOf(order.id) + 2; // Add 2 for header row and 0-based index

      const endpoint = rowIndex > 1
        ? `${ORDERS_SHEET}!A${rowIndex}:M${rowIndex}?valueInputOption=RAW`
        : `${ORDERS_SHEET}!A:M:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

      const method = rowIndex > 1 ? 'PUT' : 'POST';

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${endpoint}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [rowData]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new GoogleSheetsError(
          `Failed to ${rowIndex > 1 ? 'update' : 'add'} order: ${errorData.error?.message || 'Unknown error'}`,
          response.status.toString()
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to sync with Google Sheets');
    }
  }, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2,
    shouldRetry: (error) => {
      if (error instanceof GoogleSheetsError) {
        return error.message.includes('Rate limit') || 
               error.message.includes('timeout') ||
               error.message.includes('network');
      }
      return false;
    }
  });
};

export const exportToGoogleSheets = async (orders: Order[]): Promise<void> => {
  return withRetry(async () => {
    try {
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        throw new GoogleSheetsError('Missing spreadsheet ID');
      }

      const accessToken = await getAccessToken();

      // Ensure sheet and headers exist
      await ensureHeaders(spreadsheetId, ORDERS_SHEET, accessToken);

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

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ORDERS_SHEET}!A2:M?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new GoogleSheetsError(
          `Failed to update orders: ${errorData.error?.message || 'Unknown error'}`,
          response.status.toString()
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to export to Google Sheets');
    }
  }, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2,
    shouldRetry: (error) => {
      if (error instanceof GoogleSheetsError) {
        return error.message.includes('Rate limit') || 
               error.message.includes('timeout') ||
               error.message.includes('network');
      }
      return false;
    }
  });
};