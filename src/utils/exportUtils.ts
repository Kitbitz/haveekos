import { Order } from '../App';

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
}

export const prepareOrdersForExport = (orders: Order[]): ExportData => {
  const headers = [
    'Order ID',
    'Date',
    'Time',
    'Customer Name',
    'Contact Number',
    'Order Items',
    'Total Price (₱)',
    'Status',
    'Payment Status'
  ];

  const rows = orders.map(order => {
    const date = new Date(order.timestamp);
    return [
      order.id,
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      order.name,
      order.contactNumber,
      order.orderChoice,
      order.totalPrice,
      order.status,
      order.isPaid ? 'Paid' : 'Unpaid'
    ];
  });

  return { headers, rows };
};

export const filterOrdersByDateRange = (
  orders: Order[],
  startDate: string,
  endDate: string
): Order[] => {
  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  return orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= start && orderDate <= end;
  });
};

export const formatSpreadsheetTitle = (startDate?: string, endDate?: string): string => {
  const today = new Date().toISOString().split('T')[0];
  if (!startDate || !endDate) {
    return `Orders_Export_${today}`;
  }
  return `Orders_${startDate}_to_${endDate}`;
};