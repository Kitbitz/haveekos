import { Order } from '../App';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const ORDERS_SHEET_NAME = 'Orders';
const ALL_ORDERS_SHEET_NAME = 'All_Orders';

interface SheetCredentials {
  client_email: string;
  private_key: string;
}

const getCredentials = (): SheetCredentials => {
  const credentials = {
    client_email: import.meta.env.VITE_GOOGLE_CLIENT_EMAIL,
    private_key: import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Missing required Google Sheets credentials');
  }

  return credentials;
};

const getAccessToken = async (): Promise<string> => {
  const credentials = getCredentials();
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

const formatOrderForSheet = (order: Order): string[] => {
  const orderDate = new Date(order.timestamp);
  const statusDate = order.statusTimestamp ? new Date(order.statusTimestamp) : null;
  const paymentDate = order.paymentTimestamp ? new Date(order.paymentTimestamp) : null;

  return [
    order.id,
    order.name,
    order.contactNumber,
    order.orderChoice,
    order.totalPrice.toString(),
    order.status,
    order.isPaid ? 'Paid' : 'Unpaid',
    orderDate.toLocaleDateString(),
    orderDate.toLocaleTimeString(),
    statusDate ? `${statusDate.toLocaleDateString()} ${statusDate.toLocaleTimeString()}` : '',
    paymentDate ? `${paymentDate.toLocaleDateString()} ${paymentDate.toLocaleTimeString()}` : ''
  ];
};

const getHeaders = (): string[] => [
  'Order ID',
  'Name',
  'Contact Number',
  'Order Details',
  'Total Price',
  'Status',
  'Payment Status',
  'Order Date',
  'Order Time',
  'Status Updated At',
  'Payment Updated At'
];

export const updateOrderInSheet = async (order: Order): Promise<void> => {
  const accessToken = await getAccessToken();
  
  // First, ensure headers exist
  const headersResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ORDERS_SHEET_NAME}!1:1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!headersResponse.ok) {
    throw new Error('Failed to fetch headers');
  }

  const headersData = await headersResponse.json();
  if (!headersData.values || headersData.values.length === 0) {
    // Add headers if they don't exist
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ORDERS_SHEET_NAME}!A1:K1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [getHeaders()]
        })
      }
    );
  }

  // Now handle the order data
  const formattedOrder = formatOrderForSheet(order);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ORDERS_SHEET_NAME}!A:A`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch sheet data');
  }

  const data = await response.json();
  const rows = data.values || [];
  const rowIndex = rows.findIndex((row: string[]) => row[0] === order.id);

  const range = rowIndex === -1 
    ? `${ORDERS_SHEET_NAME}!A:K` 
    : `${ORDERS_SHEET_NAME}!A${rowIndex + 1}:K${rowIndex + 1}`;

  const method = rowIndex === -1 ? 'POST' : 'PUT';
  const endpoint = rowIndex === -1 
    ? `${range}:append?valueInputOption=RAW`
    : `${range}?valueInputOption=RAW`;

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${endpoint}`,
    {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [formattedOrder]
      })
    }
  );
};

export const exportOrdersToSheet = async (orders: Order[]): Promise<void> => {
  const accessToken = await getAccessToken();
  const headers = getHeaders();
  const formattedOrders = orders.map(formatOrderForSheet);

  // First, check if headers exist
  const headersResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ALL_ORDERS_SHEET_NAME}!1:1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!headersResponse.ok) {
    throw new Error('Failed to fetch headers');
  }

  const headersData = await headersResponse.json();
  const needsHeaders = !headersData.values || headersData.values.length === 0;

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ALL_ORDERS_SHEET_NAME}!A:K:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: needsHeaders ? [headers, ...formattedOrders] : formattedOrders
      })
    }
  );
};