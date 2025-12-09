import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder } from '../api/orderApi';
import Button from './ui/Button';
import Receipt from './Receipt';
import Translator from './Translator';
import SpeakableText from './SpeakableText';

/**
 * Weather data structure
 */
interface WeatherData {
  temp: number;
  description: string;
  condition: string;
}

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
 * Available ice levels
 */
const ICE_LEVELS = [
  { id: 1, name: 'No Ice' },
  { id: 25, name: 'Light Ice' },
  { id: 75, name: 'Regular Ice' },
  { id: 100, name: 'Extra Ice' }
];

/**
 * Available sugar levels
 */
const SUGAR_LEVELS = [
  { id: 0, name: '0%' },
  { id: 25, name: '25%' },
  { id: 50, name: '50%' },
  { id: 75, name: '75%' },
  { id: 100, name: '100%' }
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
  iceLevel: number; // Ice level (1, 25, 75, 100)
  sugarLevel: number; // Sugar level (0, 25, 50, 75, 100)
  isHot: boolean; // Hot option
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
            <SpeakableText>Welcome to Boba Shop</SpeakableText>
          </h1>
          <p className="text-2xl md:text-3xl mb-4 drop-shadow-md">
            <SpeakableText>Touch anywhere to start ordering</SpeakableText>
          </p>
          <div className="text-xl md:text-2xl opacity-90 drop-shadow-sm">
            <SpeakableText>✨ Fresh drinks made just for you ✨</SpeakableText>
          </div>
        </div>

        {/* Seasonal Items Spotlight */}
        {seasonalItems.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex items-center justify-center mb-6">
              <span className="text-4xl mr-3">⭐</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                <SpeakableText>Seasonal Specials</SpeakableText>
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
                  className="bg-card rounded-xl p-6 shadow-2xl border-4 border-yellow-300 transform hover:scale-105 transition-transform duration-200"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-full">
                      SEASONAL
                    </span>
                  </div>
                  {item.image_url && (
                    <div className="mb-4">
                      <img 
                        src={item.image_url} 
                        alt={item.menuitemname}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex flex-col text-center">
                    <span className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {item.menuitemname}
                    </span>
                    <span className="text-base md:text-lg text-muted-foreground mb-3">{item.drinkcategory}</span>
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
  const [selectedIceLevel, setSelectedIceLevel] = useState<number>(75); // Default to regular ice
  const [selectedSugarLevel, setSelectedSugarLevel] = useState<number>(100); // Default to 100%
  const [selectedIsHot, setSelectedIsHot] = useState<boolean>(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<MenuItem | null>(null);
  const [receiptData, setReceiptData] = useState<{
    orderNumber: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    timestamp: string;
  } | null>(null);
  
  // Weather-related state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  
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
    fetchWeather();
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Full error details:', {
        message: errorMessage,
        error: err,
        apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
      });
      toast.error(`Failed to load menu items: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch weather data for temperature-based suggestions
   */
  const fetchWeather = async () => {
    try {
      // College Station, TX coordinates
      const lat = 30.6280;
      const lon = -96.3344;
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
      );
      
      if (!response.ok) {
        throw new Error('Weather fetch failed');
      }
      
      const data = await response.json();
      
      // Map weather codes to descriptions
      const getWeatherDescription = (code: number) => {
        const weatherCodes: Record<number, string> = {
          0: 'Clear sky ☀️',
          1: 'Mainly clear 🌤️',
          2: 'Partly cloudy ⛅',
          3: 'Overcast ☁️',
          45: 'Foggy 🌫️',
          48: 'Depositing rime fog 🌫️',
          51: 'Light drizzle 🌦️',
          53: 'Moderate drizzle 🌦️',
          55: 'Dense drizzle 🌧️',
          56: 'Light freezing drizzle 🌨️',
          57: 'Dense freezing drizzle ❄️',
          61: 'Slight rain 🌧️',
          63: 'Moderate rain 🌧️',
          65: 'Heavy rain 🌧️',
          66: 'Light freezing rain 🌨️',
          67: 'Heavy freezing rain ❄️',
          71: 'Slight snow 🌨️',
          73: 'Moderate snow ❄️',
          75: 'Heavy snow ❄️',
          77: 'Snow grains 🌨️',
          80: 'Slight rain showers 🌦️',
          81: 'Moderate rain showers 🌧️',
          82: 'Violent rain showers 🌧️',
          85: 'Slight snow showers 🌨️',
          86: 'Heavy snow showers ❄️',
          95: 'Thunderstorm ⛈️',
          96: 'Thunderstorm with slight hail ⛈️',
          99: 'Thunderstorm with heavy hail ⛈️'
        };
        return weatherCodes[code] || 'Unknown weather 🌡️';
      };
      
      const weatherData: WeatherData = {
        temp: Math.round(data.current.temperature_2m),
        description: getWeatherDescription(data.current.weather_code),
        condition: data.current.weather_code < 10 ? 'clear' : 'cloudy'
      };
      
      setWeather(weatherData);
      
      // Show suggestion banner for 10 seconds
      setShowSuggestion(true);
      const timer = setTimeout(() => setShowSuggestion(false), 10000);
      return () => clearTimeout(timer);
      
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }
  };

  /**
   * Get weather-based drink suggestion
   */
  const getWeatherSuggestion = () => {
    if (!weather) return null;
    
    if (weather.temp > 65) {
      // Hot weather - suggest slush
      const slushItems = menuItems.filter(item => item.drinkcategory === 'Slush');
      if (slushItems.length > 0) {
        // Randomly pick a slush for variety
        const randomSlush = slushItems[Math.floor(Math.random() * slushItems.length)];
        return {
          item: randomSlush,
          reason: `It's ${weather.temp}°F! Perfect weather for a refreshing ${randomSlush.menuitemname}!`
        };
      }
    } else {
      // Cool weather - suggest Iced Americano
      const americano = menuItems.find(item => item.menuitemname === 'Iced Americano');
      if (americano) {
        return {
          item: americano,
          reason: `It's ${weather.temp}°F! Try our energizing ${americano.menuitemname} to warm up your day!`
        };
      }
    }
    return null;
  };

  /**
   * Add suggested weather item to cart
   */
  const addSuggestedItem = () => {
    const suggestion = getWeatherSuggestion();
    if (suggestion) {
      addToCart(suggestion.item);
      setShowSuggestion(false);
      toast.success(`Added ${suggestion.item.menuitemname} to cart!`);
    }
  };

  /**
   * Open customization modal for a menu item
   * @param menuItem - Menu item to customize
   */
  const openCustomizationModal = (menuItem: MenuItem) => {
    resetIdleTimer();
    setItemToCustomize(menuItem);
    // Reset to defaults when opening modal
    setSelectedSize('Medium');
    setSelectedToppings([]);
    setSelectedIceLevel(75);
    setSelectedSugarLevel(100);
    setSelectedIsHot(false);
    setShowCustomizationModal(true);
  };

  /**
   * Close customization modal and reset state
   */
  const closeCustomizationModal = () => {
    setShowCustomizationModal(false);
    setItemToCustomize(null);
    // Reset to defaults
    setSelectedToppings([]);
    setSelectedIceLevel(75);
    setSelectedSugarLevel(100);
    setSelectedIsHot(false);
  };

  /**
   * Add item to cart with current customizations
   */
  const addToCartFromModal = () => {
    if (!itemToCustomize) return;
    
    resetIdleTimer();
    const toppings = [...selectedToppings];
    const iceLevel = selectedIsHot ? 1 : selectedIceLevel; // Force no ice if hot
    const sugarLevel = selectedSugarLevel;
    const isHot = selectedIsHot;
    const size = selectedSize;
    
    const toppingPrice = toppings.reduce((sum, toppingId) => {
      const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
      return sum + (topping?.price || 0);
    }, 0);
    const price = (itemToCustomize.price * SIZE_MULTIPLIERS[size]) + toppingPrice;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.menuitemid === itemToCustomize.menuitemid && 
                item.size === size && 
                item.iceLevel === iceLevel &&
                item.sugarLevel === sugarLevel &&
                item.isHot === isHot &&
                JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
      );
      if (existingItem) {
        return prevCart.map(item =>
          item.menuitemid === itemToCustomize.menuitemid && 
          item.size === size && 
          item.iceLevel === iceLevel &&
          item.sugarLevel === sugarLevel &&
          item.isHot === isHot &&
          JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        menuitemid: itemToCustomize.menuitemid,
        name: itemToCustomize.menuitemname,
        basePrice: itemToCustomize.price,
        price: price,
        quantity: 1,
        size: size,
        toppings: toppings,
        iceLevel: iceLevel,
        sugarLevel: sugarLevel,
        isHot: isHot
      }];
    });
    
    // Close modal and reset customizations
    closeCustomizationModal();
    toast.success(`Added ${itemToCustomize.menuitemname} to cart!`);
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
      toast.warning('Your cart is empty');
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
          toppings: item.toppings, // Send toppings array to backend
          iceLevel: item.iceLevel,
          sugarLevel: item.sugarLevel,
          isHot: item.isHot
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
        toast.error('Sorry, we cannot fulfill this order due to insufficient inventory. Please try again later.');
      } else {
        toast.error(`Failed to submit order: ${errorMessage}`);
      }
      console.error('Error submitting order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="text-2xl font-normal mb-4">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
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

      {/* Customization Modal */}
      {showCustomizationModal && itemToCustomize && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeCustomizationModal}
        >
          <div 
            className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  <SpeakableText>Customize {itemToCustomize.menuitemname}</SpeakableText>
                </h2>
                <p className="text-muted-foreground">
                  <SpeakableText>{itemToCustomize.drinkcategory}</SpeakableText>
                </p>
              </div>
              <button
                onClick={closeCustomizationModal}
                className="text-3xl font-bold text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <SpeakableText text="Close">×</SpeakableText>
              </button>
            </div>

            {/* Size Selector */}
            <div className="mb-6 bg-muted border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Select Size:</h3>
              <div className="flex gap-3">
                {(['Small', 'Medium', 'Large'] as DrinkSize[]).map((size) => {
                  const priceForSize = itemToCustomize.price * SIZE_MULTIPLIERS[size];
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        resetIdleTimer();
                        setSelectedSize(size);
                      }}
                      className={`flex-1 px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <div><SpeakableText>{size}</SpeakableText></div>
                      <div className="text-sm opacity-80">
                        <SpeakableText>${priceForSize.toFixed(2)}</SpeakableText>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Temperature Selector */}
            <div className="mb-6 bg-muted border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Temperature:</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetIdleTimer();
                    setSelectedIsHot(false);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                    !selectedIsHot
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <SpeakableText>Cold/Iced</SpeakableText>
                </button>
                <button
                  onClick={() => {
                    resetIdleTimer();
                    setSelectedIsHot(true);
                    setSelectedIceLevel(1); // Auto set to "No Ice" when hot
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                    selectedIsHot
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <SpeakableText>Hot</SpeakableText>
                </button>
              </div>
            </div>

            {/* Ice Level Selector */}
            <div className="mb-6 bg-muted border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Ice Level:</h3>
              <div className="flex gap-2">
                {ICE_LEVELS.map((ice) => {
                  const isDisabled = selectedIsHot && ice.id > 1; // Disable all except "No Ice" when hot
                  return (
                    <button
                      key={ice.id}
                      onClick={() => {
                        if (!isDisabled) {
                          resetIdleTimer();
                          setSelectedIceLevel(ice.id);
                        }
                      }}
                      disabled={isDisabled}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedIceLevel === ice.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <SpeakableText>{ice.name}</SpeakableText>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sugar Level Selector */}
            <div className="mb-6 bg-muted border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Sugar Level:</h3>
              <div className="flex gap-2">
                {SUGAR_LEVELS.map((sugar) => (
                  <button
                    key={sugar.id}
                    onClick={() => {
                      resetIdleTimer();
                      setSelectedSugarLevel(sugar.id);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSugarLevel === sugar.id
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <SpeakableText>{sugar.name}</SpeakableText>
                  </button>
                ))}
              </div>
            </div>

            {/* Topping Selector */}
            <div className="mb-6 bg-muted border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-foreground">
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
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <div><SpeakableText>{topping.name}</SpeakableText></div>
                    <div className="text-xs opacity-80">
                      <SpeakableText>+${topping.price.toFixed(2)}</SpeakableText>
                    </div>
                  </button>
                ))}
              </div>
              {selectedToppings.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Total toppings: +$
                  {selectedToppings.reduce((sum, id) => {
                    const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
                    return sum + (topping?.price || 0);
                  }, 0).toFixed(2)}
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-foreground">Total Price:</span>
                <span className="text-3xl font-bold text-purple-600">
                  ${(
                    (itemToCustomize.price * SIZE_MULTIPLIERS[selectedSize]) +
                    selectedToppings.reduce((sum, id) => {
                      const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
                      return sum + (topping?.price || 0);
                    }, 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <Button
                onClick={closeCustomizationModal}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 text-lg"
              >
                <SpeakableText>Cancel</SpeakableText>
              </Button>
              <Button
                onClick={addToCartFromModal}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-bold"
              >
                <SpeakableText>Add to Cart</SpeakableText>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b-2 border-border text-foreground p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Link to="/home">
            <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              <SpeakableText>← Back to Home</SpeakableText>
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            {weather && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{weather.description}</span>
                <span>{weather.temp}°F</span>
                <Button 
                  onClick={() => {
                    resetIdleTimer();
                    fetchWeather();
                  }}
                  className="p-1 h-8 w-8 bg-blue-100 hover:bg-blue-200 text-blue-600"
                  title="Refresh weather suggestions"
                >
                  🌡️
                </Button>
              </div>
            )}
            <Translator />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-center mb-2">
          <SpeakableText>Welcome to Boba Shop</SpeakableText>
        </h1>
        <p className="text-center text-lg text-muted-foreground">
          <SpeakableText>Order your favorite drinks</SpeakableText>
        </p>
      </div>

      {/* Weather-based Suggestion Banner */}
      {showSuggestion && weather && getWeatherSuggestion() && (
        <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {weather.temp > 65 ? '🥤' : '☕'}
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  Weather-Based Suggestion
                </h3>
                <p className="text-blue-700 text-sm">
                  {getWeatherSuggestion()?.reason}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => {
                  resetIdleTimer();
                  addSuggestedItem();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
              >
                Add to Cart
              </Button>
              <Button 
                onClick={() => {
                  resetIdleTimer();
                  setShowSuggestion(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 text-sm"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <SpeakableText>All</SpeakableText>
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
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <SpeakableText>{category}</SpeakableText>
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground text-xl py-10">
                No items found in this category
              </div>
            ) : (
              filteredMenuItems.map((item) => {
                const basePrice = item.price;
                return (
                  <div
                    key={item.menuitemid}
                    className="bg-card border-2 border-border rounded-xl p-6 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all"
                  >
                    {item.image_url && (
                      <div className="mb-4">
                        <img 
                          src={item.image_url} 
                          alt={item.menuitemname}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-foreground">
                        <SpeakableText>{item.menuitemname}</SpeakableText>
                      </h3>
                      <div className="text-right">
                        <span className="text-xl font-bold text-purple-600">
                          <SpeakableText text={`${item.menuitemname} starts at $${basePrice.toFixed(2)}`}>
                            ${basePrice.toFixed(2)}
                          </SpeakableText>
                        </span>
                        <div className="text-sm text-muted-foreground">
                          <SpeakableText>Base Price</SpeakableText>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      <SpeakableText>{item.drinkcategory}</SpeakableText>
                    </p>
                    <button
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
                      onClick={() => openCustomizationModal(item)}
                    >
                      <SpeakableText>Customize & Add</SpeakableText>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="w-96 bg-muted border-l-2 border-border p-6 flex flex-col">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            <SpeakableText>Your Order</SpeakableText>
          </h2>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-6">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <div className="text-4xl mb-4">🛒</div>
                <p className="text-lg">Your cart is empty</p>
                <p className="text-sm mt-2">Add items from the menu to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div
                    key={`${item.menuitemid}-${item.size}-${index}`}
                    className="bg-card rounded-lg p-4 shadow-sm border border-border"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-foreground">{item.name}</h4>
                        <p className="text-muted-foreground text-sm">${item.price.toFixed(2)} each</p>
                        
                        {/* Customization Display */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {/* Ice Level */}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {ICE_LEVELS.find(ice => ice.id === item.iceLevel)?.name || 'Regular Ice'}
                          </span>
                          
                          {/* Sugar Level */}
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            {SUGAR_LEVELS.find(sugar => sugar.id === item.sugarLevel)?.name || '100%'} Sugar
                          </span>
                          
                          {/* Hot Option */}
                          {item.isHot && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                              HOT
                            </span>
                          )}
                        </div>
                        
                        {/* Toppings */}
                        {item.toppings.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.toppings.map(id => {
                              const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
                              return (
                                <span key={id} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  {topping?.name}
                                </span>
                              );
                            })}
                          </div>
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
                              <SpeakableText>{size}</SpeakableText>
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuitemid, item.size, item.toppings)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
                        aria-label="Remove item"
                      >
                        <SpeakableText text="Remove item">×</SpeakableText>
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateCartQuantity(item.menuitemid, item.size, item.toppings, item.quantity - 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
                      >
                        <SpeakableText text="Decrease quantity">−</SpeakableText>
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.menuitemid, item.size, item.toppings, item.quantity + 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
                      >
                        <SpeakableText text="Increase quantity">+</SpeakableText>
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
                  <SpeakableText>Place Order</SpeakableText>
                </Button>
                <Button
                  onClick={clearCart}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 text-lg"
                >
                  <SpeakableText>Clear Cart</SpeakableText>
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

