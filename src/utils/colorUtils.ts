import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { MenuItem } from '../types/menu';

const CATEGORY_COLORS_COLLECTION = 'categoryColors';

// Generate a random pastel color with better contrast
export function generatePastelColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL values with better visibility
  const hue = hash % 360;
  const saturation = 60 + (hash % 20); // 60-80% saturation
  const lightness = 75 + (hash % 10); // 75-85% lightness
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export async function getCategoryColor(category: string): Promise<string> {
  try {
    const colorsRef = collection(db, CATEGORY_COLORS_COLLECTION);
    const q = query(colorsRef, where('category', '==', category));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().color;
    }

    // Generate and save new color if none exists
    const newColor = generatePastelColor(category + Date.now().toString());
    await addDoc(colorsRef, {
      category,
      color: newColor,
      createdAt: new Date()
    });

    return newColor;
  } catch (error) {
    console.error('Error getting category color:', error);
    return generatePastelColor(category); // Fallback to generated color
  }
}

export async function setCategoryColor(category: string, color: string): Promise<void> {
  try {
    const colorsRef = collection(db, CATEGORY_COLORS_COLLECTION);
    const q = query(colorsRef, where('category', '==', category));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(colorsRef, {
        category,
        color,
        createdAt: new Date()
      });
    } else {
      const colorDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, CATEGORY_COLORS_COLLECTION, colorDoc.id), {
        color,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error setting category color:', error);
    throw error;
  }
}

export async function getAllCategoryColors(): Promise<Record<string, string>> {
  try {
    const querySnapshot = await getDocs(collection(db, CATEGORY_COLORS_COLLECTION));
    const colors: Record<string, string> = {};
    querySnapshot.forEach(doc => {
      const data = doc.data();
      colors[data.category] = data.color;
    });
    return colors;
  } catch (error) {
    console.error('Error getting all category colors:', error);
    return {};
  }
}

export async function ensureCategoryHasColor(category: string): Promise<string> {
  try {
    const color = await getCategoryColor(category);
    if (!color) {
      const newColor = generatePastelColor(category + Date.now().toString());
      await setCategoryColor(category, newColor);
      return newColor;
    }
    return color;
  } catch (error) {
    console.error('Error ensuring category color:', error);
    return generatePastelColor(category); // Fallback
  }
}