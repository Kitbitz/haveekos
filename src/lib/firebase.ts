import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDoc,
  Timestamp,
  enableNetwork,
  disableNetwork,
  setDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Load Firebase configuration from environment variables
const firebaseConfig = { 
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing required Firebase configuration: ${missingKeys.join(', ')}`);
  }
};

// Validate configuration before initializing
validateFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

// Enable offline persistence with error handling
const setupPersistence = async () => {
  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    });
    console.log('Offline persistence enabled successfully');
    return true;
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence.');
    } else {
      console.error('Error enabling offline persistence:', err);
    }
    return false;
  }
};

// Initialize collections with default data if needed
const initializeCollections = async () => {
  try {
    const batch = writeBatch(db);
    let hasChanges = false;

    // Check if settings collection exists
    const settingsRef = doc(db, 'settings', 'gcash');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      batch.set(settingsRef, {
        primary: '',
        secondary: '',
        primaryLabel: 'Primary GCash Number',
        secondaryLabel: 'Secondary GCash Number',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      hasChanges = true;
    }

    const collections = [
      {
        name: 'menuItems',
        defaultData: [{
          name: 'Sweet Chicken',
          price: 45.00,
          category: 'Meats',
          quantity: 10,
          totalSold: 0,
          createdAt: serverTimestamp()
        }]
      },
      {
        name: 'orders',
        defaultData: []
      },
      {
        name: 'categoryColors',
        defaultData: []
      }
    ];

    for (const { name, defaultData } of collections) {
      const collectionRef = collection(db, name);
      const snapshot = await getDocs(collectionRef);

      if (snapshot.empty && defaultData.length > 0) {
        for (const item of defaultData) {
          const docRef = doc(collection(db, name));
          batch.set(docRef, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    return false;
  }
};

// Initialize Firebase services
const initializeFirebase = async () => {
  try {
    const persistenceEnabled = await setupPersistence();
    const collectionsInitialized = await initializeCollections();
    return { 
      success: true, 
      persistenceEnabled,
      collectionsInitialized
    };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return {
      success: false,
      persistenceEnabled: false,
      collectionsInitialized: false,
      error
    };
  }
};

export { 
  db, 
  storage, 
  auth, 
  app,
  initializeFirebase,
  Timestamp,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDoc,
  enableNetwork,
  disableNetwork,
  setDoc
};