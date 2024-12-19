import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ExportStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  onClose: () => void;
}

const ExportStatus: React.FC<ExportStatusProps> = ({ status, message, onClose }) => {
  if (status === 'idle') return null;

  const statusConfig = {
    loading: {
      icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    success: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-md p-4 ${config.bgColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="ml-3 flex-grow">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${config.textColor} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportStatus;