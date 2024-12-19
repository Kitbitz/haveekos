import { 
  collection, 
  getDocs, 
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
  db
} from '../lib/firebase';
import { Order, OrderStatus } from '../types/order';
import { MenuItem } from '../types/menu';
import { GCashSettings, AnnouncementSettings } from '../types/settings';
import { syncOrderToSheets } from './googleSheetsService';

const ORDERS_COLLECTION = 'orders';
const MENU_ITEMS_COLLECTION = 'menuItems';
const SETTINGS_COLLECTION = 'settings';

export const getOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const ordersQuery = query(ordersRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  } catch (error) {
    console.error('Error getting orders:', error);
    throw new Error('Failed to fetch orders');
  }
};

const parseOrderItems = (orderChoice: string): Map<string, number> => {
  const itemMap = new Map<string, number>();
  const items = orderChoice.split(',').map(item => item.trim());
  
  for (const item of items) {
    const match = item.match(/(\d+)x\s+(.+)/);
    if (match) {
      const [, quantity, name] = match;
      itemMap.set(name, parseInt(quantity));
    }
  }
  
  return itemMap;
};

const verifyAndUpdateInventory = async (
  orderItems: Map<string, number>,
  batch: any
): Promise<void> => {
  const menuItemsRef = collection(db, MENU_ITEMS_COLLECTION);
  const menuSnapshot = await getDocs(menuItemsRef);
  const menuItems = new Map(
    menuSnapshot.docs.map(doc => [doc.data().name, { id: doc.id, ...doc.data() }])
  );

  for (const [itemName, quantity] of orderItems) {
    const menuItem = menuItems.get(itemName) as MenuItem & { id: string };
    if (!menuItem) {
      throw new Error(`Menu item not found: ${itemName}`);
    }

    if (menuItem.quantity < quantity) {
      throw new Error(`Insufficient stock for ${itemName}`);
    }

    const itemRef = doc(db, MENU_ITEMS_COLLECTION, menuItem.id);
    batch.update(itemRef, {
      quantity: menuItem.quantity - quantity,
      totalSold: (menuItem.totalSold || 0) + quantity,
      updatedAt: serverTimestamp()
    });
  }
};

export const addOrder = async (orderData: Omit<Order, 'id'>): Promise<string> => {
  const batch = writeBatch(db);
  
  try {
    if (!orderData.name?.trim()) {
      throw new Error('Name is required');
    }

    if (!orderData.orderChoice?.trim()) {
      throw new Error('Order items are required');
    }

    // Parse order items and update inventory
    const orderItems = parseOrderItems(orderData.orderChoice);
    await verifyAndUpdateInventory(orderItems, batch);

    // Create the order
    const orderRef = doc(collection(db, ORDERS_COLLECTION));
    const orderDoc = {
      ...orderData,
      name: orderData.name.trim(),
      contactNumber: orderData.contactNumber?.trim() || '',
      email: orderData.email?.trim() || '',
      orderChoice: orderData.orderChoice.trim(),
      status: orderData.status || 'pending',
      isPaid: orderData.isPaid || false,
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(orderRef, orderDoc);

    // Commit all changes in a single batch
    await batch.commit();

    // Sync with Google Sheets
    try {
      await syncOrderToSheets({ 
        id: orderRef.id, 
        ...orderDoc 
      } as Order);
    } catch (sheetError) {
      console.error('Failed to sync order to sheets:', sheetError);
      // Don't throw here as the order was successfully created
    }

    return orderRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error instanceof Error ? error : new Error('Failed to add order');
  }
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
  const batch = writeBatch(db);
  
  try {
    if (!id) {
      throw new Error('Invalid order ID');
    }

    const orderRef = doc(db, ORDERS_COLLECTION, id);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const updateData = {
      status,
      statusTimestamp: Date.now(),
      updatedAt: serverTimestamp()
    };

    batch.update(orderRef, updateData);
    await batch.commit();

    // Sync to Google Sheets
    try {
      await syncOrderToSheets({ 
        id, 
        ...orderDoc.data(), 
        ...updateData 
      } as Order);
    } catch (sheetError) {
      console.error('Failed to sync order status to sheets:', sheetError);
      // Don't throw here as the status was successfully updated
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error instanceof Error ? error : new Error('Failed to update order status');
  }
};

export const updateOrderPayment = async (id: string, isPaid: boolean): Promise<void> => {
  const batch = writeBatch(db);
  
  try {
    if (!id) {
      throw new Error('Invalid order ID');
    }

    const orderRef = doc(db, ORDERS_COLLECTION, id);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const updateData = {
      isPaid,
      paymentTimestamp: Date.now(),
      updatedAt: serverTimestamp()
    };

    batch.update(orderRef, updateData);
    await batch.commit();

    // Sync to Google Sheets
    try {
      await syncOrderToSheets({ 
        id, 
        ...orderDoc.data(), 
        ...updateData 
      } as Order);
    } catch (sheetError) {
      console.error('Failed to sync payment status to sheets:', sheetError);
      // Don't throw here as the payment was successfully updated
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error instanceof Error ? error : new Error('Failed to update payment status');
  }
};

export const deleteOrders = async (orderIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  
  try {
    if (!orderIds.length) {
      throw new Error('No orders selected for deletion');
    }

    // First verify all orders exist
    const orderRefs = orderIds.map(id => doc(db, ORDERS_COLLECTION, id));
    const orderDocs = await Promise.all(orderRefs.map(ref => getDoc(ref)));
    
    const missingOrders = orderDocs
      .map((doc, index) => ({ exists: doc.exists(), id: orderIds[index] }))
      .filter(order => !order.exists)
      .map(order => order.id);

    if (missingOrders.length > 0) {
      throw new Error(`Orders not found: ${missingOrders.join(', ')}`);
    }

    // Delete orders in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
      const currentBatch = writeBatch(db);
      const batchOrderIds = orderIds.slice(i, i + BATCH_SIZE);
      
      batchOrderIds.forEach(id => {
        const orderRef = doc(db, ORDERS_COLLECTION, id);
        currentBatch.delete(orderRef);
      });

      await currentBatch.commit();
    }
  } catch (error) {
    console.error('Error deleting orders:', error);
    throw error instanceof Error ? error : new Error('Failed to delete orders');
  }
};

export const updateGCashSettings = async (settings: GCashSettings): Promise<void> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, 'gcash');
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating GCash settings:', error);
    throw error instanceof Error ? error : new Error('Failed to update GCash settings');
  }
};

export const updateAnnouncementSettings = async (settings: AnnouncementSettings): Promise<void> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, 'announcement');
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating announcement settings:', error);
    throw error instanceof Error ? error : new Error('Failed to update announcement settings');
  }
};