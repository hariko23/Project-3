import { useState, useEffect, useMemo } from 'react';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import Translator from './Translator';

/**
 * Seasonal menu items configuration
 * Can be configured by menu item IDs or names
 * Update this list to change which items are featured as seasonal
 */
const SEASONAL_MENU_ITEM_IDS = [6, 12, 22, 28]; // Example: Matcha Milk Tea, Peach Oolong Tea, Peach Slush, Tiger Sugar Milk
// Alternative: Use names instead
// const SEASONAL_MENU_ITEM_NAMES = ['Matcha Milk Tea', 'Peach Oolong Tea', 'Peach Slush', 'Tiger Sugar Milk'];

/**
 * Menu Board View component
 * Minimal display of menu items organized by category
 * Features seasonal menu item spotlight
 */
function MenuBoardView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Identify seasonal menu items
  const seasonalItems = useMemo(() => {
    return menuItems.filter(item => SEASONAL_MENU_ITEM_IDS.includes(item.menuitemid));
  }, [menuItems]);

  // Group menu items by category (excluding seasonal items from regular display)
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    const seasonalIds = new Set(SEASONAL_MENU_ITEM_IDS);
    
    menuItems.forEach(item => {
      // Skip seasonal items in regular category display (they're shown in spotlight)
      if (seasonalIds.has(item.menuitemid)) {
        return;
      }
      
      if (!grouped[item.drinkcategory]) {
        grouped[item.drinkcategory] = [];
      }
      grouped[item.drinkcategory].push(item);
    });
    return grouped;
  }, [menuItems]);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const items = await getAllMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center bg-background">
        <h1 className="text-2xl font-normal text-foreground">Menu Board</h1>
        <p className="mt-5 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex justify-end mb-4">
        <Translator />
      </div>
      <h1 className="text-4xl font-bold text-center mb-8">Menu</h1>
      
      <div className="max-w-6xl mx-auto">
        {/* Seasonal Spotlight Section */}
        {seasonalItems.length > 0 && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-lg p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl mr-3">✨</span>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Seasonal Specials
                </h2>
                <span className="text-4xl ml-3">✨</span>
              </div>
              <p className="text-center text-white text-lg mb-6 opacity-95">
                Limited time offers - Try our seasonal favorites!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {seasonalItems.map((item) => (
                  <div 
                    key={item.menuitemid} 
                    className="bg-card rounded-lg p-5 shadow-xl border-4 border-yellow-300 transform hover:scale-105 transition-transform duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full">
                        SEASONAL
                      </span>
                    </div>
                    {item.image_url && (
                      <div className="mb-3">
                        <img 
                          src={item.image_url} 
                          alt={item.menuitemname}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-foreground mb-1">
                        {item.menuitemname}
                      </span>
                      <span className="text-sm text-muted-foreground mb-2">{item.drinkcategory}</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Regular Menu Items by Category */}
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-border pb-2 text-foreground">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.menuitemid} className="p-4 border border-border rounded hover:shadow-md transition-shadow bg-card">
                  {item.image_url && (
                    <div className="mb-3">
                      <img 
                        src={item.image_url} 
                        alt={item.menuitemname}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-foreground">{item.menuitemname}</span>
                    <span className="text-lg font-bold text-foreground">${item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuBoardView;
