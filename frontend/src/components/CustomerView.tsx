import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder } from '../api/orderApi';
import Button from './ui/Button';
import Translator from './Translator';

/**
 * Available drink sizes
 */
type DrinkSize = 'Small' | 'Medium' | 'Large';

/**
 * Price multipliers for different sizes
 */
const SIZE_MULTIPLIERS: Record<DrinkSize, number> = {
  'Small': 0.85,
  'Medium': 1.0,
  'Large': 1.25
};

/**
 * Available toppings with their prices
 */
const AVAILABLE_TOPPINGS = [
  { id: 'boba', name: 'Boba', price: 0.50 },
  { id: 'lycheejelly', name: 'Lychee Jelly', price: 0.50 },
  { id: 'grassjelly', name: 'Grass Jelly', price: 0.50 },
  { id: 'pudding', name: 'Pudding', price: 0.75 },
  { id: 'aloevera', name: 'Aloe Vera', price: 0.50 },
  { id: 'redbean', name: 'Red Bean', price: 0.75 },
  { id: 'coffeejelly', name: 'Coffee Jelly', price: 0.50 },
  { id: 'coconutjelly', name: 'Coconut Jelly', price: 0.50 },
  { id: 'chiaseeds', name: 'Chia Seeds', price: 0.50 },
  { id: 'taroballs', name: 'Taro Balls', price: 0.75 },
  { id: 'mangostars', name: 'Mango Stars', price: 0.75 },
  { id: 'rainbowjelly', name: 'Rainbow Jelly', price: 0.50 },
  { id: 'crystalboba', name: 'Crystal Boba', price: 0.75 },
];

/**
 * Available ice levels with database-compatible numeric values
 */
const ICE_LEVELS = [
  { id: 1, name: 'No Ice' },
  { id: 25, name: 'Light Ice' },
  { id: 75, name: 'Regular Ice' },
  { id: 100, name: 'Extra Ice' }
];

/**
 * Available sugar levels with database-compatible numeric values
 */
const SUGAR_LEVELS = [
  { id: 0, name: '0%' },
  { id: 25, name: '25%' },
  { id: 50, name: '50%' },
  { id: 75, name: '75%' },
  { id: 100, name: '100%' }
];

/**
 * Order item structure for the current order being built
 */
interface OrderItem {
  menuitemid: number;
  quantity: number;
  name: string;
  basePrice: number;
  price: number;
  size: DrinkSize;
  toppings: string[];
  iceLevel: number;
  sugarLevel: number;
  isHot: boolean;
}

/**
 * Customer View component
 * Self-service ordering interface for customers with:
 * - Browse menu items by category
 * - Customize drinks (size, ice, sugar, hot options, toppings)
 * - Build and review order
 * - Submit order
 */
