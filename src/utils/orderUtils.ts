import { Order } from '../App';

const ORDERS_KEY = 'orders';

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const getOrders = (): Order[] => {
  const ordersJson = localStorage.getItem(ORDERS_KEY);
  return ordersJson ? JSON.parse(ordersJson) : [];
};

export const updateOrderStatus = (id: string, status: Order['status']): void => {
  const orders = getOrders();
  const timestamp = Date.now();
  
  const updatedOrders = orders.map(order =>
    order.id === id ? {
      ...order,
      status,
      statusTimestamp: timestamp,
      statusHistory: [
        ...(order.statusHistory || []),
        { status, timestamp }
      ]
    } : order
  );
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
};

export const updatePaymentStatus = (id: string, isPaid: boolean): void => {
  const orders = getOrders();
  const timestamp = Date.now();
  
  const updatedOrders = orders.map(order =>
    order.id === id ? {
      ...order,
      isPaid,
      paymentTimestamp: timestamp,
      paymentHistory: [
        ...(order.paymentHistory || []),
        { isPaid, timestamp }
      ]
    } : order
  );
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
};

export const getOrdersInDateRange = (startDate: Date, endDate: Date): Order[] => {
  const orders = getOrders();
  return orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

export const initializeSampleOrders = (force: boolean = false): void => {
  const existingOrders = getOrders();
  if (existingOrders.length === 0 || force) {
    const now = Date.now();
    const sampleOrders: Order[] = [
      {
        id: '1028-1',
        name: 'John Doe',
        contactNumber: '123-456-7890',
        orderChoice: '2x Pork Sisig, 1x Calamansi Juice',
        status: 'completed',
        isPaid: true,
        timestamp: now - 86400000, // Yesterday
        totalPrice: 410,
        statusTimestamp: now - 86400000,
        paymentTimestamp: now - 86400000,
        statusHistory: [
          { status: 'pending', timestamp: now - 86400000 },
          { status: 'completed', timestamp: now - 86400000 + 3600000 }
        ],
        paymentHistory: [
          { isPaid: true, timestamp: now - 86400000 + 1800000 }
        ]
      }
    ];
    
    localStorage.setItem(ORDERS_KEY, JSON.stringify(sampleOrders));
  }
};