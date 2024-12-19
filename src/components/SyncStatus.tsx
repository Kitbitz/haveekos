import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { SyncState } from '../types/sync';

interface SyncStatusProps {
  state: SyncState;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ state }) => {
  if (state.status === 'idle' && !state.message) return null;

  const statusConfig = {
    idle: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    syncing: {
      icon: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  };

  const config = statusConfig[state.status];

  return (
    <div 
      className={`
        rounded-md p-3 ${config.bgColor} mb-4 
        transition-all duration-300 ease-in-out
        ${state.message ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
      `}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className={`ml-3 ${config.textColor}`}>
          <p className="text-sm font-medium">
            {state.message || (
              state.status === 'syncing' 
                ? 'Syncing changes...' 
                : 'All changes synced'
            )}
          </p>
          {state.pendingChanges > 0 && (
            <p className="mt-1 text-sm">
              {state.pendingChanges} pending {state.pendingChanges === 1 ? 'change' : 'changes'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;