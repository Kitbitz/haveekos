import { GoogleSheetsError } from './errorHandling';

interface TokenCache {
  value: string;
  expiry: number;
}

let tokenCache: TokenCache | null = null;
const TOKEN_BUFFER = 300; // 5 minutes buffer before expiry

export const getAccessToken = async (): Promise<string> => {
  try {
    // Check cache first with buffer time
    if (tokenCache && tokenCache.expiry > Date.now() + (TOKEN_BUFFER * 1000)) {
      return tokenCache.value;
    }

    const credentials = {
      client_email: import.meta.env.VITE_GOOGLE_CLIENT_EMAIL,
      private_key: import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    if (!validateCredentials(credentials)) {
      throw new GoogleSheetsError('Invalid or missing Google Sheets credentials');
    }

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
      const errorData = await response.json();
      throw new GoogleSheetsError(
        `Token request failed: ${errorData.error_description || response.statusText}`,
        response.status.toString()
      );
    }

    const { access_token, expires_in } = await response.json();
    
    // Cache the token
    tokenCache = {
      value: access_token,
      expiry: Date.now() + (expires_in * 1000)
    };

    return access_token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error instanceof GoogleSheetsError ? error : new GoogleSheetsError('Authentication failed');
  }
};

const validateCredentials = (credentials: any): credentials is { client_email: string; private_key: string } => {
  if (!credentials.client_email || !credentials.private_key) {
    return false;
  }

  const isValidEmail = /^[^@]+@[^@]+\.[^@]+$/.test(credentials.client_email);
  const hasPrivateKeyMarkers = credentials.private_key.includes('PRIVATE KEY');

  return isValidEmail && hasPrivateKeyMarkers;
};

const signJwt = async (input: string, privateKey: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    const pemHeader = '-----BEGIN PRIVATE KEY-----\n';
    const pemFooter = '\n-----END PRIVATE KEY-----';
    const pemContents = privateKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
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
  } catch (error) {
    console.error('JWT signing error:', error);
    throw new GoogleSheetsError('Failed to sign JWT');
  }
};