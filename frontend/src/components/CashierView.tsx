import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder, getAllOrders, getOrderItems, markOrderItemComplete } from '../api/orderApi';
import type { OrderResponse, OrderItemDetail } from '../api/orderApi';
import Button from './ui/Button';
import Receipt from './Receipt';
import Translator from './Translator';
import SpeakableText from './SpeakableText';

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
 * Cashier View component
 * Main interface for cashiers to:
 * - View and filter menu items by category
 * - Build orders by adding items with quantities
 * - Submit orders (validates inventory automatically)
 * - View and manage incomplete orders
 * - Mark individual order items as complete
 * 
 * Layout: Three-column grid
 * - Left: Menu items with category filter
 * - Center: Current order being built
 * - Right: List of incomplete orders with expandable details
 */
function CashierView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [itemSizes, setItemSizes] = useState<Record<number, DrinkSize>>({});
  const [itemToppings, setItemToppings] = useState<Record<number, string[]>>({});
  const [itemIceLevels, setItemIceLevels] = useState<Record<number, number>>({});
  const [itemSugarLevels, setItemSugarLevels] = useState<Record<number, number>>({});
  const [itemIsHot, setItemIsHot] = useState<Record<number, boolean>>({});
  const [customerName, setCustomerName] = useState('');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [incompleteOrders, setIncompleteOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [orderItemsMap, setOrderItemsMap] = useState<Record<number, OrderItemDetail[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: string } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderNumber: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    timestamp: string;
  } | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    return [...new Set(menuItems.map(item => item.drinkcategory))];
  }, [menuItems]);

  useEffect(() => {
    loadMenuItems();
    loadIncompleteOrders();
    fetchWeather();
  }, []);

  // Show suggestion when weather data loads
  useEffect(() => {
    if (weather) {
      setShowSuggestion(true);
      // Auto-hide suggestion after 10 seconds
      const timer = setTimeout(() => setShowSuggestion(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [weather]);

  /**
   * Fetch weather data for College Station, TX
   */
  const fetchWeather = async () => {
    try {
      // Using Open-Meteo free weather API (no API key required)
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=30.6280&longitude=-96.3344&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Chicago'
      );
      const data = await response.json();
      
      // Map weather codes to descriptions
      const weatherDescriptions: Record<number, string> = {
        0: '☀️ Clear',
        1: '🌤️ Mainly Clear',
        2: '⛅ Partly Cloudy',
        3: '☁️ Overcast',
        45: '🌫️ Foggy',
        48: '🌫️ Foggy',
        51: '🌦️ Light Drizzle',
        53: '🌦️ Drizzle',
        55: '🌧️ Heavy Drizzle',
        61: '🌧️ Light Rain',
        63: '🌧️ Rain',
        65: '🌧️ Heavy Rain',
        71: '🌨️ Light Snow',
        73: '🌨️ Snow',
        75: '🌨️ Heavy Snow',
        77: '🌨️ Snow Grains',
        80: '🌦️ Rain Showers',
        81: '🌧️ Rain Showers',
        82: '🌧️ Heavy Rain Showers',
        85: '🌨️ Snow Showers',
        86: '🌨️ Heavy Snow Showers',
        95: '⛈️ Thunderstorm',
        96: '⛈️ Thunderstorm',
        99: '⛈️ Severe Thunderstorm'
      };
      
      const weatherCode = data.current.weather_code;
      setWeather({
        temp: Math.round(data.current.temperature_2m),
        description: weatherDescriptions[weatherCode] || '🌡️ Unknown',
        icon: ''
      });
    } catch (err) {
      console.error('Error fetching weather:', err);
    }
  };

  /**
   * Load all menu items from the API
   * Initializes default quantities to 1 for each item
   */
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getAllMenuItems();
      setMenuItems(items);
      // Initialize quantities to 1 and sizes to Medium for all items
      const initialQuantities: Record<number, number> = {};
      const initialSizes: Record<number, DrinkSize> = {};
      const initialIceLevels: Record<number, number> = {};
      const initialSugarLevels: Record<number, number> = {};
      const initialIsHot: Record<number, boolean> = {};
      items.forEach(item => {
        initialQuantities[item.menuitemid] = 1;
        initialSizes[item.menuitemid] = 'Medium';
        initialIceLevels[item.menuitemid] = 75; // regular ice
        initialSugarLevels[item.menuitemid] = 100; // 100% sugar
        initialIsHot[item.menuitemid] = false;
      });
      setItemQuantities(initialQuantities);
      setItemSizes(initialSizes);
      setItemIceLevels(initialIceLevels);
      setItemSugarLevels(initialSugarLevels);
      setItemIsHot(initialIsHot);
    } catch (err) {
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update the quantity selector for a specific menu item
   * @param menuitemid - Menu item ID
   * @param quantity - New quantity value
   */
  const updateItemQuantity = (menuitemid: number, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [menuitemid]: quantity
    }));
  };

  /**
   * Update the size selector for a specific menu item
   * @param menuitemid - Menu item ID
   * @param size - New size value
   */
  const updateItemSize = (menuitemid: number, size: DrinkSize) => {
    setItemSizes(prev => ({
      ...prev,
      [menuitemid]: size
    }));
  };

  /**
   * Update the ice level for a specific menu item
   * @param menuitemid - Menu item ID
   * @param iceLevel - New ice level value (0-100)
   */
  const updateItemIceLevel = (menuitemid: number, iceLevel: number) => {
    setItemIceLevels(prev => ({
      ...prev,
      [menuitemid]: iceLevel
    }));
  };

  /**
   * Update the sugar level for a specific menu item
   * @param menuitemid - Menu item ID
   * @param sugarLevel - New sugar level value (0-100)
   */
  const updateItemSugarLevel = (menuitemid: number, sugarLevel: number) => {
    setItemSugarLevels(prev => ({
      ...prev,
      [menuitemid]: sugarLevel
    }));
  };

  /**
   * Toggle hot option for a specific menu item
   * @param menuitemid - Menu item ID
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
   * Load all incomplete orders from the API
   * Filters out completed orders to show only pending ones
   */
  const loadIncompleteOrders = async () => {
    try {
      const orders = await getAllOrders();
      const incomplete = orders.filter(order => !order.is_complete);
      setIncompleteOrders(incomplete);
    } catch (err) {
      console.error('Error loading incomplete orders:', err);
    }
  };

  /**
   * Toggle expansion of an order to show/hide its items
   * Lazy loads order items when first expanded
   * @param orderId - Order ID to expand/collapse
   */
  const toggleOrderExpansion = async (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      // Load order items if not already loaded
      if (!orderItemsMap[orderId]) {
        setLoadingItems(prev => new Set(prev).add(orderId));
        try {
          const items = await getOrderItems(orderId);
          console.log('Loaded order items:', items);
          setOrderItemsMap(prev => ({ ...prev, [orderId]: items }));
        } catch (err) {
          console.error('Error loading order items:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          toast.error(`Failed to load order items: ${errorMessage}`);
          // Set empty array so it doesn't keep trying
          setOrderItemsMap(prev => ({ ...prev, [orderId]: [] }));
        } finally {
          setLoadingItems(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
          });
        }
      }
    }
    setExpandedOrders(newExpanded);
  };

  /**
   * Mark an order item as complete or incomplete
   * Updates the order item status and refreshes the incomplete orders list
   * @param orderItem - Order item to update
   */
  const handleMarkComplete = async (orderItem: OrderItemDetail) => {
    try {
      await markOrderItemComplete(orderItem.orderitemid, !orderItem.is_complete);
      // Update the order item in the map
      setOrderItemsMap(prev => ({
        ...prev,
        [orderItem.orderid]: prev[orderItem.orderid].map(item =>
          item.orderitemid === orderItem.orderitemid
            ? { ...item, is_complete: !item.is_complete }
            : item
        )
      }));
      // Refresh incomplete orders list in case the order is now complete
      await loadIncompleteOrders();
    } catch (err) {
      console.error('Error marking order item complete:', err);
      toast.error('Failed to update order item status');
    }
  };

  /**
   * Get weather-based drink suggestion
   * @returns Suggested drink based on temperature
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
   * Add suggested item to order with default settings
   */
  const addSuggestedItem = () => {
    const suggestion = getWeatherSuggestion();
    if (suggestion) {
      addToOrder(suggestion.item);
      setShowSuggestion(false);
      toast.success(`Added ${suggestion.item.menuitemname} to order!`);
    }
  };

  /**
   * Add a menu item to the current order
   * If the item already exists with the same size and toppings, increments its quantity instead of adding a duplicate
   * @param menuItem - Menu item to add to the order
   */
  const addToOrder = (menuItem: MenuItem) => {
    const quantity = itemQuantities[menuItem.menuitemid] || 1;
    const size = itemSizes[menuItem.menuitemid] || 'Medium';
    const toppings = itemToppings[menuItem.menuitemid] || [];
    const isHot = itemIsHot[menuItem.menuitemid] || false;
    // If drink is hot, force ice level to 1 (no ice), otherwise use selected ice level
    const iceLevel = isHot ? 1 : (itemIceLevels[menuItem.menuitemid] || 75); // Default to regular ice
    const sugarLevel = itemSugarLevels[menuItem.menuitemid] || 100; // Default to 100%
    const toppingPrice = toppings.reduce((sum, toppingId) => {
      const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
      return sum + (topping?.price || 0);
    }, 0);
    const price = (menuItem.price * SIZE_MULTIPLIERS[size]) + toppingPrice;

    // Check if item already exists in order with same customizations
    const existingItemIndex = currentOrder.findIndex(
      item => item.menuitemid === menuItem.menuitemid && 
              item.size === size &&
              item.iceLevel === iceLevel &&
              item.sugarLevel === sugarLevel &&
              item.isHot === isHot &&
              JSON.stringify(item.toppings.sort()) === JSON.stringify(toppings.sort())
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists with same customizations
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].quantity += quantity;
      setCurrentOrder(updatedOrder);
    } else {
      // Add new item to order
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
    
    // Clear customizations after adding (except defaults)
    setItemToppings(prev => ({ ...prev, [menuItem.menuitemid]: [] }));
    setItemIceLevels(prev => ({ ...prev, [menuItem.menuitemid]: 75 })); // regular ice
    setItemSugarLevels(prev => ({ ...prev, [menuItem.menuitemid]: 100 })); // 100% sugar
    setItemIsHot(prev => ({ ...prev, [menuItem.menuitemid]: false }));
  };

  /**
   * Toggle topping selection for a menu item
   * @param menuitemid - Menu item ID
   * @param toppingId - Topping ID to toggle
   */
  const toggleTopping = (menuitemid: number, toppingId: string) => {
    setItemToppings(prev => {
      const currentToppings = prev[menuitemid] || [];
      if (currentToppings.includes(toppingId)) {
        return { ...prev, [menuitemid]: currentToppings.filter(id => id !== toppingId) };
      }
      return { ...prev, [menuitemid]: [...currentToppings, toppingId] };
    });
  };

  /**
   * Clear the current order and reset customer name
   */
  const clearOrder = () => {
    setCurrentOrder([]);
    setCustomerName('');
  };

  /**
   * Calculate the total cost of the current order
   * @returns Total price (sum of all items * quantities)
   */
  const getTotal = () => {
    return currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  /**
   * Calculate the current week number of the year
   * Used for order tracking and analytics
   * @returns Week number (1-52)
   */
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  /**
   * Submit the current order to the backend
   * Validates inventory, creates order, and updates inventory automatically
   * Shows success/error messages and refreshes incomplete orders list
   */
  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      toast.warning('Order is empty');
      return;
    }

    try {
      const orderData = {
        timeoforder: new Date().toISOString(),
        customerid: null,
        employeeid: 1, // Default employee ID
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

      const result = await createOrder(orderData);
      
      // Prepare receipt data
      setReceiptData({
        orderNumber: result.orderid,
        items: currentOrder.map(item => {
          let itemName = `${item.name} (${item.size})`;
          
          // Add hot indicator
          if (item.isHot) {
            itemName += ' - HOT';
          }
          
          // Add customizations
          const iceName = ICE_LEVELS.find(ice => ice.id === item.iceLevel)?.name || 'Regular';
          const sugarName = SUGAR_LEVELS.find(sugar => sugar.id === item.sugarLevel)?.name || '100%';
          itemName += ` | ${iceName} | ${sugarName} Sugar`;
          
          // Add toppings
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
        total: getTotal(),
        timestamp: orderData.timeoforder
      });
      
      // Show receipt
      setShowReceipt(true);
      
      clearOrder();
      loadIncompleteOrders(); // Refresh incomplete orders list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Handle inventory errors with user-friendly message
      if (errorMessage.includes('Insufficient inventory')) {
        toast.error('Cannot fulfill this order due to insufficient inventory. Please check stock levels and try again.');
      } else {
        toast.error(`Failed to submit order: ${errorMessage}`);
      }
      console.error('Error submitting order:', error);
    }
  };

  return (
    <div className="bg-background h-screen flex flex-col p-4">
      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Receipt
          orderNumber={receiptData.orderNumber}
          items={receiptData.items}
          total={receiptData.total}
          timestamp={receiptData.timestamp}
          onClose={() => setShowReceipt(false)}
        />
      )}
      
      {/* Header */}
      <div className="mb-4 border-b border-border pb-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <Button to="/">
            <SpeakableText>← Back to Menu</SpeakableText>
          </Button>
          <h1 className="text-2xl font-normal m-0">Cashier Order System</h1>
          <div className="flex items-center gap-4">
            <Translator />
            <div className="w-[150px] text-right">
              {weather ? (
                <div className="text-sm">
                  <div className="font-bold">{weather.description}</div>
                  <div className="text-lg">{weather.temp}°F</div>
                  <div className="text-xs text-muted-foreground">College Station</div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Loading weather...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weather-based Suggestion Banner */}
      {showSuggestion && weather && getWeatherSuggestion() && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {weather.temp > 65 ? '🥤' : '☕'}
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  <SpeakableText>Weather-Based Suggestion</SpeakableText>
                </h3>
                <p className="text-blue-700 text-sm">
                  <SpeakableText>{getWeatherSuggestion()?.reason}</SpeakableText>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={addSuggestedItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
              >
                <SpeakableText>Add to Order</SpeakableText>
              </Button>
              <Button 
                onClick={() => setShowSuggestion(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 text-sm"
              >
                <SpeakableText>✕</SpeakableText>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Three Column Layout */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 flex-1 min-h-0">
        {/* Left Panel - Menu Items */}
        <div className="border border-border p-4 flex flex-col min-h-0 bg-card">
          <h2 className="text-base font-normal mt-0 mb-2 shrink-0">
            <SpeakableText>Menu Items</SpeakableText>
          </h2>
          {loading ? (
            <p>Loading menu items...</p>
          ) : (
            <>
              {/* Category Filter */}
              <div className="mb-2.5 shrink-0">
                <label className="text-xs mr-2">
                  <SpeakableText>Filter by Category:</SpeakableText>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-1.5 border border-border text-xs bg-background text-foreground w-full"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border border-border flex-1 overflow-y-auto mb-2 p-2.5 min-h-0">
                {menuItems
                  .filter(item => selectedCategory === 'all' || item.drinkcategory === selectedCategory)
                  .map((item) => (
                  <div
                    key={item.menuitemid}
                    className="p-3 border-b border-border"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex-1 text-sm">
                        <div><SpeakableText>{item.menuitemname}</SpeakableText></div>
                        <div className="text-xs text-muted-foreground">
                          <SpeakableText text={`${item.menuitemname} costs $${(() => {
                            const basePrice = item.price * SIZE_MULTIPLIERS[itemSizes[item.menuitemid] || 'Medium'];
                            const toppingPrice = (itemToppings[item.menuitemid] || []).reduce((sum, toppingId) => {
                              const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
                              return sum + (topping?.price || 0);
                            }, 0);
                            return (basePrice + toppingPrice).toFixed(2);
                          })()}`}>
                          ${(() => {
                            const basePrice = item.price * SIZE_MULTIPLIERS[itemSizes[item.menuitemid] || 'Medium'];
                            const toppingPrice = (itemToppings[item.menuitemid] || []).reduce((sum, toppingId) => {
                              const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId);
                              return sum + (topping?.price || 0);
                            }, 0);
                            return (basePrice + toppingPrice).toFixed(2);
                          })()}
                          </SpeakableText>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs">Size:</label>
                        <select
                          value={itemSizes[item.menuitemid] || 'Medium'}
                          onChange={(e) => updateItemSize(item.menuitemid, e.target.value as DrinkSize)}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 border border-border text-xs w-[70px] bg-background text-foreground"
                        >
                          <option value="Small">S</option>
                          <option value="Medium">M</option>
                          <option value="Large">L</option>
                        </select>
                        <label className="text-xs">Qty:</label>
                        <select
                          value={itemQuantities[item.menuitemid] || 1}
                          onChange={(e) => updateItemQuantity(item.menuitemid, parseInt(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 border border-border text-xs w-[60px] bg-background text-foreground"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <Button onClick={() => addToOrder(item)} size="sm" className="text-xs">
                          <SpeakableText>Add</SpeakableText>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Drink Customizations */}
                    <div className="ml-0 mt-2 space-y-2">
                      {/* Ice Level */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Ice Level:</div>
                        <div className="flex flex-wrap gap-1">
                          {ICE_LEVELS.map((ice) => {
                            const isHot = itemIsHot[item.menuitemid] || false;
                            const isDisabled = isHot && ice.id > 1; // Disable all ice options except "No Ice" when hot
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
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {ice.name}
                            </button>
                          )})}
                        </div>
                      </div>

                      {/* Sugar Level */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Sugar Level:</div>
                        <div className="flex flex-wrap gap-1">
                          {SUGAR_LEVELS.map((sugar) => (
                            <button
                              key={sugar.id}
                              onClick={() => updateItemSugarLevel(item.menuitemid, sugar.id)}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                (itemSugarLevels[item.menuitemid] || 100) === sugar.id
                                  ? 'bg-green-600 text-white'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {sugar.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hot Option (not available for slushes) */}
                      {item.drinkcategory !== 'Slush' && (
                        <div>
                          <button
                            onClick={() => toggleItemHot(item.menuitemid)}
                            className={`px-3 py-1 rounded text-xs transition-colors ${
                              itemIsHot[item.menuitemid]
                                ? 'bg-red-600 text-white'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {itemIsHot[item.menuitemid] ? 'Hot' : 'Make it Hot'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Topping Selector */}
                    <div className="ml-0 mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Toppings {(itemToppings[item.menuitemid] || []).length > 0 && `(${(itemToppings[item.menuitemid] || []).length})`}:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_TOPPINGS.map((topping) => (
                          <button
                            key={topping.id}
                            onClick={() => toggleTopping(item.menuitemid, topping.id)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              (itemToppings[item.menuitemid] || []).includes(topping.id)
                                ? 'bg-purple-600 text-white'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            <SpeakableText>{topping.name} +${topping.price.toFixed(2)}</SpeakableText>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Center Panel - Current Order */}
        <div className="border border-gray-300 p-2.5 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h2 className="text-base font-normal mt-0">
              <SpeakableText>Current Order</SpeakableText>
            </h2>
            {weather && (
              <Button 
                onClick={() => setShowSuggestion(true)}
                size="sm" 
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
              >
                🌡️ Suggest
              </Button>
            )}
          </div>
          <div className="border border-border flex-1 overflow-y-auto mb-2 p-1.5 min-h-0">
            {currentOrder.length === 0 ? (
              <div className="text-muted-foreground p-2.5">No items in order</div>
            ) : (
              currentOrder.map((item, index) => (
                <div key={index} className="p-2 border-b border-border">
                  <div>{item.name} ({item.size}){item.isHot ? ' - HOT' : ''}</div>
                  
                  {/* Drink Customizations */}
                  <div className="text-xs text-gray-600 mt-1">
                    <div>Ice: {ICE_LEVELS.find(ice => ice.id === item.iceLevel)?.name || 'Regular'}</div>
                    <div>Sugar: {SUGAR_LEVELS.find(sugar => sugar.id === item.sugarLevel)?.name || '100%'}</div>
                  </div>
                  
                  {/* Toppings */}
                  {item.toppings.length > 0 && (
                    <div className="text-xs text-purple-600 mt-1">
                      + {item.toppings.map(id => {
                        const topping = AVAILABLE_TOPPINGS.find(t => t.id === id);
                        return topping?.name || id;
                      }).join(', ')}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1">x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
          <div className="mb-2 text-right text-base font-bold shrink-0">
            Total: ${getTotal().toFixed(2)}
          </div>
          <div className="mb-2 shrink-0">
            <label className="block mb-1.5 text-sm">Customer Name (Optional):</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 border border-border text-sm bg-background text-foreground"
              placeholder="Enter customer name"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <Button onClick={clearOrder}>
              <SpeakableText>Clear Order</SpeakableText>
            </Button>
            <Button onClick={submitOrder} className="font-bold">
              <SpeakableText>Submit Order</SpeakableText>
            </Button>
          </div>
        </div>

        {/* Right Panel - Uncompleted Orders */}
        <div className="border border-gray-300 p-2.5 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h2 className="text-base font-normal m-0">Uncompleted Orders</h2>
            <Button onClick={loadIncompleteOrders} size="sm" className="text-xs">
              <SpeakableText>Refresh</SpeakableText>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {incompleteOrders.length === 0 ? (
              <div className="text-muted-foreground text-sm p-2.5">No uncompleted orders</div>
            ) : (
              incompleteOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.orderid);
                const items = orderItemsMap[order.orderid] || [];
                const isLoading = loadingItems.has(order.orderid);
                const completedCount = items.filter(item => item.is_complete).length;
                const totalCount = items.length;

                return (
                  <div key={order.orderid} className="border-b border-border text-xs">
                    <div
                      className={`p-2 cursor-pointer ${isExpanded ? 'bg-accent' : 'bg-transparent'} flex justify-between items-center`}
                      onClick={() => toggleOrderExpansion(order.orderid)}
                    >
                      <div className="flex-1">
                        <div className="font-bold mb-1">Order #{order.orderid}</div>
                        <div>Total: ${Number(order.totalcost).toFixed(2)}</div>
                        {totalCount > 0 && (
                          <div className="text-muted-foreground text-[11px] mt-0.5">
                            {completedCount}/{totalCount} drinks completed
                          </div>
                        )}
                        <div className="text-gray-600 text-[11px] mt-0.5">
                          {new Date(order.timeoforder).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-base text-muted-foreground">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-2 bg-muted border-t border-border">
                        {isLoading ? (
                          <div className="text-muted-foreground text-[11px] p-1">Loading drinks...</div>
                        ) : items.length === 0 ? (
                          <div className="text-muted-foreground text-[11px] p-1">No items found</div>
                        ) : (
                          items.map((item) => (
                            <div
                              key={item.orderitemid}
                              className={`p-1.5 mb-1 ${item.is_complete ? 'bg-green-50' : 'bg-white'} border border-gray-300 rounded flex justify-between items-center`}
                            >
                              <div className="flex-1">
                                <div className={item.is_complete ? 'font-normal' : 'font-bold'}>
                                  {item.menuitemname} ({item.size}) x{item.quantity}
                                </div>
                                <div className="text-[10px] text-gray-600">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={item.is_complete}
                                  onChange={() => handleMarkComplete(item)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-pointer"
                                />
                                <span>{item.is_complete ? 'Done' : 'Mark Complete'}</span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashierView;