import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder } from '../api/orderApi';
import Button from './ui/Button';
import Receipt from './Receipt';
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
 * Cart item structure
 */
interface CartItem {
  menuitemid: number;
  name: string;
  basePrice: number;
  price: number;
  quantity: number;
  size: DrinkSize;
  toppings: string[]; // Array of topping IDs
}

/**
 * Idle timeout duration in milliseconds (30 seconds)
 */
const IDLE_TIMEOUT = 30000;

/**
 * Seasonal menu items configuration
 * Same as MenuBoardView - update this to change seasonal items
 */
const SEASONAL_MENU_ITEM_IDS = [6, 12, 22, 28]; // Matcha Milk Tea, Peach Oolong Tea, Peach Slush, Tiger Sugar Milk

/**
 * Attract Screen Component
 * Displays when kiosk is idle to attract customer attention
 * Features seasonal menu items spotlight
 */
function AttractScreen({ onInteract, seasonalItems }: { onInteract: () => void; seasonalItems: MenuItem[] }) {
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex flex-col items-center justify-center z-50 cursor-pointer overflow-y-auto py-8"
      onClick={onInteract}
      onTouchStart={onInteract}
      onMouseMove={onInteract}
    >
      <div className="text-center text-white px-8 w-full max-w-6xl">
        {/* Header Section */}
        <div className="mb-8 animate-pulse">
          <div className="text-8xl mb-6 animate-bounce">🧋</div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 drop-shadow-lg">
            Welcome to Boba Shop
          </h1>
          <p className="text-2xl md:text-3xl mb-4 drop-shadow-md">
            Touch anywhere to start ordering
          </p>
          <div className="text-xl md:text-2xl opacity-90 drop-shadow-sm">
            ✨ Fresh drinks made just for you ✨
          </div>
        </div>

        {/* Seasonal Items Spotlight */}
        {seasonalItems.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex items-center justify-center mb-6">
              <span className="text-4xl mr-3">⭐</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Seasonal Specials
              </h2>
              <span className="text-4xl ml-3">⭐</span>
            </div>
            <p className="text-xl md:text-2xl mb-6 opacity-95">
              Limited time offers - Try our seasonal favorites!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
              {seasonalItems.map((item) => (
                <div 
                  key={item.menuitemid}
                  className="bg-white rounded-xl p-6 shadow-2xl border-4 border-yellow-300 transform hover:scale-105 transition-transform duration-200"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-full">
                      SEASONAL
                    </span>
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                      {item.menuitemname}
                    </span>
                    <span className="text-base md:text-lg text-gray-600 mb-3">{item.drinkcategory}</span>
                    <span className="text-3xl md:text-4xl font-bold text-purple-600">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 text-xl md:text-2xl opacity-90 drop-shadow-sm">
          👆 Tap anywhere to begin 👆
        </div>
      </div>
    </div>
  );
}

/**
 * Customer Kiosk Layout component
 * Customer-facing self-service kiosk interface for ordering
 * Features:
 * - Large, touch-friendly menu display organized by category
 * - Shopping cart functionality
 * - Order submission
 * - Receipt display
 * - Idle timeout with attract screen
 */
function CustomerKioskLayout() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [selectedSize, setSelectedSize] = useState<DrinkSize>('Medium');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [receiptData, setReceiptData] = useState<{
    orderNumber: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    timestamp: string;
  } | null>(null);
  
  const idleTimerRef = useRef<number | null>(null);

  // Identify seasonal menu items
  const seasonalItems = useMemo(() => {
    return menuItems.filter(item => SEASONAL_MENU_ITEM_IDS.includes(item.menuitemid));
  }, [menuItems]);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    return [...new Set(menuItems.map(item => item.drinkcategory))];
  }, [menuItems]);

  // Filter menu items by selected category
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.drinkcategory === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  useEffect(() => {
    loadMenuItems();
  }, []);

  /**
   * Reset idle timer on user interaction
   */
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // If we're showing attract screen, hide it
    setIsIdle(false);
    
    // Set new timeout
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT);
  }, []);

  /**
   * Handle user interaction to dismiss attract screen
   */
  const handleInteraction = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  /**
   * Set up idle timeout detection
   */
  useEffect(() => {
    // Start the idle timer
    resetIdleTimer();

    // Event listeners for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer, true);
    });

    // Cleanup
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [resetIdleTimer]);

  /**
   * Load all menu items
   */
  const loadMenuItems = async () => {
    try {
      const items = await getAllMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error('Error loading menu items:', err);
      alert('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add item to cart
   * @param menuItem - Menu item to add
   * @param size - Size of the drink
   */
  const addToCart = (menuItem: MenuItem, size: DrinkSize = selectedSize) => {
    resetIdleTimer(); // Reset idle timer on interaction
    const toppings = [...selectedToppings];
    const toppingPrice = toppings.reduce((sum, toppingId) => {
      const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
      return sum + (topping?.price || 0);
    }, 0);
    const price = (menuItem.price * SIZE_MULTIPLIERS[size]) + toppingPrice;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.menuitemid === menuItem.menuitemid && 
                item.size === size && 
                JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
      );
      if (existingItem) {
        return prevCart.map(item =>
          item.menuitemid === menuItem.menuitemid && 
          item.size === size && 
          JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        menuitemid: menuItem.menuitemid,
        name: menuItem.menuitemname,
        basePrice: menuItem.price,
        price: price,
        quantity: 1,
        size: size,
        toppings: toppings
      }];
    });
    
    // Clear topping selection after adding to cart
    setSelectedToppings([]);
  };

  /**
   * Toggle topping selection
   * @param toppingId - Topping ID to toggle
   */
  const toggleTopping = (toppingId: string) => {
    resetIdleTimer();
    setSelectedToppings(prev => {
      if (prev.includes(toppingId)) {
        return prev.filter(id => id !== toppingId);
      }
      return [...prev, toppingId];
    });
  };

  /**
   * Update item quantity in cart
   * @param menuitemid - Menu item ID
   * @param size - Size of the item
   * @param quantity - New quantity
   */
  const updateCartQuantity = (menuitemid: number, size: DrinkSize, toppings: string[], quantity: number) => {
    resetIdleTimer(); // Reset idle timer on interaction
    if (quantity <= 0) {
      removeFromCart(menuitemid, size, toppings);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.menuitemid === menuitemid && 
        item.size === size && 
        JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
          ? { ...item, quantity }
          : item
      )
    );
  };

  /**
   * Update item size in cart
   * @param menuitemid - Menu item ID
   * @param currentSize - Current size
   * @param newSize - New size
   */
  const updateCartSize = (menuitemid: number, currentSize: DrinkSize, toppings: string[], newSize: DrinkSize) => {
    resetIdleTimer(); // Reset idle timer on interaction
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.menuitemid === menuitemid && 
            item.size === currentSize && 
            JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())) {
          const toppingPrice = item.toppings.reduce((sum, toppingId) => {
            const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
            return sum + (topping?.price || 0);
          }, 0);
          const newPrice = (item.basePrice * SIZE_MULTIPLIERS[newSize]) + toppingPrice;
          return { ...item, size: newSize, price: newPrice };
        }
        return item;
      })
    );
  };

  /**
   * Remove item from cart
   * @param menuitemid - Menu item ID to remove
   * @param size - Size of the item
   * @param toppings - Toppings of the item
   */
  const removeFromCart = (menuitemid: number, size: DrinkSize, toppings: string[]) => {
    resetIdleTimer(); // Reset idle timer on interaction
    setCart(prevCart => prevCart.filter(
      item => !(
        item.menuitemid === menuitemid && 
        item.size === size && 
        JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
      )
    ));
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
    resetIdleTimer(); // Reset idle timer on interaction
    setCart([]);
  };

  /**
   * Get current week number for order
   */
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  /**
   * Submit order
   */
  const submitOrder = async () => {
    resetIdleTimer(); // Reset idle timer on interaction
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      const orderData = {
        timeoforder: new Date().toISOString(),
        customerid: null,
        employeeid: 1, // Default employee ID for kiosk orders
        totalcost: cartTotal,
        orderweek: getCurrentWeek(),
        orderItems: cart.map(item => ({
          menuitemid: item.menuitemid,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
          toppings: item.toppings // Send toppings array to backend
        }))
      };

      const result = await createOrder(orderData);

      // Prepare receipt data
      setReceiptData({
        orderNumber: result.orderid,
        items: cart.map(item => {
          let itemName = `${item.name} (${item.size})`;
          if (item.toppings.length > 0) {
            const toppingNames = item.toppings.map(id => {
              const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
              return topping?.name || id;
            }).join(', ');
            itemName += ` + ${toppingNames}`;
          }
          return {
            name: itemName,
            quantity: item.quantity,
            price: item.price
          };
        }),
        total: cartTotal,
        timestamp: orderData.timeoforder
      });

      // Show receipt and clear cart
      setShowReceipt(true);
      clearCart();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Insufficient inventory')) {
        alert('Sorry, we cannot fulfill this order due to insufficient inventory. Please try again later.');
      } else {
        alert(`Failed to submit order: ${errorMessage}`);
      }
      console.error('Error submitting order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-normal mb-4">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Attract Screen - shown when idle */}
      {isIdle && <AttractScreen onInteract={handleInteraction} seasonalItems={seasonalItems} />}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Receipt
          orderNumber={receiptData.orderNumber}
          items={receiptData.items}
          total={receiptData.total}
          timestamp={receiptData.timestamp}
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 text-gray-800 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Link to="/home">
            <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800">
              ← Back to Home
            </Button>
          </Link>
          <Translator />
        </div>
        <h1 className="text-4xl font-bold text-center mb-2">Welcome to Boba Shop</h1>
        <p className="text-center text-lg text-gray-600">Order your favorite drinks</p>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Menu Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Category Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => {
                resetIdleTimer();
                setSelectedCategory('all');
              }}
              className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  resetIdleTimer();
                  setSelectedCategory(category);
                }}
                className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Size Selector */}
          <div className="mb-6 bg-white border-2 border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Select Size:</h3>
            <div className="flex gap-3">
              {(['Small', 'Medium', 'Large'] as DrinkSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    resetIdleTimer();
                    setSelectedSize(size);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                    selectedSize === size
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div>{size}</div>
                  <div className="text-sm opacity-80">
                    {size === 'Small' ? '-15%' : size === 'Large' ? '+25%' : 'Base'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Topping Selector */}
          <div className="mb-6 bg-white border-2 border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Add Toppings: {selectedToppings.length > 0 && `(${selectedToppings.length} selected)`}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_TOPPINGS.map((topping) => (
                <button
                  key={topping.id}
                  onClick={() => toggleTopping(topping.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedToppings.includes(topping.id)
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div>{topping.name}</div>
                  <div className="text-xs opacity-80">+${topping.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
            {selectedToppings.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Total toppings: +$
                {selectedToppings.reduce((sum, id) => {
                  const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
                  return sum + (topping?.price || 0);
                }, 0).toFixed(2)}
              </div>
            )}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 text-xl py-10">
                No items found in this category
              </div>
            ) : (
              filteredMenuItems.map((item) => {
                const priceForSize = item.price * SIZE_MULTIPLIERS[selectedSize];
                return (
                  <div
                    key={item.menuitemid}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => addToCart(item)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-gray-800">{item.menuitemname}</h3>
                      <div className="text-right">
                        <span className="text-xl font-bold text-purple-600">${priceForSize.toFixed(2)}</span>
                        <div className="text-sm text-gray-500">{selectedSize}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{item.drinkcategory}</p>
                    <button
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="w-96 bg-gray-50 border-l-2 border-gray-200 p-6 flex flex-col">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Order</h2>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-6">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <div className="text-4xl mb-4">🛒</div>
                <p className="text-lg">Your cart is empty</p>
                <p className="text-sm mt-2">Add items from the menu to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div
                    key={`${item.menuitemid}-${item.size}-${index}`}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                        <p className="text-gray-600 text-sm">${item.price.toFixed(2)} each</p>
                        {item.toppings.length > 0 && (
                          <p className="text-purple-600 text-xs mt-1">
                            Toppings: {item.toppings.map(id => {
                              const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
                              return topping?.name;
                            }).join(', ')}
                          </p>
                        )}
                        
                        {/* Size Selector in Cart */}
                        <div className="flex gap-1 mt-2">
                          {(['Small', 'Medium', 'Large'] as DrinkSize[]).map((size) => (
                            <button
                              key={size}
                              onClick={() => updateCartSize(item.menuitemid, item.size, item.toppings, size)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                item.size === size
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuitemid, item.size, item.toppings)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateCartQuantity(item.menuitemid, item.size, item.toppings, item.quantity - 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.menuitemid, item.size, item.toppings, item.quantity + 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
                      >
                        +
                      </button>
                      <div className="ml-auto text-lg font-bold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <>
              <div className="border-t-2 border-gray-300 pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-semibold text-gray-700">Subtotal:</span>
                  <span className="text-2xl font-bold text-gray-800">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={submitOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-xl font-bold"
                >
                  Place Order
                </Button>
                <Button
                  onClick={clearCart}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 text-lg"
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerKioskLayout;

