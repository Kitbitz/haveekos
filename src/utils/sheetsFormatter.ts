import { SheetData } from '../types/sheets';

export const formatSheetData = (data: any[]): SheetData => {
  // Extract headers from the first item's keys
  const headers = Object.keys(data[0] || {});
  
  // Convert data to rows
  const rows = data.map(item => 
    headers.map(header => item[header]?.toString() || '')
  );

  return { headers, rows };
};

export const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return JSON.stringify(value);
  }

  return String(value);
};

export const validateSheetName = (name: string): string => {
  // Remove invalid characters and limit length
  return name
    .replace(/[\\/?*\[\]]/g, '')
    .substring(0, 100);
};

export const generateSheetTitle = (prefix: string, timestamp: number): string => {
  const date = new Date(timestamp);
  const formattedDate = date.toISOString().split('T')[0];
  return validateSheetName(`${prefix}_${formattedDate}`);
};