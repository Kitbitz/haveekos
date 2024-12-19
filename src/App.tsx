import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { HomePage, LoginPage, AdminLayout, OrderDetailsPage, AdminMenu, AccountingPage, LocalStorageManager, OrderMonitoring } from './components';
import { MenuProvider } from './context/MenuContext';
import { useFirestore } from './context/FirestoreContext';
import * as firestoreService from './services/firestore';
import Notification from './components/Notification';
import OAuth2Callback from './components/OAuth2Callback';
import { Order } from './types/order';

interface OrderFormData {
  name: string;
  contactNumber?: string;
  email?: string;
  orderChoice: string;
  totalPrice: number;
  paymentMethod: 'cash' | 'online';
}

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { orders, refreshOrders } = useFirestore();
  const [notification, setNotification] = useState<string | null>(null);
  const [orderCounter, setOrderCounter] = useState(1);

  const handleAddOrder = async (orderData: OrderFormData) => {
    try {
      if (!orderData.name || !orderData.orderChoice) {
        throw new Error('Name and order items are required');
      }

      const today = new Date();
      const orderNumber = orderCounter.toString().padStart(3, '0');
      const orderId = `${today.getMonth() + 1}${today.getDate()}${orderNumber}`;

      const newOrder: Omit<Order, 'id'> = {
        name: orderData.name.trim(),
        contactNumber: orderData.contactNumber?.trim() || '',
        email: orderData.email?.trim() || '',
        orderChoice: orderData.orderChoice,
        totalPrice: orderData.totalPrice,
        status: 'pending',
        isPaid: false,
        paymentMethod: orderData.paymentMethod,
        timestamp: Date.now(),
      };

      const docId = await firestoreService.addOrder(newOrder);
      if (!docId) {
        throw new Error('Failed to get order ID from Firestore');
      }

      await refreshOrders();
      setOrderCounter(prev => prev + 1);
      setNotification('Order placed successfully!');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Order submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      setNotification(errorMessage);
      setTimeout(() => setNotification(null), 3000);
      throw error;
    }
  };

  return (
    <MenuProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage addOrder={handleAddOrder} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth2callback" element={<OAuth2Callback />} />
          <Route path="/admin" element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrderDetailsPage />} />
            <Route path="monitoring" element={<OrderMonitoring />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="storage" element={<LocalStorageManager />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      </Router>
    </MenuProvider>
  );
};

export default App;