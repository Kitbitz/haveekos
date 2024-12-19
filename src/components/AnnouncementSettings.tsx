import React, { useState } from 'react';
import { BellRing, Save, Loader, AlertCircle } from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';
import type { AnnouncementSettings as AnnouncementSettingsType } from '../types/settings';

const AnnouncementSettings: React.FC = () => {
  const { announcementSettings, updateAnnouncementSettings } = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<AnnouncementSettingsType>({
    content: announcementSettings?.content || '',
    isEnabled: announcementSettings?.isEnabled || false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await updateAnnouncementSettings(settings);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating announcement settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update announcement settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-4">
      <div className="flex flex-col mb-2">
        <div className="flex items-center mb-2">
          <div className="bg-blue-100 rounded-full p-1.5">
            <BellRing className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium ml-2 text-blue-800" style={{ fontSize: '14px', lineHeight: '1.4' }}>
            Announcement Settings
          </h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-fit px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            Edit Announcement
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
              disabled={!isEditing || isLoading}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-2 text-xs font-medium text-gray-700">
              {settings.isEnabled ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Announcement Content
          </label>
          {isEditing ? (
            <textarea
              value={settings.content}
              onChange={(e) => setSettings(prev => ({ ...prev, content: e.target.value }))}
              disabled={isLoading}
              rows={2}
              className="w-full px-2 py-2 border rounded focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
              style={{ fontSize: '14px', lineHeight: '1.4', maxHeight: '60px' }}
              placeholder="Enter announcement text..."
            />
          ) : (
            <div className="p-2 bg-white rounded shadow-sm border border-gray-100 text-sm">
              {settings.content || 'No announcement set'}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setSettings({
                  content: announcementSettings?.content || '',
                  isEnabled: announcementSettings?.isEnabled || false
                });
              }}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementSettings;