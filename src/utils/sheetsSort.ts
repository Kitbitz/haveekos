import { GoogleSheetsError } from './errorHandling';
import { SHEET_HEADERS } from '../services/exportService';

export async function sortSheetByDateDesc(
  accessToken: string, 
  spreadsheetId: string, 
  sheetName: string
): Promise<void> {
  try {
    // Get sheet ID
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!sheetsResponse.ok) {
      throw new Error('Failed to get spreadsheet information');
    }

    const sheetsData = await sheetsResponse.json();
    const sheet = sheetsData.sheets.find((s: any) => s.properties.title === sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const sheetId = sheet.properties.sheetId;

    // Find date column index (Order Date)
    const dateColumnIndex = SHEET_HEADERS.findIndex(header => header === 'Order Date');
    const timeColumnIndex = SHEET_HEADERS.findIndex(header => header === 'Order Time');

    if (dateColumnIndex === -1 || timeColumnIndex === -1) {
      throw new Error('Date/Time columns not found in headers');
    }

    // Perform the sort
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            sortRange: {
              range: {
                sheetId: sheetId,
                startRowIndex: 1, // Skip header row
                startColumnIndex: 0,
                endColumnIndex: SHEET_HEADERS.length // Use full width of headers
              },
              sortSpecs: [
                {
                  sortOrder: 'DESCENDING',
                  dimensionIndex: dateColumnIndex
                },
                {
                  sortOrder: 'DESCENDING',
                  dimensionIndex: timeColumnIndex
                }
              ]
            }
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Sort operation failed');
    }
  } catch (error) {
    console.error('Sort error:', error);
    throw new GoogleSheetsError(
      'Failed to sort sheet: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}