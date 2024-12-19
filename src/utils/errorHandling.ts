export class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'GoogleSheetsError';
    Object.setPrototypeOf(this, GoogleSheetsError.prototype);
  }

  static fromResponse(response: Response, data?: any): GoogleSheetsError {
    const message = data?.error?.message || `HTTP error! status: ${response.status}`;
    const code = data?.error?.code?.toString() || response.status.toString();
    return new GoogleSheetsError(message, code, data?.error);
  }

  static fromError(error: unknown): GoogleSheetsError {
    if (error instanceof GoogleSheetsError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new GoogleSheetsError(message);
  }
}

export const isGoogleSheetsError = (error: unknown): error is GoogleSheetsError => {
  return error instanceof GoogleSheetsError;
};

export const handleGoogleSheetsError = (error: unknown): never => {
  if (error instanceof GoogleSheetsError) {
    throw error;
  }

  throw new GoogleSheetsError(
    error instanceof Error ? error.message : 'An unexpected error occurred'
  );
};