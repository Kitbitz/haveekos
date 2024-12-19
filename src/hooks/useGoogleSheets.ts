import { useState, useCallback } from 'react';
import { GoogleSheetsError } from '../utils/errorHandling';
import GoogleSheetsService from '../services/googleSheetsService';
import { Order } from '../App';

export const useGoogleSheets = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetsService = new GoogleSheetsService();

  const syncOrders = useCallback(async (orders: Order[]): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await sheetsService.authenticate();
      if (!accessToken) {
        throw new GoogleSheetsError('Authentication failed');
      }

      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        throw new GoogleSheetsError('Spreadsheet ID not configured');
      }

      // Clear and update the Orders sheet
      await sheetsService.clearSheet(spreadsheetId, 'Orders!A:Z');
      await sheetsService.appendData(
        spreadsheetId,
        'Orders!A1',
        [['Order ID', 'Name', 'Contact', 'Order Details', 'Total Price', 'Status', 'Payment Status', 'Date', 'Time']]
      );

      const formattedOrders = orders.map(order => [
        order.id,
        order.name,
        order.contactNumber,
        order.orderChoice,
        order.totalPrice.toString(),
        order.status,
        order.isPaid ? 'Paid' : 'Unpaid',
        new Date(order.timestamp).toLocaleDateString(),
        new Date(order.timestamp).toLocaleTimeString()
      ]);

      await sheetsService.appendData(spreadsheetId, 'Orders!A2', formattedOrders);
    } catch (error) {
      const message = error instanceof GoogleSheetsError ? error.message : 'Failed to sync with Google Sheets';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    syncOrders,
    isLoading,
    error
  };
};