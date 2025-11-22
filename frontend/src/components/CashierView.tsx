import { useState, useEffect, useMemo } from 'react';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder, getAllOrders, getOrderItems, markOrderItemComplete } from '../api/orderApi';
import type { OrderResponse, OrderItemDetail } from '../api/orderApi';
import Button from './ui/Button';
import Receipt from './Receipt';

/**
 * Order item structure for the current order being built
 */
interface OrderItem {
  menuitemid: number;
  quantity: number;
  name: string;
  price: number;
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

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    return [...new Set(menuItems.map(item => item.drinkcategory))];
  }, [menuItems]);

  useEffect(() => {
    loadMenuItems();
    loadIncompleteOrders();
    fetchWeather();
  }, []);

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
      // Initialize quantities to 1 for all items
      const initialQuantities: Record<number, number> = {};
      items.forEach(item => {
        initialQuantities[item.menuitemid] = 1;
      });
      setItemQuantities(initialQuantities);
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
          alert(`Failed to load order items: ${errorMessage}`);
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
      alert('Failed to update order item status');
    }
  };

  /**
   * Add a menu item to the current order
   * If the item already exists, increments its quantity instead of adding a duplicate
   * @param menuItem - Menu item to add to the order
   */
  const addToOrder = (menuItem: MenuItem) => {
    const quantity = itemQuantities[menuItem.menuitemid] || 1;

    // Check if item already exists in order
    const existingItemIndex = currentOrder.findIndex(
      item => item.menuitemid === menuItem.menuitemid
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].quantity += quantity;
      setCurrentOrder(updatedOrder);
    } else {
      // Add new item to order
      const orderItem: OrderItem = {
        menuitemid: menuItem.menuitemid,
        quantity: quantity,
        name: menuItem.menuitemname,
        price: menuItem.price
      };
      setCurrentOrder([...currentOrder, orderItem]);
    }
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
      alert('Order is empty');
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
          quantity: item.quantity
        }))
      };

      const result = await createOrder(orderData);
      
      // Prepare receipt data
      setReceiptData({
        orderNumber: result.orderid,
        items: currentOrder.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
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
        alert('Cannot fulfill this order due to insufficient inventory.\nPlease check stock levels and try again.');
      } else {
        alert(`Failed to submit order: ${errorMessage}`);
      }
      console.error('Error submitting order:', error);
    }
  };

  return (
    <div className="bg-white h-screen flex flex-col p-4">
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
      <div className="mb-4 border-b border-gray-300 pb-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <Button to="/">← Back to Menu</Button>
          <h1 className="text-2xl font-normal m-0">Cashier Order System</h1>
          <div className="w-[150px] text-right">
            {weather ? (
              <div className="text-sm">
                <div className="font-bold">{weather.description}</div>
                <div className="text-lg">{weather.temp}°F</div>
                <div className="text-xs text-gray-600">College Station</div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Loading weather...</div>
            )}
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 flex-1 min-h-0">
        {/* Left Panel - Menu Items */}
        <div className="border border-gray-300 p-4 flex flex-col min-h-0">
          <h2 className="text-base font-normal mt-0 mb-2 shrink-0">Menu Items</h2>
          {loading ? (
            <p>Loading menu items...</p>
          ) : (
            <>
              {/* Category Filter */}
              <div className="mb-2.5 shrink-0">
                <label className="text-xs mr-2">Filter by Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-1.5 border border-gray-300 text-xs bg-white w-full"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border border-gray-300 flex-1 overflow-y-auto mb-2 p-2.5 min-h-0">
                {menuItems
                  .filter(item => selectedCategory === 'all' || item.drinkcategory === selectedCategory)
                  .map((item) => (
                  <div
                    key={item.menuitemid}
                    className="p-3 border-b border-gray-200 flex items-center gap-4"
                  >
                    <div className="flex-1 text-sm">
                      {item.menuitemname} - ${item.price.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Qty:</label>
                      <select
                        value={itemQuantities[item.menuitemid] || 1}
                        onChange={(e) => updateItemQuantity(item.menuitemid, parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 border border-gray-300 text-xs w-[60px] bg-white"
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      <Button onClick={() => addToOrder(item)} size="sm" className="text-xs">
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Center Panel - Current Order */}
        <div className="border border-gray-300 p-2.5 flex flex-col min-h-0">
          <h2 className="text-base font-normal mt-0 mb-2 shrink-0">Current Order</h2>
          <div className="border border-gray-300 flex-1 overflow-y-auto mb-2 p-1.5 min-h-0">
            {currentOrder.length === 0 ? (
              <div className="text-gray-500 p-2.5">No items in order</div>
            ) : (
              currentOrder.map((item, index) => (
                <div key={index} className="p-2 border-b border-gray-200">
                  {item.name} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
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
              className="w-full p-2 border border-gray-300 text-sm"
              placeholder="Enter customer name"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <Button onClick={clearOrder}>
              Clear Order
            </Button>
            <Button onClick={submitOrder} className="font-bold">
              Submit Order
            </Button>
          </div>
        </div>

        {/* Right Panel - Uncompleted Orders */}
        <div className="border border-gray-300 p-2.5 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h2 className="text-base font-normal m-0">Uncompleted Orders</h2>
            <Button onClick={loadIncompleteOrders} size="sm" className="text-xs">
              Refresh
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {incompleteOrders.length === 0 ? (
              <div className="text-gray-500 text-sm p-2.5">No uncompleted orders</div>
            ) : (
              incompleteOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.orderid);
                const items = orderItemsMap[order.orderid] || [];
                const isLoading = loadingItems.has(order.orderid);
                const completedCount = items.filter(item => item.is_complete).length;
                const totalCount = items.length;

                return (
                  <div key={order.orderid} className="border-b border-gray-200 text-xs">
                    <div
                      className={`p-2 cursor-pointer ${isExpanded ? 'bg-gray-100' : 'bg-transparent'} flex justify-between items-center`}
                      onClick={() => toggleOrderExpansion(order.orderid)}
                    >
                      <div className="flex-1">
                        <div className="font-bold mb-1">Order #{order.orderid}</div>
                        <div>Total: ${Number(order.totalcost).toFixed(2)}</div>
                        {totalCount > 0 && (
                          <div className="text-gray-600 text-[11px] mt-0.5">
                            {completedCount}/{totalCount} drinks completed
                          </div>
                        )}
                        <div className="text-gray-600 text-[11px] mt-0.5">
                          {new Date(order.timeoforder).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-base text-gray-600">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-2 bg-gray-50 border-t border-gray-200">
                        {isLoading ? (
                          <div className="text-gray-500 text-[11px] p-1">Loading drinks...</div>
                        ) : items.length === 0 ? (
                          <div className="text-gray-500 text-[11px] p-1">No items found</div>
                        ) : (
                          items.map((item) => (
                            <div
                              key={item.orderitemid}
                              className={`p-1.5 mb-1 ${item.is_complete ? 'bg-green-50' : 'bg-white'} border border-gray-300 rounded flex justify-between items-center`}
                            >
                              <div className="flex-1">
                                <div className={item.is_complete ? 'font-normal' : 'font-bold'}>
                                  {item.menuitemname} x{item.quantity}
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