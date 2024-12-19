import React from 'react';
import { Phone, X } from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';

interface GCashDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GCashDialog: React.FC<GCashDialogProps> = ({ isOpen, onClose }) => {
  const { gcashSettings } = useFirestore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute top-0 right-0 mt-24 mr-4 bg-white rounded-lg shadow-xl w-80 transform transition-transform duration-200 ease-out"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Phone className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">GCash Numbers</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">{gcashSettings?.primaryLabel || 'Primary GCash'}</div>
                <div className="text-lg font-mono font-medium text-gray-900 bg-gray-50 p-2 rounded">{gcashSettings?.primary || '-- -- --'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">{gcashSettings?.secondaryLabel || 'Secondary GCash'}</div>
                <div className="text-lg font-mono font-medium text-gray-900 bg-gray-50 p-2 rounded">{gcashSettings?.secondary || '-- -- --'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GCashDialog;