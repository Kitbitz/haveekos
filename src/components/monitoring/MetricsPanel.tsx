import React from 'react';
import { Clock, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

const MetricsPanel: React.FC = () => {
  const { orders } = useFirestore();

  const metrics = {
    todayOrders: orders.filter(order => {
      const today = new Date();
      const orderDate = new Date(order.timestamp);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    }).length,
    totalCustomers: new Set(orders.map(order => order.name)).size,
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center">
          <Clock className="w-10 h-10 text-blue-500 bg-blue-100 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Today's Orders</p>
            <p className="text-2xl font-bold">{metrics.todayOrders}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center">
          <Users className="w-10 h-10 text-green-500 bg-green-100 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center">
          <ShoppingBag className="w-10 h-10 text-yellow-500 bg-yellow-100 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="text-2xl font-bold">{metrics.pendingOrders}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center">
          <TrendingUp className="w-10 h-10 text-purple-500 bg-purple-100 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">₱{metrics.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;