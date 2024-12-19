export interface SheetData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ExportResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
}