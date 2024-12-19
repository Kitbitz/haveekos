import { Order } from '../App';

export const ORDERS_SHEET_NAME = 'Orders';
export const ALL_ORDERS_SHEET_NAME = 'All_Orders';

interface SheetCredentials {
  client_email: string;
  private_key: string;
  spreadsheet_id: string;
}

const getCredentials = (): SheetCredentials => {
  const credentials = {
    client_email: import.meta.env.VITE_GOOGLE_CLIENT_EMAIL,
    private_key: import.meta.env.VITE_GOOGLE_PRIVATE_KEY,
    spreadsheet_id: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID
  };

  if (!credentials.client_email || !credentials.private_key || !credentials.spreadsheet_id) {
    throw new Error('Missing required Google Sheets credentials');
  }

  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  return credentials;
};

const getAccessToken = async (credentials: SheetCredentials): Promise<string> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const jwtClaim = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedClaim = btoa(JSON.stringify(jwtClaim));
    const signature = await signJwt(`${encodedHeader}.${encodedClaim}`, credentials.private_key);
    const jwt = `${encodedHeader}.${encodedClaim}.${signature}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await response.json();
    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

const signJwt = async (input: string, privateKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    data
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

export const appendToSheet = async (orders: Order[]): Promise<void> => {
  try {
    if (!orders || orders.length === 0) {
      throw new Error('No orders data provided');
    }

    const credentials = getCredentials();
    const accessToken = await getAccessToken(credentials);
    const formattedData = formatOrdersForSheet(orders);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheet_id}/values/${ALL_ORDERS_SHEET_NAME}!A1:K1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: formattedData,
          majorDimension: 'ROWS'
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Sheets API Error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    if (!result.updates) {
      throw new Error('Failed to append data to sheet - no updates confirmed');
    }

  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
};

export const formatOrdersForSheet = (orders: Order[]): string[][] => {
  const headers = [
    ['Order ID', 'Name', 'Contact Number', 'Order Details', 'Total Price', 'Status', 'Payment Status', 'Date', 'Time']
  ];

  const rows = orders.map(order => {
    const date = new Date(order.timestamp);
    return [
      order.id || '',
      order.name || '',
      order.contactNumber || '',
      order.orderChoice || '',
      (order.totalPrice || 0).toFixed(2),
      order.status || '',
      order.isPaid ? 'Paid' : 'Unpaid',
      date.toLocaleDateString(),
      date.toLocaleTimeString()
    ];
  });

  return [...headers, ...rows];
};