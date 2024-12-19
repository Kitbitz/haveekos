import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { MenuItem } from '../../types/menu';
import ImageUpload from '../ImageUpload';
import { ensureCategoryHasColor } from '../../utils/colorUtils';
import * as menuService from '../../services/menuService';

interface AddMenuItemProps {
  categories: string[];
  onItemAdded: () => Promise<void>;
}

const AddMenuItem: React.FC<AddMenuItemProps> = ({ categories, onItemAdded }) => {
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: '',
    imageUrl: null,
    quantity: 0,
    totalSold: 0
  });
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = async () => {
    try {
      setError(null);

      if (!newItem.name?.trim()) {
        setError('Item name is required');
        return;
      }

      if (!newItem.category) {
        setError('Category is required');
        return;
      }

      if (typeof newItem.price !== 'number' || newItem.price <= 0) {
        setError('Price must be a positive number');
        return;
      }

      if (typeof newItem.quantity !== 'number' || newItem.quantity < 0) {
        setError('Quantity must be a non-negative number');
        return;
      }

      const category = newItem.category === 'new' ? newCategory : newItem.category;
      
      if (newItem.category === 'new' && !newCategory?.trim()) {
        setError('New category name is required');
        return;
      }

      await ensureCategoryHasColor(category);

      const itemToAdd = {
        name: newItem.name.trim(),
        category,
        price: Number(newItem.price),
        quantity: Number(newItem.quantity),
        totalSold: 0,
        imageUrl: newItem.imageUrl
      };

      await menuService.addMenuItem(itemToAdd);
      await onItemAdded();
      
      setNewItem({
        name: '',
        price: 0,
        category: '',
        imageUrl: null,
        quantity: 0,
        totalSold: 0
      });
      setNewCategory('');
      setError(null);

    } catch (err) {
      console.error('Error adding menu item:', err);
      setError(err instanceof Error ? err.message : 'Failed to add menu item');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div>
          <ImageUpload
            imageUrl={newItem.imageUrl}
            onImageUpload={(url) => setNewItem(prev => ({ ...prev, imageUrl: url }))}
            onImageDelete={() => setNewItem(prev => ({ ...prev, imageUrl: null }))}
            size="small"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Item Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            value={newItem.price || ''}
            onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            className="w-full border rounded px-3 py-2"
            step="0.01"
            placeholder="Price"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            value={newItem.quantity || ''}
            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded px-3 py-2"
            min="0"
            placeholder="Quantity"
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={newItem.category}
            onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
            <option value="new">+ Add New Category</option>
          </select>
          {newItem.category === 'new' && (
            <div className="absolute z-10 mt-1 w-full">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white shadow-lg"
                placeholder="New Category Name"
              />
            </div>
          )}
        </div>
        <div>
          <button
            onClick={handleAddItem}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMenuItem;