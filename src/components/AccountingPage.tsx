import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';
import { Order } from '../App';
import { useFirestore } from '../context/FirestoreContext';
import SalesTrendGraph from './SalesTrendGraph';

interface AccountingPageProps {
  orders: Order[];
}

const AccountingPage: React.FC<AccountingPageProps> = () => {
  const { orders } = useFirestore();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0] 
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, dateRange]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const daysDiff = Math.max(1, Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = totalOrders / daysDiff;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      dailyAverage
    };
  }, [filteredOrders, dateRange]);

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Accounting Overview</h1>
      
      <div className="mb-6 flex items-center space-x-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={dateRange.start}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="end-date"
            value={dateRange.end}
            onChange={(e) => handleDateChange('end', e.target.value)}
            min={dateRange.start}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₱ ${stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={(
            <div className="w-8 h-8 flex items-center justify-center text-green-500 font-bold text-xl">
              ₱
            </div>
          )}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          subtitle={`in ${Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))} days`}
          icon={<ShoppingBag className="w-8 h-8 text-blue-500" />}
        />
        <StatCard
          title="Average Order Value"
          value={`₱ ${stats.averageOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
        />
        <StatCard
          title="Daily Average Orders"
          value={stats.dailyAverage.toFixed(2)}
          icon={<Calendar className="w-8 h-8 text-orange-500" />}
        />
      </div>

      <div className="mt-8">
        <SalesTrendGraph 
          orders={filteredOrders}
          startDate={dateRange.start}
          endDate={dateRange.end}
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {icon}
    </div>
    <p className="text-3xl font-bold">{value}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default AccountingPage;