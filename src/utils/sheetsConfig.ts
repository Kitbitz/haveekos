export const ORDERS_SHEET_NAME = 'Orders';
export const ALL_ORDERS_SHEET_NAME = 'All_Orders';

export interface SheetCredentials {
  client_email: string;
  private_key: string;
  spreadsheet_id: string;
}

export const getCredentials = (): SheetCredentials => {
  const credentials = {
    client_email: import.meta.env.VITE_GOOGLE_CLIENT_EMAIL,
    private_key: import.meta.env.VITE_GOOGLE_PRIVATE_KEY,
    spreadsheet_id: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID
  };

  if (!credentials.client_email || !credentials.private_key || !credentials.spreadsheet_id) {
    throw new Error('Missing required Google Sheets credentials in environment variables');
  }

  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  return credentials;
};