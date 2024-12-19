import React, { useState, useMemo } from 'react';
import { useFirestore } from '../context/FirestoreContext';
import AddMenuItem from './menu/AddMenuItem';
import MenuItemList from './menu/MenuItemList';
import CategoryColorManager from './CategoryColorManager';
import InventoryStats from './InventoryStats';

const AdminMenu: React.FC = () => {
  const { menuItems, categoryColors, refreshMenuItems } = useFirestore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showColorManager, setShowColorManager] = useState(true);

  const categories = useMemo(() => 
    Array.from(new Set(menuItems.map(item => item.category))).sort()
  , [menuItems]);

  const filteredMenuItems = useMemo(() => 
    menuItems.filter(item => 
      selectedCategories.length === 0 || selectedCategories.includes(item.category)
    )
  , [menuItems, selectedCategories]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <button
          onClick={() => setShowColorManager(!showColorManager)}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showColorManager ? 'Hide' : 'Show'} Category Colors
        </button>
      </div>

      <InventoryStats menuItems={menuItems} />

      {showColorManager && <CategoryColorManager />}

      <AddMenuItem 
        categories={categories}
        onItemAdded={refreshMenuItems}
      />

      <MenuItemList
        items={filteredMenuItems}
        categories={categories}
        categoryColors={categoryColors}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        onItemUpdated={refreshMenuItems}
      />
    </div>
  );
};

export default AdminMenu;