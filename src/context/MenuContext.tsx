import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { MenuItem } from '../types/menu';
import { useFirestore } from './FirestoreContext';

type MenuAction =
  | { type: 'SET_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM'; payload: string };

type MenuState = {
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
};

type MenuContextType = {
  state: MenuState;
  dispatch: React.Dispatch<MenuAction>;
};

export const MenuContext = createContext<MenuContextType | undefined>(undefined);

const menuReducer = (state: MenuState, action: MenuAction): MenuState => {
  switch (action.type) {
    case 'SET_MENU_ITEMS':
      return { ...state, menuItems: action.payload, loading: false };
    case 'ADD_MENU_ITEM':
      return { ...state, menuItems: [...state.menuItems, action.payload] };
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter(item => item.id !== action.payload)
      };
    default:
      return state;
  }
};

const initialState: MenuState = {
  menuItems: [],
  loading: true,
  error: null
};

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(menuReducer, initialState);
  const { menuItems } = useFirestore();

  useEffect(() => {
    dispatch({ type: 'SET_MENU_ITEMS', payload: menuItems });
  }, [menuItems]);

  return (
    <MenuContext.Provider value={{ state, dispatch }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};