function CustomerView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [itemSizes, setItemSizes] = useState<Record<number, DrinkSize>>({});
  const [itemToppings, setItemToppings] = useState<Record<number, string[]>>({});
  const [itemIceLevels, setItemIceLevels] = useState<Record<number, number>>({});
  const [itemSugarLevels, setItemSugarLevels] = useState<Record<number, number>>({});
  const [itemIsHot, setItemIsHot] = useState<Record<number, boolean>>({});
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  /**
   * Load menu items and initialize state
   */
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getAllMenuItems();
      setMenuItems(items);

      // Initialize default values for all items
      const initialQuantities: Record<number, number> = {};
      const initialSizes: Record<number, DrinkSize> = {};
      const initialToppings: Record<number, string[]> = {};
      const initialIceLevels: Record<number, number> = {};
      const initialSugarLevels: Record<number, number> = {};
      const initialIsHot: Record<number, boolean> = {};
      items.forEach(item => {
        initialQuantities[item.menuitemid] = 1;
        initialSizes[item.menuitemid] = 'Medium';
        initialToppings[item.menuitemid] = [];
        initialIceLevels[item.menuitemid] = 75; // regular ice
        initialSugarLevels[item.menuitemid] = 100; // 100% sugar
        initialIsHot[item.menuitemid] = false;
      });
      setItemQuantities(initialQuantities);
      setItemSizes(initialSizes);
      setItemToppings(initialToppings);
      setItemIceLevels(initialIceLevels);
      setItemSugarLevels(initialSugarLevels);
      setItemIsHot(initialIsHot);
    } catch (err) {
      console.error('Error loading menu items:', err);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update quantity for a menu item
   */
  const updateItemQuantity = (menuitemid: number, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [menuitemid]: Math.max(1, quantity)
    }));
  };

  /**
   * Update size for a menu item
   */
  const updateItemSize = (menuitemid: number, size: DrinkSize) => {
    setItemSizes(prev => ({
      ...prev,
      [menuitemid]: size
    }));
  };

  /**
   * Update ice level for a menu item
   */
  const updateItemIceLevel = (menuitemid: number, iceLevel: number) => {
    setItemIceLevels(prev => ({
      ...prev,
      [menuitemid]: iceLevel
    }));
  };

  /**
   * Update sugar level for a menu item
   */
  const updateItemSugarLevel = (menuitemid: number, sugarLevel: number) => {
    setItemSugarLevels(prev => ({
      ...prev,
      [menuitemid]: sugarLevel
    }));
  };

  /**
   * Toggle topping for a menu item
   */
  const toggleTopping = (menuitemid: number, toppingId: string) => {
    setItemToppings(prev => ({
      ...prev,
      [menuitemid]: prev[menuitemid]?.includes(toppingId)
        ? prev[menuitemid].filter(id => id !== toppingId)
        : [...(prev[menuitemid] || []), toppingId]
    }));
  };

  /**
   * Toggle hot option for a menu item
   */
  const toggleItemHot = (menuitemid: number) => {
    const isCurrentlyHot = itemIsHot[menuitemid] || false;
    const willBeHot = !isCurrentlyHot;
    
    setItemIsHot(prev => ({
      ...prev,
      [menuitemid]: willBeHot
    }));
    
    // If making it hot, set ice level to 1 (no ice)
    if (willBeHot) {
      setItemIceLevels(prev => ({
        ...prev,
        [menuitemid]: 1
      }));
    }
  };

  /**
   * Add item to order
   */
  const addToOrder = (menuItem: MenuItem) => {
    const quantity = itemQuantities[menuItem.menuitemid] || 1;
    const size = itemSizes[menuItem.menuitemid] || 'Medium';
    const toppings = itemToppings[menuItem.menuitemid] || [];
    const isHot = itemIsHot[menuItem.menuitemid] || false;
    const iceLevel = isHot ? 1 : (itemIceLevels[menuItem.menuitemid] || 75);
    const sugarLevel = itemSugarLevels[menuItem.menuitemid] || 100;

    const toppingPrice = toppings.reduce((sum, toppingId) => {
      const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
      return sum + (topping?.price || 0);
    }, 0);
    const price = (menuItem.price * SIZE_MULTIPLIERS[size]) + toppingPrice;

    // Check if item exists with same customizations
    const existingItemIndex = currentOrder.findIndex(
      item => item.menuitemid === menuItem.menuitemid && 
              item.size === size &&
              item.iceLevel === iceLevel &&
              item.sugarLevel === sugarLevel &&
              item.isHot === isHot &&
              JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
    );

    if (existingItemIndex >= 0) {
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].quantity += quantity;
      setCurrentOrder(updatedOrder);
    } else {
      const orderItem: OrderItem = {
        menuitemid: menuItem.menuitemid,
        quantity: quantity,
        name: menuItem.menuitemname,
        basePrice: menuItem.price,
        price: price,
        size: size,
        toppings: toppings,
        iceLevel: iceLevel,
        sugarLevel: sugarLevel,
        isHot: isHot
      };
      setCurrentOrder([...currentOrder, orderItem]);
    }

    toast.success(`Added ${menuItem.menuitemname} to order!`);
    
    // Reset to defaults
    setItemQuantities(prev => ({ ...prev, [menuItem.menuitemid]: 1 }));
    setItemToppings(prev => ({ ...prev, [menuItem.menuitemid]: [] }));
    setItemIceLevels(prev => ({ ...prev, [menuItem.menuitemid]: 75 }));
    setItemSugarLevels(prev => ({ ...prev, [menuItem.menuitemid]: 100 }));
    setItemIsHot(prev => ({ ...prev, [menuItem.menuitemid]: false }));
  };

  /**
   * Remove item from order
   */
  const removeFromOrder = (index: number) => {
    const updatedOrder = currentOrder.filter((_, i) => i !== index);
    setCurrentOrder(updatedOrder);
  };

  /**
   * Calculate total price
   */
  const getTotal = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  /**
   * Submit order
   */
  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      toast.warning('Your order is empty');
      return;
    }

    try {
      const getCurrentWeek = () => {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const daysDiff = Math.floor((now.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((daysDiff + yearStart.getDay() + 1) / 7);
      };

      const orderData = {
        timeoforder: new Date().toISOString(),
        customerid: null,
        employeeid: 2, // Customer self-service
        totalcost: getTotal(),
        orderweek: getCurrentWeek(),
        orderItems: currentOrder.map(item => ({
          menuitemid: item.menuitemid,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
          toppings: item.toppings,
          iceLevel: item.iceLevel,
          sugarLevel: item.sugarLevel,
          isHot: item.isHot
        }))
      };

      await createOrder(orderData);
      toast.success('Order submitted successfully!');
      setCurrentOrder([]);
      setOrderSubmitted(true);
      setTimeout(() => setOrderSubmitted(false), 3000);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order');
    }
  };

  /**
   * Get unique categories
   */
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.drinkcategory)))];

  /**
   * Filter menu items by category
   */
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.drinkcategory === selectedCategory);

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading menu...</p>
      </div>
    );
  }

  if (orderSubmitted) {
    return (
      <div className="p-5 text-center bg-green-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Submitted!</h1>
          <p className="text-gray-600">Your order has been sent to the kitchen. Please wait for your order to be prepared.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">Welcome to Our Boba Shop!</h1>
          <p className="text-gray-600">Customize your perfect drink</p>
          <Translator />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-purple-100'
                    }`}
                  >
                    {category === 'all' ? 'All Drinks' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenuItems.map(item => (
                <div key={item.menuitemid} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{item.menuitemname}</h3>
                      <p className="text-sm text-purple-600 font-medium">{item.drinkcategory}</p>
                      <p className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateItemQuantity(item.menuitemid, (itemQuantities[item.menuitemid] || 1) - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="font-medium w-8 text-center">{itemQuantities[item.menuitemid] || 1}</span>
                      <button
                        onClick={() => updateItemQuantity(item.menuitemid, (itemQuantities[item.menuitemid] || 1) + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <div className="flex space-x-2">
                      {Object.keys(SIZE_MULTIPLIERS).map(size => (
                        <button
                          key={size}
                          onClick={() => updateItemSize(item.menuitemid, size as DrinkSize)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            (itemSizes[item.menuitemid] || 'Medium') === size
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ice Level */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ice Level</label>
                    <div className="flex flex-wrap gap-1">
                      {ICE_LEVELS.map(ice => {
                        const isHot = itemIsHot[item.menuitemid] || false;
                        const isDisabled = isHot && ice.id > 1;
                        return (
                          <button
                            key={ice.id}
                            onClick={() => !isDisabled && updateItemIceLevel(item.menuitemid, ice.id)}
                            disabled={isDisabled}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              (itemIceLevels[item.menuitemid] || 75) === ice.id
                                ? 'bg-blue-600 text-white'
                                : isDisabled
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                            }`}
                          >
                            {ice.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sugar Level */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sugar Level</label>
                    <div className="flex flex-wrap gap-1">
                      {SUGAR_LEVELS.map(sugar => (
                        <button
                          key={sugar.id}
                          onClick={() => updateItemSugarLevel(item.menuitemid, sugar.id)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            (itemSugarLevels[item.menuitemid] || 100) === sugar.id
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                          }`}
                        >
                          {sugar.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hot Option */}
                  {item.drinkcategory !== 'Slush' && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleItemHot(item.menuitemid)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          itemIsHot[item.menuitemid]
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        {itemIsHot[item.menuitemid] ? '🔥 Hot' : 'Make it Hot'}
                      </button>
                    </div>
                  )}

                  {/* Toppings */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Toppings</label>
                    <div className="grid grid-cols-2 gap-1">
                      {AVAILABLE_TOPPINGS.map(topping => {
                        const isSelected = (itemToppings[item.menuitemid] || []).includes(topping.id);
                        return (
                          <button
                            key={topping.id}
                            onClick={() => toggleTopping(item.menuitemid, topping.id)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              isSelected
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            {topping.name} (+${topping.price.toFixed(2)})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add to Order Button */}
                  <Button
                    onClick={() => addToOrder(item)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
                  >
                    Add to Order - ${((item.price * SIZE_MULTIPLIERS[itemSizes[item.menuitemid] || 'Medium']) + 
                      (itemToppings[item.menuitemid] || []).reduce((sum, toppingId) => {
                        const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
                        return sum + (topping?.price || 0);
                      }, 0)).toFixed(2)}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Order</h3>
              
              {currentOrder.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your order is empty</p>
              ) : (
                <>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {currentOrder.map((item, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Size: {item.size}</div>
                              <div>Ice: {ICE_LEVELS.find(ice => ice.id === item.iceLevel)?.name}</div>
                              <div>Sugar: {SUGAR_LEVELS.find(sugar => sugar.id === item.sugarLevel)?.name}</div>
                              {item.isHot && <div className="text-red-600">🔥 Hot</div>}
                              {item.toppings.length > 0 && (
                                <div>Toppings: {item.toppings.map(id => AVAILABLE_TOPPINGS.find(t => t.id === id)?.name).join(', ')}</div>
                              )}
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromOrder(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={submitOrder}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                  >
                    Place Order
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerView;

