export const GOOGLE_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  scope: 'https://www.googleapis.com/auth/spreadsheets',
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
};