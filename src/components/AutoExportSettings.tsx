import React from 'react';
import { Clock, AlertCircle, Loader } from 'lucide-react';
import { useAutoExport } from '../hooks/useAutoExport';

const AutoExportSettings: React.FC = () => {
  const { settings, updateSettings, error, clearError, isExporting } = useAutoExport();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Automated Export Settings
        </h3>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              disabled={isExporting}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 flex items-center">
              {settings.enabled ? 'Enabled' : 'Disabled'}
              {isExporting && <Loader className="w-4 h-4 ml-2 animate-spin" />}
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Time
          </label>
          <input
            type="time"
            value={settings.time}
            onChange={(e) => updateSettings({ time: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={!settings.enabled || isExporting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Frequency
          </label>
          <select
            value={settings.frequency}
            onChange={(e) => updateSettings({ frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={!settings.enabled || isExporting}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {settings.lastExport && (
        <div className="mt-4 text-sm text-gray-600">
          Last successful export: {new Date(settings.lastExport).toLocaleString()}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        {settings.enabled && (
          <p>
            Next export scheduled for: {getNextExportTime(settings)}
          </p>
        )}
      </div>
    </div>
  );
};

function getNextExportTime(settings: { time: string; frequency: string }): string {
  const now = new Date();
  const [hours, minutes] = settings.time.split(':').map(Number);
  const nextExport = new Date(now);
  nextExport.setHours(hours, minutes, 0, 0);

  if (nextExport <= now) {
    switch (settings.frequency) {
      case 'daily':
        nextExport.setDate(nextExport.getDate() + 1);
        break;
      case 'weekly':
        nextExport.setDate(nextExport.getDate() + 7);
        break;
      case 'monthly':
        nextExport.setMonth(nextExport.getMonth() + 1);
        break;
    }
  }

  return nextExport.toLocaleString();
}

export default AutoExportSettings;