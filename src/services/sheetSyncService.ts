import { Order } from '../types/order';
import { GoogleSheetsError } from '../utils/errorHandling';
import { getAccessToken } from '../utils/sheetsAuth';
import { withRetry } from '../utils/retryStrategy';

const SHEET_NAME = 'Orders';
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

export async function syncOrderDeletions(orders: Order[]): Promise<void> {
  try {
    const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new GoogleSheetsError('Missing spreadsheet ID');
    }

    const accessToken = await getAccessToken();
    const sheetId = await ensureSheetExists(spreadsheetId, SHEET_NAME, accessToken);
    
    // Get all order IDs from the sheet
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:A`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new GoogleSheetsError('Failed to get sheet data');
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Find rows to delete
    const rowsToDelete = orders.map(order => {
      const rowIndex = rows.findIndex((row: string[]) => row[0] === order.id);
      return rowIndex > 0 ? rowIndex + 1 : null;
    }).filter((index): index is number => index !== null);

    if (rowsToDelete.length === 0) return;

    // Delete rows in reverse order to maintain correct indices
    const deleteRequests = rowsToDelete.sort((a, b) => b - a).map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex - 1,
          endIndex: rowIndex
        }
      }
    }));

    const deleteResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: deleteRequests
        })
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new GoogleSheetsError(`Failed to delete rows: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error syncing deletions:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to sync deletions');
  }
}

async function ensureSheetExists(spreadsheetId: string, sheetName: string, accessToken: string): Promise<number> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new GoogleSheetsError('Failed to check spreadsheet');
    }

    const spreadsheet = await response.json();
    const sheet = spreadsheet.sheets.find((s: any) => s.properties.title === sheetName);

    if (!sheet) {
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
        throw new GoogleSheetsError(`Failed to create sheet: ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await createResponse.json();
      return result.replies[0].addSheet.properties.sheetId;
    }

    return sheet.properties.sheetId;
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to ensure sheet exists');
  }
}

export async function syncOrder(order: Order): Promise<void> {
  try {
    const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new GoogleSheetsError('Missing spreadsheet ID');
    }

    const accessToken = await getAccessToken();
    await ensureHeaders(spreadsheetId, SHEET_NAME, accessToken);

    const orderDate = new Date(order.timestamp);
    const statusDate = order.statusTimestamp ? new Date(order.statusTimestamp) : null;
    const paymentDate = order.paymentTimestamp ? new Date(order.paymentTimestamp) : null;

    const rowData = [
      order.id,
      order.name,
      order.contactNumber,
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
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:A`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!findResponse.ok) {
      throw new GoogleSheetsError('Failed to check existing orders');
    }

    const data = await findResponse.json();
    const orderIds = data.values?.slice(1).map((row: string[]) => row[0]) || [];
    const rowIndex = orderIds.indexOf(order.id) + 2; // Add 2 for header row and 0-based index

    const endpoint = rowIndex > 1
      ? `${SHEET_NAME}!A${rowIndex}:M${rowIndex}?valueInputOption=RAW`
      : `${SHEET_NAME}!A:M:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

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
      throw new GoogleSheetsError(`Failed to ${rowIndex > 1 ? 'update' : 'add'} order: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error syncing order:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to sync order');
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
      throw new GoogleSheetsError('Failed to check headers');
    }

    const data = await response.json();
    const existingHeaders = data.values?.[0] || [];
    const needsHeaders = !arraysEqual(existingHeaders, HEADERS);

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
        throw new GoogleSheetsError(`Failed to update headers: ${errorData.error?.message || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring headers:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Failed to ensure headers');
  }
}

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}