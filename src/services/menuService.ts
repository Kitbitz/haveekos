import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  serverTimestamp,
  db
} from '../lib/firebase';
import { MenuItem } from '../types/menu';

const MENU_ITEMS_COLLECTION = 'menuItems';

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const menuItemsRef = collection(db, MENU_ITEMS_COLLECTION);
    const menuItemsQuery = query(menuItemsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(menuItemsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MenuItem[];
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw new Error('Failed to fetch menu items');
  }
};

export const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<string> => {
  try {
    if (!item.name?.trim()) {
      throw new Error('Item name is required');
    }

    if (!item.category?.trim()) {
      throw new Error('Category is required');
    }

    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new Error('Price must be a positive number');
    }

    if (typeof item.quantity !== 'number' || item.quantity < 0) {
      throw new Error('Quantity must be a non-negative number');
    }

    const docRef = await addDoc(collection(db, MENU_ITEMS_COLLECTION), {
      ...item,
      name: item.name.trim(),
      category: item.category.trim(),
      price: Number(item.price),
      quantity: Number(item.quantity),
      totalSold: Number(item.totalSold || 0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error instanceof Error ? error : new Error('Failed to add menu item');
  }
};

export const updateMenuItem = async (id: string, data: Partial<MenuItem>): Promise<void> => {
  try {
    if (!id) {
      throw new Error('Invalid menu item ID');
    }

    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp()
    };

    // Validate and process each field
    if ('name' in data) {
      if (!data.name?.trim()) {
        throw new Error('Item name is required');
      }
      updateData.name = data.name.trim();
    }

    if ('price' in data) {
      if (typeof data.price !== 'number' || data.price <= 0) {
        throw new Error('Price must be a positive number');
      }
      updateData.price = Number(data.price);
    }

    if ('quantity' in data) {
      if (typeof data.quantity !== 'number' || data.quantity < 0) {
        throw new Error('Quantity must be a non-negative number');
      }
      updateData.quantity = Number(data.quantity);
    }

    if ('totalSold' in data) {
      if (typeof data.totalSold !== 'number' || data.totalSold < 0) {
        throw new Error('Total sold must be a non-negative number');
      }
      updateData.totalSold = Number(data.totalSold);
    }

    if ('category' in data && data.category) {
      updateData.category = data.category.trim();
    }

    if ('imageUrl' in data) {
      updateData.imageUrl = data.imageUrl;
    }

    const docRef = doc(db, MENU_ITEMS_COLLECTION, id);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error instanceof Error ? error : new Error('Failed to update menu item');
  }
};

export const resetItemStats = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error('Invalid menu item ID');
    }

    const docRef = doc(db, MENU_ITEMS_COLLECTION, id);
    await updateDoc(docRef, {
      quantity: 0,
      totalSold: 0,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error resetting item stats:', error);
    throw error instanceof Error ? error : new Error('Failed to reset item statistics');
  }
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error('Invalid menu item ID');
    }
    const docRef = doc(db, MENU_ITEMS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error instanceof Error ? error : new Error('Failed to delete menu item');
  }
};

export const deleteMenuItems = async (ids: string[]): Promise<void> => {
  try {
    if (!ids.length) {
      throw new Error('No menu items selected for deletion');
    }

    // Delete items sequentially to ensure all deletions complete
    for (const id of ids) {
      await deleteMenuItem(id);
    }
  } catch (error) {
    console.error('Error deleting menu items:', error);
    throw error instanceof Error ? error : new Error('Failed to delete menu items');
  }
};