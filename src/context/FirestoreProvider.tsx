import React, { createContext, useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, Timestamp, enableNetwork, disableNetwork, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { Order } from '../types/order.ts';
import { MenuItem } from '../types/menu.ts';
import * as firestoreService from '../services/firestore.ts';
import { FirestoreContextType, initialState } from './firestoreTypes.ts';

export const FirestoreContext = createContext<FirestoreContextType>(initialState);

const convertTimestampToNumber = (timestamp: Timestamp | number | undefined): number => {
  if (!timestamp) return Date.now();
  return timestamp instanceof Timestamp ? timestamp.toMillis() : timestamp;
};

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Omit<FirestoreContextType, 'refreshOrders' | 'refreshMenuItems' | 'reconnect'>>({
    orders: [],
    menuItems: [],
    categoryColors: {},
    loading: true,
    error: null,
    isOnline: navigator.onLine
  });

  const refreshOrders = useCallback(async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      const ordersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: convertTimestampToNumber(data.timestamp),
          statusTimestamp: convertTimestampToNumber(data.statusTimestamp),
          paymentTimestamp: convertTimestampToNumber(data.paymentTimestamp)
        } as Order;
      });
      setState(prev => ({ ...prev, orders: ordersData, error: null }));
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setState(prev => ({ ...prev, error: 'Failed to refresh orders' }));
    }
  }, []);

  const refreshMenuItems = useCallback(async () => {
    try {
      const menuItemsRef = collection(db, 'menuItems');
      const querySnapshot = await getDocs(menuItemsRef);
      const menuItemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setState(prev => ({ ...prev, menuItems: menuItemsData, error: null }));
    } catch (err) {
      console.error('Error refreshing menu items:', err);
      setState(prev => ({ ...prev, error: 'Failed to refresh menu items' }));
    }
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await enableNetwork(db);
      setState(prev => ({ ...prev, error: null, isOnline: true }));
      await Promise.all([refreshOrders(), refreshMenuItems()]);
    } catch (error) {
      console.error('Reconnection error:', error);
      setState(prev => ({ ...prev, error: 'Failed to reconnect' }));
    }
  }, [refreshOrders, refreshMenuItems]);

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      enableNetwork(db).catch(console.error);
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeMenuItems: (() => void) | undefined;
    let unsubscribeCategoryColors: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        await firestoreService.initializeCollections();

        unsubscribeOrders = onSnapshot(
          collection(db, 'orders'),
          (snapshot) => {
            const ordersData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                timestamp: convertTimestampToNumber(data.timestamp),
                statusTimestamp: convertTimestampToNumber(data.statusTimestamp),
                paymentTimestamp: convertTimestampToNumber(data.paymentTimestamp)
              } as Order;
            });
            setState(prev => ({ ...prev, orders: ordersData, error: null }));
          },
          (error) => {
            console.error('Orders listener error:', error);
            setState(prev => ({ ...prev, error: 'Failed to load orders' }));
          }
        );

        unsubscribeMenuItems = onSnapshot(
          collection(db, 'menuItems'),
          (snapshot) => {
            const menuItemsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as MenuItem[];
            setState(prev => ({ ...prev, menuItems: menuItemsData, error: null }));
          },
          (error) => {
            console.error('Menu items listener error:', error);
            setState(prev => ({ ...prev, error: 'Failed to load menu items' }));
          }
        );

        unsubscribeCategoryColors = onSnapshot(
          collection(db, 'categoryColors'),
          (snapshot) => {
            const colorsData = snapshot.docs.reduce((acc, doc) => {
              const data = doc.data();
              acc[data.category] = data.color;
              return acc;
            }, {} as Record<string, string>);
            setState(prev => ({ ...prev, categoryColors: colorsData, error: null }));
          },
          (error) => {
            console.error('Category colors listener error:', error);
            setState(prev => ({ ...prev, error: 'Failed to load category colors' }));
          }
        );

        setState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        console.error('Setup error:', error);
        setState(prev => ({ ...prev, error: 'Failed to initialize data', loading: false }));
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeMenuItems) unsubscribeMenuItems();
      if (unsubscribeCategoryColors) unsubscribeCategoryColors();
    };
  }, []);

  const contextValue = {
    ...state,
    refreshOrders,
    refreshMenuItems,
    reconnect
  };

  return (
    <FirestoreContext.Provider value={contextValue}>
      {children}
      {!state.isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center justify-between">
          <span>You are currently offline. Some features may be limited.</span>
          <button
            onClick={reconnect}
            className="ml-4 px-3 py-1 bg-yellow-200 rounded-md hover:bg-yellow-300 transition-colors"
          >
            Reconnect
          </button>
        </div>
      )}
    </FirestoreContext.Provider>
  );
};