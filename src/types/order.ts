export type OrderStatus = 'pending' | 'approved' | 'cancelled';
export type PaymentMethod = 'cash' | 'online' | 'cutoff';

export interface Order {
  id: string;
  name: string;
  contactNumber: string;
  email: string;
  orderChoice: string;
  status: OrderStatus;
  isPaid: boolean;
  timestamp: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  statusTimestamp?: number;
  paymentTimestamp?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const ORDER_STATUS_DISPLAY: Record<OrderStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  cancelled: 'Cancelled'
};

export const ORDER_STATUS_VALUES: Record<string, OrderStatus> = {
  'Pending': 'pending',
  'Approved': 'approved',
  'Cancelled': 'cancelled'
};