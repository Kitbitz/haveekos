import React, { useState } from 'react';
import { Edit, Trash2, Filter, Loader, AlertCircle, RotateCcw } from 'lucide-react';
import { MenuItem } from '../../types/menu';
import ImageUpload from '../ImageUpload';
import * as menuService from '../../services/menuService';

interface MenuItemListProps {
  items: MenuItem[];
  categories: string[];
  categoryColors: Record<string, string>;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onItemUpdated: () => Promise<void>;
}

const MenuItemList: React.FC<MenuItemListProps> = ({
  items,
  categories,
  categoryColors,
  selectedCategories,
  onCategoriesChange,
  onItemUpdated
}) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resettingItems, setResettingItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const handleUpdateItem = async (id: string, data: Partial<MenuItem>) => {
    try {
      setIsLoading(true);
      setError(null);

      await menuService.updateMenuItem(id, data);
      await onItemUpdated();
      setEditingItem(null);
      setError(null);
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update menu item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStats = async (itemId: string) => {
    try {
      if (resettingItems.includes(itemId)) return;
      
      setResettingItems(prev => [...prev, itemId]);
      setError(null);

      await menuService.resetItemStats(itemId);
      await onItemUpdated();
    } catch (err) {
      console.error('Error resetting item stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset item statistics');
    } finally {
      setResettingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0 || isLoading) return;

    const confirmMessage = selectedItems.length === 1
      ? 'Are you sure you want to delete this item?'
      : `Are you sure you want to delete ${selectedItems.length} items?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setIsLoading(true);
      setError(null);

      await menuService.deleteMenuItems(selectedItems);
      await onItemUpdated();
      setSelectedItems([]);
      setError(null);
    } catch (err) {
      console.error('Error deleting menu items:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete selected items');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Menu Items</h3>
          {selectedItems.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isLoading}
              className={`
                flex items-center px-3 py-1 rounded text-white text-sm
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}
                transition-colors
              `}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedItems.length})
                </>
              )}
            </button>
          )}
        </div>
        <div className="relative">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter by category:</span>
            <div className="relative">
              <select
                multiple
                value={selectedCategories}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  onCategoriesChange(options);
                }}
                className="border rounded px-3 py-1 text-sm min-w-[150px] max-h-[100px]"
                size={Math.min(categories.length, 4)}
              >
                {categories.map(category => (
                  <option 
                    key={category} 
                    value={category}
                    className="py-1 px-2 hover:bg-blue-50"
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => onCategoriesChange([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === items.length && items.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-2 text-left">Image</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Total Sold</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <ImageUpload
                    imageUrl={item.imageUrl}
                    onImageUpload={(url) => handleUpdateItem(item.id, { imageUrl: url })}
                    onImageDelete={() => handleUpdateItem(item.id, { imageUrl: null })}
                    size="small"
                  />
                </td>
                <td className="px-4 py-2">
                  {editingItem?.id === item.id ? (
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingItem?.id === item.id ? (
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                      className="border rounded px-2 py-1 w-full"
                      step="0.01"
                    />
                  ) : (
                    `₱${item.price.toFixed(2)}`
                  )}
                </td>
                <td className="px-4 py-2">
                  <span
                    className="px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: categoryColors[item.category] }}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {editingItem?.id === item.id ? (
                    <input
                      type="number"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                      className="border rounded px-2 py-1 w-full"
                      min="0"
                    />
                  ) : (
                    <span className={item.quantity === 0 ? 'text-red-500' : ''}>
                      {item.quantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {item.totalSold || 0}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    {editingItem?.id === item.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateItem(item.id, editingItem)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetStats(item.id)}
                          disabled={resettingItems.includes(item.id)}
                          className={`text-orange-600 hover:text-orange-700 ${resettingItems.includes(item.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Reset Statistics"
                        >
                          {resettingItems.includes(item.id) ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuItemList;