import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  DocumentReference 
} from 'firebase/firestore';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
}

const MENU_COLLECTION = 'menuItems';

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, MENU_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

export const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, MENU_COLLECTION), {
      ...item,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (id: string, item: Partial<MenuItem>): Promise<void> => {
  try {
    if (!id) {
      throw new Error('Invalid menu item ID');
    }
    const docRef: DocumentReference = doc(db, MENU_COLLECTION, id);
    await updateDoc(docRef, {
      ...item,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error('Invalid menu item ID');
    }
    const docRef: DocumentReference = doc(db, MENU_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};