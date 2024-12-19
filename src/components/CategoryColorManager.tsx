import React, { useState, useEffect } from 'react';
import { Edit, Save, RefreshCw } from 'lucide-react';
import { getAllCategoryColors, setCategoryColor, generatePastelColor } from '../utils/colorUtils';
import { useFirestore } from '../context/FirestoreContext';

const CategoryColorManager: React.FC = () => {
  const { menuItems, categoryColors, refreshMenuItems } = useFirestore();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempColors, setTempColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  useEffect(() => {
    setTempColors(categoryColors);
  }, [categoryColors]);

  const handleEditClick = (category: string) => {
    setEditingCategory(category);
    setTempColors(prev => ({
      ...prev,
      [category]: categoryColors[category] || generatePastelColor(category)
    }));
  };

  const handleColorChange = (category: string, color: string) => {
    setTempColors(prev => ({ ...prev, [category]: color }));
  };

  const handleSave = async (category: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await setCategoryColor(category, tempColors[category]);
      setEditingCategory(null);
      await refreshMenuItems();
    } catch (err) {
      console.error('Error saving category color:', err);
      setError('Failed to save color');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateColor = (category: string) => {
    const newColor = generatePastelColor(category + Date.now());
    handleColorChange(category, newColor);
  };

  if (categories.length === 0) {
    return (
      <div className="text-sm text-gray-500 mb-4">
        No categories available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <h3 className="text-sm font-medium mb-2">Category Colors</h3>
      
      {error && (
        <div className="text-xs text-red-600 mb-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
        {categories.map((category) => (
          <div 
            key={category}
            className="flex items-center justify-between p-1.5 rounded border text-sm"
            style={{ backgroundColor: categoryColors[category] }}
          >
            <span className="truncate text-xs mr-1.5 max-w-[80px]" title={category}>
              {category}
            </span>
            {editingCategory === category ? (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => regenerateColor(category)}
                  className="p-0.5 hover:bg-white/20 rounded"
                  title="Generate new color"
                  disabled={isLoading}
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleSave(category)}
                  className="p-0.5 hover:bg-white/20 rounded"
                  disabled={isLoading}
                >
                  <Save className="w-3 h-3" />
                </button>
                <input
                  type="color"
                  value={tempColors[category] || '#ffffff'}
                  onChange={(e) => handleColorChange(category, e.target.value)}
                  className="w-4 h-4 rounded cursor-pointer"
                  disabled={isLoading}
                />
              </div>
            ) : (
              <button
                onClick={() => handleEditClick(category)}
                className="p-0.5 hover:bg-white/20 rounded flex-shrink-0"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryColorManager;