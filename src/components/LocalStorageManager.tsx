import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../context/FirestoreContext';
import { Download, Calendar, Clock, AlertCircle } from 'lucide-react';
import { exportOrders } from '../services/exportService';
import { useAutoExport } from '../hooks/useAutoExport';

const LocalStorageManager: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = useFirestore();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    settings: autoExportSettings,
    updateSettings: updateAutoExportSettings,
    isExporting: isAutoExporting,
    error: autoExportError,
    clearError: clearAutoExportError,
    performExport: performAutoExport
  } = useAutoExport(orders);

  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      let filteredOrders = orders;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          return orderDate >= start && orderDate <= end;
        });
      }

      if (filteredOrders.length === 0) {
        throw new Error('No orders found in the selected date range');
      }

      await exportOrders(filteredOrders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestAutoExport = async () => {
    try {
      await performAutoExport();
    } catch (err) {
      console.error('Test auto-export failed:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Export Orders</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex space-x-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`
                flex items-center px-4 py-2 rounded-md text-white
                ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                transition-colors duration-200
              `}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export to Sheets'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              Automated Export Settings
            </h3>
            <div className="flex items-center space-x-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExportSettings.enabled}
                  onChange={(e) => updateAutoExportSettings({ enabled: e.target.checked })}
                  className="sr-only peer"
                  disabled={isAutoExporting}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {autoExportSettings.enabled ? 'Enabled' : 'Disabled'}
                  {isAutoExporting && <span className="ml-2 text-blue-500">(Exporting...)</span>}
                </span>
              </label>
              <button
                onClick={handleTestAutoExport}
                disabled={!autoExportSettings.enabled || isAutoExporting}
                className={`
                  px-3 py-1 text-sm rounded-md
                  ${(!autoExportSettings.enabled || isAutoExporting) 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white'}
                `}
              >
                Test Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Export Schedule
              </label>
              <select
                value={autoExportSettings.schedule}
                onChange={(e) => updateAutoExportSettings({ 
                  schedule: e.target.value as 'daily' | 'weekly' | 'monthly'
                })}
                disabled={!autoExportSettings.enabled || isAutoExporting}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Export Time
              </label>
              <input
                type="time"
                value={autoExportSettings.time}
                onChange={(e) => updateAutoExportSettings({ time: e.target.value })}
                disabled={!autoExportSettings.enabled || isAutoExporting}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {autoExportSettings.lastExport && (
            <p className="mt-4 text-sm text-gray-600">
              Last export: {new Date(autoExportSettings.lastExport).toLocaleString()}
            </p>
          )}

          {autoExportError && (
            <div className="mt-4 flex items-center bg-red-50 text-red-700 rounded-md p-3">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm flex-grow">{autoExportError}</p>
              <button 
                onClick={clearAutoExportError}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalStorageManager;