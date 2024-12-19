import { useState } from 'react';
import { exportService } from '../services/exportService';
import { Order } from '../App';
import { GoogleSheetsError } from '../utils/errorHandling';

interface UseExportReturn {
  exportOrders: (orders: Order[], dateRange?: { start: Date; end: Date }) => Promise<void>;
  isExporting: boolean;
  error: string | null;
  clearError: () => void;
}

export const useExport = (): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportOrders = async (orders: Order[], dateRange?: { start: Date; end: Date }) => {
    if (isExporting) return;

    setIsExporting(true);
    setError(null);

    try {
      await exportService.exportOrders(orders, dateRange);
    } catch (err) {
      const errorMessage = err instanceof GoogleSheetsError 
        ? err.message 
        : 'An unexpected error occurred during export';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    exportOrders,
    isExporting,
    error,
    clearError
  };
};