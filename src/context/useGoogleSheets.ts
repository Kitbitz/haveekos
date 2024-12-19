import { useContext } from 'react';
import { GoogleSheetsContext } from './GoogleSheetsContext';

export const useGoogleSheets = () => {
  const context = useContext(GoogleSheetsContext);
  if (!context) {
    throw new Error('useGoogleSheets must be used within a GoogleSheetsProvider');
  }
  return context;
};