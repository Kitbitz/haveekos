import { SheetData } from '../types/sheets';

export const validateSheetData = (data: SheetData): boolean => {
  if (!Array.isArray(data.headers) || !Array.isArray(data.rows)) {
    return false;
  }

  if (data.headers.length === 0) {
    return false;
  }

  const headerLength = data.headers.length;
  return data.rows.every(row => 
    Array.isArray(row) && 
    row.length === headerLength &&
    row.every(cell => 
      typeof cell === 'string' || 
      typeof cell === 'number'
    )
  );
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return start <= end;
};