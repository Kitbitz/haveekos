import React from 'react';
import { X } from 'lucide-react';
import ExportProgress from './ExportProgress';
import ExportError from './ExportError';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress?: { current: number; total: number; status: string } | null;
  error?: string | null;
  onRetry?: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  error,
  onRetry
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Export to Google Sheets</h2>
          
          {error ? (
            <ExportError message={error} onRetry={onRetry} />
          ) : progress ? (
            <ExportProgress
              current={progress.current}
              total={progress.total}
              status={progress.status}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Preparing export...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;