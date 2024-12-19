import React from 'react';
import { CreditCard, Scissors } from 'lucide-react';
interface PaymentMethodProps {
  value: 'cash' | 'online' | 'cutoff';
  onChange: (value: 'cash' | 'online' | 'cutoff') => void;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          <label className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              type="radio"
              className="form-radio text-blue-600 h-5 w-5"
              name="paymentMethod"
              value="cash"
              checked={value === 'cash'}
              onChange={() => onChange('cash')}
            />
            <span className="ml-2 flex items-center text-gray-700 text-sm font-medium whitespace-nowrap">
              <span className="mr-1">₱</span> Cash
            </span>
          </label>
          <label className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              type="radio"
              className="form-radio text-blue-600 h-5 w-5"
              name="paymentMethod"
              value="online"
              checked={value === 'online'}
              onChange={() => {
                onChange('online');
              }}
            />
            <span className="ml-2 flex items-center text-gray-700 text-sm font-medium whitespace-nowrap">
              <CreditCard className="w-4 h-4 mr-1" /> Online
            </span>
          </label>
          <label className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              type="radio"
              className="form-radio text-blue-600 h-5 w-5"
              name="paymentMethod"
              value="cutoff"
              checked={value === 'cutoff'}
              onChange={() => onChange('cutoff')}
            />
            <span className="ml-2 flex items-center text-gray-700 text-sm font-medium whitespace-nowrap">
              <Scissors className="w-4 h-4 mr-1" /> Payday
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;