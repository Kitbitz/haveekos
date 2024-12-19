import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot,
  doc,
  query,
  orderBy,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MenuItem } from '../types/menu';
import { Order } from '../types/order';
import { AnnouncementSettings, GCashSettings } from '../types/settings';
import * as firestoreService from '../services/firestore';
import * as menuService from '../services/menuService';

interface FirestoreContextType {
  orders: Order[];
  menuItems: MenuItem[];
  categoryColors: Record<string, string>;
  gcashSettings: GCashSettings | null;
  announcementSettings: AnnouncementSettings | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isReconnecting: boolean;
  refreshOrders: () => Promise<void>;
  refreshMenuItems: () => Promise<void>;
  reconnect: () => Promise<void>;
  updateGCashSettings: (settings: GCashSettings) => Promise<void>;
  updateAnnouncementSettings: (settings: AnnouncementSettings) => Promise<void>;
}

const FirestoreContext = createContext<FirestoreContextType | null>(null);

const useFirestore = () => {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
};

const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [gcashSettings, setGcashSettings] = useState<GCashSettings | null>(null);
  const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);

  const setupListeners = async () => {
    try {
      const newUnsubscribers: (() => void)[] = [];

      // Orders listener
      const ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
      const unsubOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          setOrders(ordersData);
          setError(null);
        },
        (error) => {
          console.error('Orders listener error:', error);
          setError('Failed to load orders. Please check your connection.');
        }
      );
      newUnsubscribers.push(unsubOrders);

      // Menu items listener
      const menuItemsQuery = query(collection(db, 'menuItems'), orderBy('createdAt', 'desc'));
      const unsubMenuItems = onSnapshot(
        menuItemsQuery,
        (snapshot) => {
          const menuItemsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MenuItem[];
          setMenuItems(menuItemsData);
          setError(null);
        },
        (error) => {
          console.error('Menu items listener error:', error);
          setError('Failed to load menu items. Please check your connection.');
        }
      );
      newUnsubscribers.push(unsubMenuItems);

      // Category colors listener
      const unsubCategoryColors = onSnapshot(
        collection(db, 'categoryColors'),
        (snapshot) => {
          const colorsData = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            acc[data.category] = data.color;
            return acc;
          }, {} as Record<string, string>);
          setCategoryColors(colorsData);
          setError(null);
        },
        (error) => {
          console.error('Category colors listener error:', error);
          setError('Failed to load category colors. Please check your connection.');
        }
      );
      newUnsubscribers.push(unsubCategoryColors);

      // GCash settings listener
      const unsubGCashSettings = onSnapshot(
        doc(db, 'settings', 'gcash'),
        (doc) => {
          if (doc.exists()) {
            setGcashSettings(doc.data() as GCashSettings);
            setError(null);
          }
        },
        (error) => {
          console.error('GCash settings listener error:', error);
          setError('Failed to load GCash settings. Please check your connection.');
        }
      );
      newUnsubscribers.push(unsubGCashSettings);

      // Announcement settings listener
      const unsubAnnouncement = onSnapshot(
        doc(db, 'settings', 'announcement'),
        (doc) => {
          if (doc.exists()) {
            setAnnouncementSettings(doc.data() as AnnouncementSettings);
            setError(null);
          }
        },
        (error) => {
          console.error('Announcement settings listener error:', error);
          setError('Failed to load announcement settings. Please check your connection.');
        }
      );
      newUnsubscribers.push(unsubAnnouncement);

      setUnsubscribers(newUnsubscribers);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setError('Failed to initialize data. Please check your connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        await enableNetwork(db);
        await setupListeners();
      } catch (error) {
        console.error('Error enabling network:', error);
        setError('Failed to reconnect. Please try again.');
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      try {
        await disableNetwork(db);
        unsubscribers.forEach(unsubscribe => unsubscribe());
      } catch (error) {
        console.error('Error disabling network:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setupListeners();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const reconnect = async () => {
    if (isReconnecting) return;

    try {
      setIsReconnecting(true);
      setError(null);

      await enableNetwork(db);
      await setupListeners();
      
      setIsOnline(true);
    } catch (error) {
      console.error('Reconnection error:', error);
      setError('Failed to reconnect. Please try again.');
      throw error;
    } finally {
      setIsReconnecting(false);
    }
  };

  const refreshOrders = async () => {
    try {
      const ordersData = await firestoreService.getOrders();
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError('Failed to refresh orders. Please try again.');
      throw err;
    }
  };

  const refreshMenuItems = async () => {
    try {
      const menuItemsData = await menuService.getMenuItems();
      setMenuItems(menuItemsData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing menu items:', err);
      setError('Failed to refresh menu items. Please try again.');
      throw err;
    }
  };

  const updateGCashSettings = async (settings: GCashSettings) => {
    try {
      await firestoreService.updateGCashSettings(settings);
      setError(null);
    } catch (error) {
      console.error('Error updating GCash settings:', error);
      throw error;
    }
  };

  const updateAnnouncementSettings = async (settings: AnnouncementSettings) => {
    try {
      await firestoreService.updateAnnouncementSettings(settings);
      setError(null);
    } catch (error) {
      console.error('Error updating announcement settings:', error);
      throw error;
    }
  };

  const value = {
    orders,
    menuItems,
    categoryColors,
    gcashSettings,
    announcementSettings,
    loading,
    error,
    isOnline,
    isReconnecting,
    refreshOrders,
    refreshMenuItems,
    reconnect,
    updateGCashSettings,
    updateAnnouncementSettings
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
          <span>You are currently offline. Some features may be limited.</span>
          <button
            onClick={reconnect}
            disabled={isReconnecting}
            className={`ml-4 px-4 py-2 rounded-md transition-colors ${
              isReconnecting
                ? 'bg-yellow-200 cursor-not-allowed'
                : 'bg-yellow-200 hover:bg-yellow-300'
            }`}
          >
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </button>
        </div>
      )}
    </FirestoreContext.Provider>
  );
};

export { FirestoreContext, FirestoreProvider, useFirestore };