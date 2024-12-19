import React from 'react'
import { Order } from '../App'
import { Check, Clock } from 'lucide-react'

interface OrderListProps {
  orders: Order[]
  updateOrderStatus: (id: number, status: Order['status']) => void
}

const OrderList: React.FC<OrderListProps> = ({ orders, updateOrderStatus }) => {
  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {orders.map((order) => (
            <li key={order.id} className="py-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{order.name}</h3>
                  <p className="text-gray-600">{order.contactNumber}</p>
                  <p className="text-gray-800">{order.orderChoice}</p>
                  <p className="text-gray-600">Payment: {order.paymentMethod}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Check className="w-4 h-4 mr-1" /> Mark as Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="mt-2 flex items-center text-sm text-green-600 hover:text-green-800"
                    >
                      <Clock className="w-4 h-4 mr-1" /> Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrderList