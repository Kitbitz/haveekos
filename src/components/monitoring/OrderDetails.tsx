import React from 'react';
import { X } from 'lucide-react';
import { Order } from '../../types/order';
import { useFirestore } from '../../context/FirestoreContext';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose }) => {
  const { menuItems } = useFirestore();

  const parseOrderItems = (orderChoice: string) => {
    const items = orderChoice.split(',').map(item => item.trim());
    const parsedItems = items.map(item => {
      const match = item.match(/(\d+)x\s+(.+)/);
      if (match) {
        const [, quantity, name] = match;
        const menuItem = menuItems.find(item => item.name === name);
        return {
          quantity: parseInt(quantity),
          name,
          category: menuItem?.category || 'Other'
        };
      }
      return null;
    }).filter(Boolean);

    const groupedItems = parsedItems.reduce((acc, item) => {
      if (!item) return acc;
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof parsedItems>);

    return groupedItems;
  };

  const orderItems = parseOrderItems(order.orderChoice);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">{order.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Locker Number</p>
              <p className="font-medium">{order.contactNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium">
                {new Date(order.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                order.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : order.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Order Items</h3>
            <div className="space-y-4">
              {Object.entries(orderItems).map(([category, items]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold">₱{order.totalPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                {order.isPaid ? 'Paid' : 'Unpaid'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;