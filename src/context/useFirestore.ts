import { useContext } from 'react';
import { FirestoreContext } from './FirestoreContext';
import { FirestoreContextType } from './firestoreTypes';

export const useFirestore = (): FirestoreContextType => {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
};