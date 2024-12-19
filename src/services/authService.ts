import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_SHEETS_CONFIG } from '../config/googleSheets';

class AuthService {
  private static instance: AuthService;
  private oauth2Client: OAuth2Client;
  private tokenData: any = null;

  private constructor() {
    this.oauth2Client = new OAuth2Client(
      GOOGLE_SHEETS_CONFIG.clientId,
      GOOGLE_SHEETS_CONFIG.clientSecret,
      GOOGLE_SHEETS_CONFIG.redirectUri
    );
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getAuthUrl(): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SHEETS_CONFIG.scopes,
      prompt: 'consent'
    });
  }

  async handleCallback(code: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.tokenData = tokens;
      this.saveTokens(tokens);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  private saveTokens(tokens: any): void {
    localStorage.setItem('googleTokens', JSON.stringify(tokens));
  }

  getStoredTokens(): any {
    const tokens = localStorage.getItem('googleTokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!tokens && !!tokens.access_token;
  }

  getOAuth2Client(): OAuth2Client {
    const tokens = this.getStoredTokens();
    if (tokens) {
      this.oauth2Client.setCredentials(tokens);
    }
    return this.oauth2Client;
  }

  clearTokens(): void {
    localStorage.removeItem('googleTokens');
    this.tokenData = null;
  }
}

export default AuthService;