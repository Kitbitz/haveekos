import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { FirestoreProvider } from './context/FirestoreContext';
import { GoogleSheetsProvider } from './context/GoogleSheetsContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FirestoreProvider>
      <GoogleSheetsProvider>
        <App />
      </GoogleSheetsProvider>
    </FirestoreProvider>
  </React.StrictMode>
);