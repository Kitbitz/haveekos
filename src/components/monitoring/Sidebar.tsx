import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { menuItems } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useLocalStorage('monitoringExpandedCategories', [] as string[]);
  const [selectedCategory, setSelectedCategory] = useLocalStorage('monitoringSelectedCategory', '');
  const [selectedMenuItem, setSelectedMenuItem] = useLocalStorage('monitoringSelectedMenuItem', '');

  const categories = useMemo(() => {
    const categoryMap = new Map();
    menuItems.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      categoryMap.get(item.category).push(item);
    });
    return Array.from(categoryMap.entries());
  }, [menuItems]);

  const filteredCategories = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return categories.filter(([category, items]) => 
      category.toLowerCase().includes(searchLower) ||
      items.some((item: any) => item.name.toLowerCase().includes(searchLower))
    );
  }, [categories, searchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory('');
      setSelectedMenuItem('');
    } else {
      setSelectedCategory(category);
      setSelectedMenuItem('');
    }
  };

  const handleMenuItemSelect = (category: string, itemName: string) => {
    if (selectedMenuItem === itemName) {
      setSelectedMenuItem('');
    } else {
      setSelectedCategory(category);
      setSelectedMenuItem(itemName);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedMenuItem('');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600">Categories</h3>
          <button 
            onClick={handleClearFilters}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear filters"
          >
            <Filter className={`w-4 h-4 ${selectedCategory || selectedMenuItem ? 'text-blue-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <div className="space-y-2">
          {filteredCategories.map(([category, items]) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  toggleCategory(category);
                  handleCategorySelect(category);
                }}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                  selectedCategory === category 
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{category}</span>
                {expandedCategories.includes(category) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedCategories.includes(category) && (
                <div className="bg-gray-50 border-t">
                  {(items as any[]).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemSelect(category, item.name)}
                      className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                        selectedMenuItem === item.name
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;