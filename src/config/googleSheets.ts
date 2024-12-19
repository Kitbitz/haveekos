export const GOOGLE_SHEETS_CONFIG = {
  clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/oauth2callback',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
};