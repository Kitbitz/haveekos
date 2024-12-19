import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { useExport } from '../hooks/useExport';
import { Order } from '../App';

interface ExportManagerProps {
  orders: Order[];
  startDate: string;
  endDate: string;
}

const ExportManager: React.FC<ExportManagerProps> = ({ orders, startDate, endDate }) => {
  const { exportOrders, isExporting, error, clearError } = useExport();

  const handleExport = async () => {
    try {
      const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined;

      await exportOrders(orders, dateRange);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
          <button
            onClick={clearError}
            className="absolute top-0 right-0 p-4"
          >
            &times;
          </button>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          flex items-center px-4 py-2 rounded
          ${isExporting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'}
          text-white transition-colors
        `}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export to Sheets'}
      </button>
    </div>
  );
};

export default ExportManager;