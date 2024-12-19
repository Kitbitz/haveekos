import React, { useState, useCallback } from 'react';
import { Loader, Eye, EyeOff, Trash2, CreditCard, Scissors, Banknote, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';
import { useGoogleSheets } from '../context/GoogleSheetsContext';
import { Order, PaymentMethod, OrderStatus } from '../types/order';
import * as firestoreService from '../services/firestore';
import { formatDateTime } from '../utils/dateUtils';

const OrderDetailsPage: React.FC = () => {
  const { orders, refreshOrders } = useFirestore();
  const { exportToSheets, isExporting } = useGoogleSheets();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isDeletingOrders, setIsDeletingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(() => {
    const saved = localStorage.getItem('showStatusColumn');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => b.timestamp - a.timestamp);
  }, [orders]);

  const setLoading = useCallback((orderId: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [orderId]: isLoading
    }));
  }, []);

  const isOrderLoading = useCallback((orderId: string) => 
    loadingStates[orderId] || false
  , [loadingStates]);

  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedOrders(sortedOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  }, [sortedOrders]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleDeleteSelected = async () => {
    if (!selectedOrders.length || isDeletingOrders) return;

    try {
      setIsDeletingOrders(true);
      setError(null);

      await firestoreService.deleteOrders(selectedOrders);
      await refreshOrders();
      setSelectedOrders([]);
      
    } catch (err) {
      console.error('Error deleting orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete selected orders');
    } finally {
      setIsDeletingOrders(false);
    }
  };

  const handlePaymentChange = async (id: string, isPaid: boolean) => {
    if (isOrderLoading(id)) return;

    try {
      setLoading(id, true);
      setError(null);
      
      await firestoreService.updateOrderPayment(id, isPaid);
      await refreshOrders();
    } catch (err) {
      console.error('Payment update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    } finally {
      setLoading(id, false);
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    if (isOrderLoading(id)) return;

    try {
      setLoading(id, true);
      setError(null);
      
      await firestoreService.updateOrderStatus(id, status);
      await refreshOrders();
    } catch (err) {
      console.error('Status update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setLoading(id, false);
    }
  };

  const handleExport = async () => {
    try {
      setError(null);
      await exportToSheets(orders);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export orders');
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'online':
        return <CreditCard className="w-4 h-4" />;
      case 'cutoff':
        return <Scissors className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExport}
            disabled={isExporting || orders.length === 0}
            className={`
              flex items-center px-4 py-2 rounded-md text-white
              ${isExporting || orders.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              transition-colors
            `}
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Sheets
              </>
            )}
          </button>
          <button
            onClick={() => {
              const newValue = !showStatus;
              setShowStatus(newValue);
              localStorage.setItem('showStatusColumn', JSON.stringify(newValue));
            }}
            className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {showStatus ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Status
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Status
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedOrders.length === sortedOrders.length}
            onChange={handleSelectAll}
            className="mr-2"
          />
          <span>Select All</span>
        </div>
        <button
          onClick={handleDeleteSelected}
          disabled={selectedOrders.length === 0 || isDeletingOrders}
          className={`
            flex items-center px-4 py-2 rounded text-white
            ${selectedOrders.length === 0 || isDeletingOrders
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'}
            transition-colors
          `}
        >
          {isDeletingOrders ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Select</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact/ Locker #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Status</th>
              {showStatus && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order Status</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Updated</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    disabled={isDeletingOrders}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{order.id}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{order.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{order.contactNumber}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {new Date(order.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{order.email}</td>
                <td className="px-4 py-4 text-sm">{order.orderChoice}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">₱{order.totalPrice.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${
                    order.paymentMethod === 'online' 
                      ? 'bg-purple-100 text-purple-800' 
                      : order.paymentMethod === 'cutoff'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span className="ml-1">{order.paymentMethod}</span>
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handlePaymentChange(order.id, !order.isPaid)}
                    disabled={isOrderLoading(order.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      order.isPaid
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {isOrderLoading(order.id) ? (
                      <Loader className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      order.isPaid ? 'Paid' : 'Unpaid'
                    )}
                  </button>
                </td>
                {showStatus && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={isOrderLoading(order.id) || isDeletingOrders}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                )}
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {formatDateTime(order.paymentTimestamp)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {formatDateTime(order.statusTimestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDetailsPage;