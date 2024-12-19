/// <reference types="gapi" />
/// <reference types="google.accounts" />

declare global {
  interface Window {
    gapi: typeof gapi;
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: any): any;
        };
      };
    };
  }
}