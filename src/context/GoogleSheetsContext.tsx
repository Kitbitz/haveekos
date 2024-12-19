import React, { createContext, useContext, useState } from 'react';
import { exportToGoogleSheets } from '../services/googleSheetsService';
import { Order } from '../types/order';

interface GoogleSheetsContextType {
  exportToSheets: (orders: Order[]) => Promise<void>;
  isExporting: boolean;
  error: string | null;
  clearError: () => void;
}

export const GoogleSheetsContext = createContext<GoogleSheetsContextType | null>(null);

export const useGoogleSheets = () => {
  const context = useContext(GoogleSheetsContext);
  if (!context) {
    throw new Error('useGoogleSheets must be used within a GoogleSheetsProvider');
  }
  return context;
};

export const GoogleSheetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToSheets = async (orders: Order[]) => {
    setIsExporting(true);
    setError(null);
    try {
      await exportToGoogleSheets(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export to Google Sheets');
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <GoogleSheetsContext.Provider value={{ exportToSheets, isExporting, error, clearError }}>
      {children}
    </GoogleSheetsContext.Provider>
  );
};