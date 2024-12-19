import React, { useState } from 'react';
import { Phone, Save, Loader, AlertCircle, Edit2 } from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';
import type { GCashSettings } from '../types/settings';

const GCashSettings: React.FC = () => {
  const { gcashSettings, updateGCashSettings } = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<GCashSettings>({
    primary: gcashSettings?.primary || '',
    secondary: gcashSettings?.secondary || '',
    primaryLabel: gcashSettings?.primaryLabel || 'Primary GCash',
    secondaryLabel: gcashSettings?.secondaryLabel || 'Secondary GCash'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLabels, setEditingLabels] = useState(false);

  const formatNumber = (value: string) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Handle +63 prefix
    if (digits.startsWith('63')) {
      digits = '0' + digits.slice(2);
    }
    
    // Format the number with spaces
    if (digits.startsWith('09')) {
      return digits.replace(/(\d{4})(\d{3})?(\d{4})?/, (_, p1, p2, p3) => 
        [p1, p2, p3].filter(Boolean).join(' ')
      );
    }
    
    return digits;
  };

  const handleChange = (field: keyof GCashSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: field === 'primary' || field === 'secondary' ? formatNumber(value) : value
    }));
  };

  const handleSave = async () => {
    try {
      if (!settings.primaryLabel.trim() || !settings.secondaryLabel.trim()) {
        throw new Error('Labels cannot be empty');
      }

      // Validate phone number format
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (settings.primary && !phoneRegex.test(settings.primary.replace(/\s/g, ''))) {
        throw new Error('Primary GCash number must be a valid Philippine mobile number');
      }
      if (settings.secondary && !phoneRegex.test(settings.secondary.replace(/\s/g, ''))) {
        throw new Error('Secondary GCash number must be a valid Philippine mobile number');
      }

      setIsLoading(true);
      setError(null);
      await updateGCashSettings(settings);
      setIsEditing(false);
      setEditingLabels(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update GCash settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-1.5">
            <Phone className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium ml-2 text-blue-800">GCash Settings</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-fit px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            Edit Numbers
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {isEditing ? (
          <>
            {editingLabels ? (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Primary Label</label>
                  <input
                    type="text"
                    value={settings.primaryLabel}
                    onChange={(e) => handleChange('primaryLabel', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter primary label"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Label</label>
                  <input
                    type="text"
                    value={settings.secondaryLabel}
                    onChange={(e) => handleChange('secondaryLabel', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter secondary label"
                  />
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {settings.primaryLabel}
                </label>
                <input
                  type="text"
                  value={settings.primary}
                  onChange={(e) => handleChange('primary', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-base font-mono"
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {settings.secondaryLabel}
                </label>
                <input
                  type="text"
                  value={settings.secondary}
                  onChange={(e) => handleChange('secondary', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-base font-mono"
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <button
                onClick={() => setEditingLabels(!editingLabels)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center"
                type="button"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                {editingLabels ? 'Hide Label Editor' : 'Edit Labels'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="text-sm text-gray-600 font-medium" style={{ fontSize: '14px' }}>
                {gcashSettings?.primaryLabel || 'Primary GCash'}:
              </div>
              <div className="text-base text-gray-700 font-mono tracking-wide text-center" style={{ fontSize: '16px' }}>
                {gcashSettings?.primary || '-- -- --'}
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="text-sm text-gray-600 font-medium" style={{ fontSize: '14px' }}>
                {gcashSettings?.secondaryLabel || 'Secondary GCash'}:
              </div>
              <div className="text-base text-gray-700 font-mono tracking-wide text-center" style={{ fontSize: '16px' }}>
                {gcashSettings?.secondary || '-- -- --'}
              </div>
            </div>
          </>
        )}

        {isEditing && (
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingLabels(false);
                setSettings({
                  primary: gcashSettings?.primary || '',
                  secondary: gcashSettings?.secondary || '',
                  primaryLabel: gcashSettings?.primaryLabel || 'Primary GCash Number',
                  secondaryLabel: gcashSettings?.secondaryLabel || 'Secondary GCash Number'
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

export default GCashSettings;