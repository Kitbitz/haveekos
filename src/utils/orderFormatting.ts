import { Order } from '../App';

export interface FormattedOrderData {
  headers: string[];
  rows: string[][];
}

export const formatOrdersForSheet = (orders: Order[]): FormattedOrderData => {
  const headers = [
    'Order ID',
    'Date',
    'Time',
    'Customer Name',
    'Contact Number',
    'Order Items',
    'Total Price',
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
      order.totalPrice.toFixed(2),
      order.status,
      order.isPaid ? 'Paid' : 'Unpaid'
    ];
  });

  return { headers, rows };
};

export const validateOrderData = (data: FormattedOrderData): boolean => {
  if (!data.headers.length || !data.rows.length) {
    return false;
  }

  const headerCount = data.headers.length;
  return data.rows.every(row => row.length === headerCount);
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString()}_to_${end.toLocaleDateString()}`;
};