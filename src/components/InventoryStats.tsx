import React from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { MenuItem } from '../types/menu';

interface InventoryStatsProps {
  menuItems: MenuItem[];
}

const InventoryStats: React.FC<InventoryStatsProps> = ({ menuItems }) => {
  const stats = React.useMemo(() => {
    const totalItems = menuItems.length;
    const outOfStock = menuItems.filter(item => item.quantity === 0).length;
    const lowStock = menuItems.filter(item => item.quantity > 0 && item.quantity <= 5).length;
    const totalSold = menuItems.reduce((sum, item) => sum + (item.totalSold || 0), 0);
    const totalAvailable = menuItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalItems,
      outOfStock,
      lowStock,
      totalSold,
      totalAvailable
    };
  }, [menuItems]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Inventory Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-blue-600">
              Available: {stats.totalAvailable}
            </p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Sold</p>
              <p className="text-2xl font-bold text-green-700">{stats.totalSold}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-green-600">
              Across all items
            </p>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Stock Alerts</p>
              <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-red-600">
              Out of Stock: {stats.outOfStock} | Low Stock: {stats.lowStock}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStats;