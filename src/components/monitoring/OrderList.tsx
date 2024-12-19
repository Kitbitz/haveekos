import React, { useState, useMemo } from 'react';
import { Clock, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { Order } from '../../types/order';
import OrderDetails from './OrderDetails';

const ITEMS_PER_PAGE = 10;

type SortField = 'date' | 'name' | 'status';
type SortDirection = 'asc' | 'desc';

const OrderList: React.FC = () => {
  const { orders, menuItems } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const parseOrderItems = (orderChoice: string) => {
    const items = orderChoice.split(',').map(item => item.trim());
    return items.map(item => {
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
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const searchLower = searchTerm.toLowerCase();
        const orderItems = parseOrderItems(order.orderChoice);
        
        // Apply status filters
        if (activeFilters.length > 0 && !activeFilters.includes(order.status)) {
          return false;
        }

        // Apply search filter
        return (
          order.name.toLowerCase().includes(searchLower) ||
          order.orderChoice.toLowerCase().includes(searchLower) ||
          orderItems.some(item => 
            item?.name.toLowerCase().includes(searchLower) ||
            item?.category.toLowerCase().includes(searchLower)
          )
        );
      })
      .map(order => ({
        ...order,
        parsedItems: parseOrderItems(order.orderChoice)
      }))
      .sort((a, b) => {
        switch (sortField) {
          case 'date':
            return sortDirection === 'asc' 
              ? a.timestamp - b.timestamp 
              : b.timestamp - a.timestamp;
          case 'name':
            return sortDirection === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          case 'status':
            return sortDirection === 'asc'
              ? a.status.localeCompare(b.status)
              : b.status.localeCompare(a.status);
          default:
            return 0;
        }
      });
  }, [orders, searchTerm, sortField, sortDirection, activeFilters, menuItems]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveFilters(prev => 
                prev.includes('pending') ? prev.filter(f => f !== 'pending') : [...prev, 'pending']
              )}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeFilters.includes('pending')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilters(prev => 
                prev.includes('approved') ? prev.filter(f => f !== 'approved') : [...prev, 'approved']
              )}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeFilters.includes('approved')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveFilters(prev => 
                prev.includes('cancelled') ? prev.filter(f => f !== 'cancelled') : [...prev, 'cancelled']
              )}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeFilters.includes('cancelled')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Order Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Customer</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Details
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <tr 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(order.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.name}</div>
                  <div className="text-sm text-gray-500">{order.contactNumber}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {order.parsedItems?.map((item, index) => (
                      <div key={index}>
                        {item?.quantity}x {item?.name}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredOrders.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderList;