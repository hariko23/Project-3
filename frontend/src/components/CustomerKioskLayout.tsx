import { useState, useEffect, useMemo } from 'react';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder } from '../api/orderApi';
import Button from './ui/Button';
import Receipt from './Receipt';

/**
 * Cart item structure
 */
interface CartItem {
  menuitemid: number;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Customer Kiosk Layout component
 * Customer-facing self-service kiosk interface for ordering
 * Features:
 * - Large, touch-friendly menu display organized by category
 * - Shopping cart functionality
 * - Order submission
 * - Receipt display
 */
function CustomerKioskLayout() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
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
   */
  const addToCart = (menuItem: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuitemid === menuItem.menuitemid);
      if (existingItem) {
        return prevCart.map(item =>
          item.menuitemid === menuItem.menuitemid
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        menuitemid: menuItem.menuitemid,
        name: menuItem.menuitemname,
        price: menuItem.price,
        quantity: 1
      }];
    });
  };

  /**
   * Update item quantity in cart
   * @param menuitemid - Menu item ID
   * @param quantity - New quantity
   */
  const updateCartQuantity = (menuitemid: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuitemid);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.menuitemid === menuitemid
          ? { ...item, quantity }
          : item
      )
    );
  };

  /**
   * Remove item from cart
   * @param menuitemid - Menu item ID to remove
   */
  const removeFromCart = (menuitemid: number) => {
    setCart(prevCart => prevCart.filter(item => item.menuitemid !== menuitemid));
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
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
          quantity: item.quantity
        }))
      };

      const result = await createOrder(orderData);

      // Prepare receipt data
      setReceiptData({
        orderNumber: result.orderid,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
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
      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <Receipt
              orderNumber={receiptData.orderNumber}
              items={receiptData.items}
              total={receiptData.total}
              timestamp={receiptData.timestamp}
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => {
                setShowReceipt(false);
                setReceiptData(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 text-gray-800 p-6 shadow-sm">
        <h1 className="text-4xl font-bold text-center mb-2">Welcome to Boba Shop</h1>
        <p className="text-center text-lg text-gray-600">Order your favorite drinks</p>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Menu Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Category Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
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
                onClick={() => setSelectedCategory(category)}
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

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 text-xl py-10">
                No items found in this category
              </div>
            ) : (
              filteredMenuItems.map((item) => (
                <div
                  key={item.menuitemid}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => addToCart(item)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl font-bold text-gray-800">{item.menuitemname}</h3>
                    <span className="text-xl font-bold text-purple-600">${item.price.toFixed(2)}</span>
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
              ))
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
                {cart.map((item) => (
                  <div
                    key={item.menuitemid}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                        <p className="text-gray-600 text-sm">${item.price.toFixed(2)} each</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuitemid)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateCartQuantity(item.menuitemid, item.quantity - 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.menuitemid, item.quantity + 1)}
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

