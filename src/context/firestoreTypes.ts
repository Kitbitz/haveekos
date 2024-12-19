import { Order } from '../types/order';
import { MenuItem } from '../types/menu';
import { GCashSettings } from '../types/settings';

export interface FirestoreContextType {
  orders: Order[];
  menuItems: MenuItem[];
  categoryColors: Record<string, string>;
  gcashSettings: GCashSettings | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  refreshOrders: () => Promise<void>;
  refreshMenuItems: () => Promise<void>;
  reconnect: () => Promise<void>;
  updateGCashSettings: (settings: GCashSettings) => Promise<void>;
}

export const initialState: FirestoreContextType = {
  orders: [],
  menuItems: [],
  categoryColors: {},
  gcashSettings: null,
  loading: true,
  error: null,
  isOnline: navigator.onLine,
  refreshOrders: async () => {},
  refreshMenuItems: async () => {},
  reconnect: async () => {},
  updateGCashSettings: async () => {}
};