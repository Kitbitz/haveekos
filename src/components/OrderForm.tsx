import React, { useState, useRef, useMemo } from 'react';
import { Plus, Minus, AlertCircle, Phone } from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';
import ThankYouModal from './ThankYouModal';
import PaymentMethod from './PaymentMethod';
import GCashDialog from './GCashDialog';
import Announcement from './Announcement';
import { MenuItem } from '../types/menu';
import { PaymentMethod as PaymentMethodType } from '../types/order';

interface OrderFormProps {
  onSubmit: (orderData: {
    name: string;
    contactNumber?: string;
    email?: string;
    orderChoice: string;
    totalPrice: number;
    paymentMethod: PaymentMethodType;
  }) => Promise<void>;
  menuItems: MenuItem[];
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, menuItems }) => {
  const { categoryColors, gcashSettings } = useFirestore();
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [error, setError] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Chao Fan');
  const placeOrderButtonRef = useRef<HTMLButtonElement>(null);
  const [showGcashDialog, setShowGcashDialog] = useState(false);

  const handleQuantityChange = (itemId: string, change: number) => {
    if (isSubmitting) return;

    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;

    if (item.quantity === 0 && change > 0) {
      setError(`${item.name} is currently out of stock`);
      return;
    }

    setOrderItems(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty > item.quantity) {
        setError(`Only ${item.quantity} ${item.name}(s) available`);
        return prev;
      }

      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
    setError('');
  };

  const calculateTotal = () => {
    return Object.entries(orderItems).reduce((sum, [itemId, quantity]) => {
      const item = menuItems.find(menuItem => menuItem.id === itemId);
      return sum + (item ? item.price * quantity : 0);
    }, 0);
  };

  const validateOrder = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (Object.keys(orderItems).length === 0) {
      setError('Please select at least one item');
      return false;
    }

    for (const [itemId, quantity] of Object.entries(orderItems)) {
      const item = menuItems.find(menuItem => menuItem.id === itemId);
      if (!item) {
        setError('One or more items are no longer available');
        return false;
      }
      if (quantity > item.quantity) {
        setError(`Insufficient stock for ${item.name}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!validateOrder()) {
        setIsSubmitting(false);
        return;
      }

      const orderChoice = Object.entries(orderItems)
        .map(([itemId, quantity]) => {
          const item = menuItems.find(menuItem => menuItem.id === itemId);
          return item ? `${quantity}x ${item.name}` : '';
        })
        .filter(Boolean)
        .join(', ');

      if (!orderChoice) {
        throw new Error('Please select at least one item');
      }

      await onSubmit({
        name: name.trim(),
        contactNumber: contactNumber.trim() || undefined,
        email: email.trim() || undefined,
        orderChoice,
        totalPrice: calculateTotal(),
        paymentMethod
      });

      setName('');
      setContactNumber('');
      setEmail('');
      setOrderItems({});
      setError('');
      setShowThankYou(true);
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = Object.values(orderItems).reduce((sum, quantity) => sum + quantity, 0);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
    return uniqueCategories.map(category => ({
      id: category,
      name: category,
      color: categoryColors[category] || '#f3f4f6'
    }));
  }, [menuItems, categoryColors]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const renderMenuItem = (item: MenuItem) => (
    <div
      key={item.id}
      className="flex bg-white border rounded-lg overflow-hidden transition-all duration-200 h-[100px] relative"
      style={{ backgroundColor: categoryColors[item.category] }}
    >
      {item.imageUrl && (
        <div className="w-[100px] h-full flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-800 break-words pr-16 leading-tight">
            {item.name}
            {item.quantity === 0 && (
              <span className="ml-2 text-xs text-red-600 font-normal">
                Out of Stock
              </span>
            )}
          </h4>
          <p className="text-sm text-gray-900 font-medium">₱{item.price.toFixed(2)}</p>
          <p className="text-xs text-gray-600">Available: {item.quantity}</p>
        </div>
        
        <div className="absolute top-3 right-3 flex flex-col items-center space-y-1">
          <button
            type="button"
            onClick={() => handleQuantityChange(item.id, 1)}
            className={`
              w-7 h-7 flex items-center justify-center rounded-full
              ${item.quantity === 0
                ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                : 'text-blue-600 border-blue-600 hover:bg-blue-50'}
              border transition-colors
            `}
            disabled={isSubmitting || item.quantity === 0 || (orderItems[item.id] || 0) >= item.quantity}
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="font-semibold text-center w-7 text-sm">
            {orderItems[item.id] || 0}
          </span>
          <button
            type="button"
            onClick={() => handleQuantityChange(item.id, -1)}
            className="w-7 h-7 flex items-center justify-center border rounded-full text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!orderItems[item.id] || isSubmitting}
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Place Your Order
        </h2>
        <button
          type="button"
          onClick={() => setShowGcashDialog(true)}
          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors flex items-center"
        >
          <Phone className="w-3 h-3 mr-1" />
          View GCash Numbers
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactNumber">
              Locker Number
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="contactNumber"
              type="tel"
              placeholder="Your Locker Number"
              value={contactNumber}
              onChange={(e) => {
                setContactNumber(e.target.value);
                setError('');
              }}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email"
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <PaymentMethod 
              value={paymentMethod} 
              onChange={(value) => setPaymentMethod(value)}
            />
          </div>
          <Announcement />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="block text-gray-700 text-sm font-bold">Menu Items</span>
          <div className="flex gap-2 items-center">
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : '#f3f4f6',
                  color: selectedCategory === category.id ? '#1f2937' : '#4b5563'
                }}
              >
                {category.name}
              </button>
            ))}
            {/* "All" button hidden but preserved for future use */}
            {/* To reactivate: Remove the "hidden" class and update styling as needed */}
            <button
              type="button"
              onClick={() => setSelectedCategory('Chao Fan')}
              className={`hidden px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMenuItems.map(renderMenuItem)}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Total Items: {totalItems}</p>
          <p className="text-xl font-bold text-blue-600">Total: ₱{calculateTotal().toFixed(2)}</p>
        </div>
        <button
          ref={placeOrderButtonRef}
          type="submit"
          disabled={isSubmitting || totalItems === 0}
          className={`
            bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transform transition-all duration-200 hover:scale-105
            ${(isSubmitting || totalItems === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
          `}
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>

      {showThankYou && (
        <ThankYouModal 
          onClose={() => setShowThankYou(false)} 
          buttonPosition={placeOrderButtonRef.current?.getBoundingClientRect()}
        />
      )}
      <GCashDialog 
        isOpen={showGcashDialog} 
        onClose={() => setShowGcashDialog(false)} 
      />
    </form>
  );
};

export default OrderForm;