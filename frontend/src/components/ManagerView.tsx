import { useState, useEffect, useMemo } from 'react';
import { getAllInventory, addInventoryItem, updateInventoryQuantity } from '../api/inventoryApi';
import type { InventoryItem } from '../api/inventoryApi';
import { getAllMenuItems, getMenuItemIngredients, updateMenuItemIngredient, addMenuItemIngredient, removeMenuItemIngredient } from '../api/menuApi';
import type { MenuItem, MenuItemIngredient } from '../api/menuApi';
import { getProductUsageData, getTotalSales } from '../api/analyticsApi';
import { getAllOrders } from '../api/orderApi';
import type { OrderResponse } from '../api/orderApi';
import Button from './ui/Button';
import API_BASE_URL from '../api/config';
import ProductUsageChart from './reports/ProductUsageChart';
import XReport from './reports/XReport';
import ZReport from './reports/ZReport';
import SalesReport from './reports/SalesReport';
import AddMenuItem from './reports/AddMenuItem';

/**
 * Manager View component
 * Dashboard for managers with four main tabs:
 * - Inventory: View, add, and update raw ingredient inventory items
 * - Menu Items: View menu items (drinks) with category filtering
 * - Analytics: View product usage data and sales reports with date range selection
 * - Orders: View all orders with summary statistics (total revenue, completed/pending counts)
 */
function ManagerView() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'menu' | 'analytics' | 'orders'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productUsage, setProductUsage] = useState<Record<string, number>>({});
  const [productUsageFilter, setProductUsageFilter] = useState<string>('all');
  const [productUsageFilterType, setProductUsageFilterType] = useState<'category' | 'drink'>('category');
  const [salesData, setSalesData] = useState<{ total: number; period: string } | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  
  // Report selection state
  const [selectedReport, setSelectedReport] = useState<'overview' | 'product-usage' | 'x-report' | 'z-report' | 'sales-report' | 'add-menu-item'>('overview');
  
  // Order filter state
  const [showOrderFilterModal, setShowOrderFilterModal] = useState(false);
  const [orderDisplayLimit, setOrderDisplayLimit] = useState(50);
  const [orderFilters, setOrderFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minTotal: '',
    maxTotal: '',
    status: 'all' as 'all' | 'complete' | 'pending',
    orderId: ''
  });
  
  // Inventory form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(0);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  
  // Menu item ingredients modal state
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [menuItemIngredients, setMenuItemIngredients] = useState<MenuItemIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [editingIngredients, setEditingIngredients] = useState<Record<number, number>>({});
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  const [newIngredientId, setNewIngredientId] = useState<number | ''>('');
  const [newIngredientQty, setNewIngredientQty] = useState<number>(0);
  const [savingIngredients, setSavingIngredients] = useState(false);
  
  // Date range for sales
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    return [...new Set(menuItems.map(item => item.drinkcategory))];
  }, [menuItems]);

  // Filter orders based on applied filters (for statistics - includes ALL matching orders)
  const allFilteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by date range
      if (orderFilters.dateFrom) {
        const orderDate = new Date(order.timeoforder).toISOString().split('T')[0];
        if (orderDate < orderFilters.dateFrom) return false;
      }
      if (orderFilters.dateTo) {
        const orderDate = new Date(order.timeoforder).toISOString().split('T')[0];
        if (orderDate > orderFilters.dateTo) return false;
      }
      
      // Filter by total amount
      if (orderFilters.minTotal && Number(order.totalcost) < Number(orderFilters.minTotal)) return false;
      if (orderFilters.maxTotal && Number(order.totalcost) > Number(orderFilters.maxTotal)) return false;
      
      // Filter by status
      if (orderFilters.status === 'complete' && !order.is_complete) return false;
      if (orderFilters.status === 'pending' && order.is_complete) return false;
      
      // Filter by order ID
      if (orderFilters.orderId && !order.orderid.toString().includes(orderFilters.orderId)) return false;
      
      return true;
    });
  }, [orders, orderFilters]);

  // Filtered orders for display (limited to orderDisplayLimit most recent)
  const filteredOrders = useMemo(() => {
    return [...allFilteredOrders]
      .sort((a, b) => new Date(b.timeoforder).getTime() - new Date(a.timeoforder).getTime())
      .slice(0, orderDisplayLimit);
  }, [allFilteredOrders, orderDisplayLimit]);

  // Filter product usage based on selected category or drink
  const filteredProductUsage = useMemo(() => {
    if (productUsageFilter === 'all') {
      return productUsage;
    }

    const filtered: Record<string, number> = {};
    
    if (productUsageFilterType === 'category') {
      // Filter by category - show drinks in that category
      Object.entries(productUsage).forEach(([name, count]) => {
        const menuItem = menuItems.find(item => item.menuitemname === name);
        if (menuItem && menuItem.drinkcategory === productUsageFilter) {
          filtered[name] = count;
        }
      });
    } else {
      // Filter by specific drink name
      if (productUsage[productUsageFilter] !== undefined) {
        filtered[productUsageFilter] = productUsage[productUsageFilter];
      }
    }
    
    return filtered;
  }, [productUsage, productUsageFilter, productUsageFilterType, menuItems]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  /**
   * Load data based on the currently active tab
   * Called when the component mounts or when the active tab changes
   */
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        await loadInventory();
      } else if (activeTab === 'menu') {
        await loadMenuItems();
      } else if (activeTab === 'analytics') {
        await loadAnalytics();
      } else if (activeTab === 'orders') {
        await loadOrders();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all inventory items
   */
  const loadInventory = async () => {
    const items = await getAllInventory();
    setInventory(items);
  };

  /**
   * Load all menu items
   */
  const loadMenuItems = async () => {
    const menu = await getAllMenuItems();
    setMenuItems(menu);
  };

  /**
   * Load analytics data (product usage and sales)
   * Fetches both datasets in parallel for better performance
   */
  const loadAnalytics = async () => {
    const [usage, sales, menu] = await Promise.all([
      getProductUsageData(),
      getTotalSales(startDate, endDate),
      getAllMenuItems()
    ]);
    setProductUsage(usage);
    setSalesData({ total: sales.totalSales, period: `${startDate} to ${endDate}` });
    setMenuItems(menu);
  };

  /**
   * Load all orders
   */
  const loadOrders = async () => {
    const allOrders = await getAllOrders();
    setOrders(allOrders);
  };

  /**
   * Add a new inventory item
   * Validates input and refreshes inventory list after successful addition
   */
  const handleAddInventory = async () => {
    if (!newItemName.trim() || newItemQuantity < 0) {
      alert('Please enter a valid item name and quantity');
      return;
    }

    try {
      await addInventoryItem({
        ingredientname: newItemName.trim(),
        ingredientcount: newItemQuantity
      });
      setNewItemName('');
      setNewItemQuantity(0);
      await loadInventory();
      alert('Inventory item added successfully');
    } catch (err) {
      console.error('Error adding inventory:', err);
      alert('Failed to add inventory item');
    }
  };

  /**
   * Update the quantity of an existing inventory item
   * @param id - Inventory item ID to update
   */
  const handleUpdateQuantity = async (id: number) => {
    if (editQuantity < 0) {
      alert('Quantity cannot be negative');
      return;
    }

    try {
      await updateInventoryQuantity(id, editQuantity);
      setEditingItem(null);
      await loadInventory();
      alert('Inventory updated successfully');
    } catch (err) {
      console.error('Error updating inventory:', err);
      alert('Failed to update inventory');
    }
  };

  /**
   * Start editing an inventory item
   * Sets the item to edit mode and initializes the edit quantity
   * @param item - Inventory item to edit
   */
  const startEdit = (item: InventoryItem) => {
    setEditingItem(item.ingredientid);
    setEditQuantity(item.ingredientcount);
  };

  /**
   * Cancel editing and reset edit state
   */
  const cancelEdit = () => {
    setEditingItem(null);
    setEditQuantity(0);
  };

  /**
   * Update sales data when date range changes
   * Validates date range before fetching
   */
  const handleSalesDateChange = async () => {
    if (startDate && endDate && startDate <= endDate) {
      try {
        const sales = await getTotalSales(startDate, endDate);
        setSalesData({ total: sales.totalSales, period: `${startDate} to ${endDate}` });
      } catch (err) {
        console.error('Error loading sales:', err);
        alert('Failed to load sales data');
      }
    }
  };

  /**
   * Calculate total revenue from filtered orders
   * @returns Sum of all filtered order totals
   */
  const getTotalRevenue = () => {
    return allFilteredOrders.reduce((sum, order) => sum + Number(order.totalcost), 0);
  };

  /**
   * Count completed orders from filtered orders
   * @returns Number of filtered orders marked as complete
   */
  const getCompletedOrders = () => {
    return allFilteredOrders.filter(order => order.is_complete).length;
  };

  /**
   * Count pending orders from filtered orders
   * @returns Number of filtered orders not yet complete
   */
  const getPendingOrders = () => {
    return allFilteredOrders.filter(order => !order.is_complete).length;
  };

  /**
   * Reset all order filters to default values
   */
  const resetOrderFilters = () => {
    setOrderFilters({
      dateFrom: '',
      dateTo: '',
      minTotal: '',
      maxTotal: '',
      status: 'all',
      orderId: ''
    });
  };

  /**
   * Apply filters and close the modal
   */
  const applyOrderFilters = () => {
    setShowOrderFilterModal(false);
  };

  /**
   * Load 50 more orders
   */
  const loadMore50Orders = () => {
    setOrderDisplayLimit(prev => prev + 50);
  };

  /**
   * Load all matching orders
   */
  const loadAllOrders = () => {
    setOrderDisplayLimit(allFilteredOrders.length);
  };

  /**
   * Reset order display limit when filters change
   */
  useEffect(() => {
    setOrderDisplayLimit(50);
  }, [orderFilters]);

  /**
   * Toggle order completion status
   * @param orderId - Order ID to update
   * @param currentStatus - Current completion status
   */
  const toggleOrderStatus = async (orderId: number, currentStatus: boolean) => {
    try {
      // Make API call to update order status
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_complete: !currentStatus }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update order status');
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderid === orderId 
            ? { ...order, is_complete: !currentStatus }
            : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to update order status: ${errorMessage}`);
    }
  };

  /**
   * Open ingredients modal for a menu item
   * @param menuItem - Menu item to show ingredients for
   */
  const handleShowIngredients = async (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setShowIngredientsModal(true);
    setLoadingIngredients(true);
    setEditingIngredients({});
    setNewIngredientId('');
    setNewIngredientQty(0);
    try {
      const [ingredients, inventory] = await Promise.all([
        getMenuItemIngredients(menuItem.menuitemid),
        getAllInventory()
      ]);
      setMenuItemIngredients(ingredients);
      setAvailableInventory(inventory);
    } catch (err) {
      console.error('Error loading ingredients:', err);
      alert('Failed to load ingredients');
      setMenuItemIngredients([]);
      setAvailableInventory([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  /**
   * Update ingredient quantity in local state
   * @param ingredientId - Ingredient ID
   * @param quantity - New quantity
   */
  const handleIngredientQuantityChange = (ingredientId: number, quantity: number) => {
    setEditingIngredients(prev => ({
      ...prev,
      [ingredientId]: quantity
    }));
  };

  /**
   * Save all ingredient changes
   */
  const handleSaveIngredients = async () => {
    if (!selectedMenuItem) return;

    setSavingIngredients(true);
    try {
      // Update existing ingredients
      const updatePromises = Object.entries(editingIngredients).map(([ingredientId, quantity]) => {
        const numId = parseInt(ingredientId);
        const currentIngredient = menuItemIngredients.find(ing => ing.ingredientid === numId);
        if (currentIngredient && currentIngredient.ingredientqty !== quantity) {
          return updateMenuItemIngredient(selectedMenuItem.menuitemid, numId, quantity);
        }
        return Promise.resolve();
      });

      // Add new ingredient if selected
      if (newIngredientId && newIngredientQty > 0) {
        updatePromises.push(
          addMenuItemIngredient(selectedMenuItem.menuitemid, Number(newIngredientId), newIngredientQty)
        );
      }

      await Promise.all(updatePromises);

      // Reload ingredients
      const ingredients = await getMenuItemIngredients(selectedMenuItem.menuitemid);
      setMenuItemIngredients(ingredients);
      setEditingIngredients({});
      setNewIngredientId('');
      setNewIngredientQty(0);
      alert('Ingredients updated successfully');
    } catch (err) {
      console.error('Error saving ingredients:', err);
      alert('Failed to save ingredients');
    } finally {
      setSavingIngredients(false);
    }
  };

  /**
   * Remove an ingredient from a menu item
   * @param ingredientId - Ingredient ID to remove
   */
  const handleRemoveIngredient = async (ingredientId: number) => {
    if (!selectedMenuItem) return;

    if (!confirm('Are you sure you want to remove this ingredient?')) {
      return;
    }

    try {
      await removeMenuItemIngredient(selectedMenuItem.menuitemid, ingredientId);
      // Reload ingredients
      const ingredients = await getMenuItemIngredients(selectedMenuItem.menuitemid);
      setMenuItemIngredients(ingredients);
      setEditingIngredients(prev => {
        const updated = { ...prev };
        delete updated[ingredientId];
        return updated;
      });
      alert('Ingredient removed successfully');
    } catch (err) {
      console.error('Error removing ingredient:', err);
      alert('Failed to remove ingredient');
    }
  };

  return (
    <div className="bg-white min-h-screen p-4">
      {/* Header */}
      <div className="mb-4 border-b border-gray-300 pb-2.5">
        <div className="flex items-center justify-between">
          <Button to="/">← Back to Menu</Button>
          <h1 className="text-2xl font-normal m-0">Manager Dashboard</h1>
          <div className="w-[120px]"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2.5 mb-5 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm ${
            activeTab === 'inventory' 
              ? 'border-b-2 border-black font-bold' 
              : 'border-b-2 border-transparent font-normal'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm ${
            activeTab === 'menu' 
              ? 'border-b-2 border-black font-bold' 
              : 'border-b-2 border-transparent font-normal'
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm ${
            activeTab === 'analytics' 
              ? 'border-b-2 border-black font-bold' 
              : 'border-b-2 border-transparent font-normal'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm ${
            activeTab === 'orders' 
              ? 'border-b-2 border-black font-bold' 
              : 'border-b-2 border-transparent font-normal'
          }`}
        >
          Orders
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center p-10">Loading...</div>
      ) : (
        <>
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <h2 className="text-lg font-normal mb-4">Inventory Management</h2>

              {/* Add New Item Form */}
              <div className="border border-gray-300 p-4 mb-5 bg-gray-50">
                <h3 className="text-base font-normal mt-0 mb-2.5">Add New Inventory Item</h3>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="p-2 border border-gray-300 text-sm flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
                    min="0"
                    className="p-2 border border-gray-300 text-sm w-[120px]"
                  />
                  <Button onClick={handleAddInventory}>Add Item</Button>
                </div>
              </div>

              {/* Inventory List (Raw Ingredients) */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 p-2.5 border-b-2 border-gray-300">
                  <h3 className="text-base font-bold m-0">Raw Ingredients</h3>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="p-2.5 text-left text-sm font-bold">ID</th>
                      <th className="p-2.5 text-left text-sm font-bold">Item Name</th>
                      <th className="p-2.5 text-left text-sm font-bold">Quantity</th>
                      <th className="p-2.5 text-left text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-gray-500">
                          No inventory items found
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item) => (
                        <tr key={item.ingredientid} className="border-b border-gray-200">
                          <td className="p-2.5 text-sm">{item.ingredientid}</td>
                          <td className="p-2.5 text-sm">{item.ingredientname}</td>
                          <td className="p-2.5 text-sm">
                            {editingItem === item.ingredientid ? (
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                min="0"
                                className="p-1 border border-gray-300 text-sm w-[100px]"
                              />
                            ) : (
                              <span className={item.ingredientcount < 10 ? 'text-red-600' : 'text-black'}>
                                {item.ingredientcount}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {editingItem === item.ingredientid ? (
                              <div className="flex gap-1.5">
                                <Button onClick={() => handleUpdateQuantity(item.ingredientid)} size="sm" className="text-xs">
                                  Save
                                </Button>
                                <Button onClick={cancelEdit} size="sm" className="text-xs">
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button onClick={() => startEdit(item)} size="sm" className="text-xs">
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Menu Items Tab */}
          {activeTab === 'menu' && (
            <div>
              <h2 className="text-lg font-normal mb-4">Menu Items</h2>
              
              {/* Category Filter */}
              <div className="mb-4">
                <label className="text-sm mr-2">Filter by Drink Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 border border-gray-300 text-sm bg-white w-64"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu Items List (Drinks) */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 p-2.5 border-b-2 border-gray-300">
                  <h3 className="text-base font-bold m-0">Menu Items ({selectedCategory === 'all' ? 'All Categories' : selectedCategory})</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b border-gray-300">
                        <th className="p-2.5 text-left text-sm font-bold">ID</th>
                        <th className="p-2.5 text-left text-sm font-bold">Drink Name</th>
                        <th className="p-2.5 text-left text-sm font-bold">Category</th>
                        <th className="p-2.5 text-left text-sm font-bold">Price</th>
                        <th className="p-2.5 text-left text-sm font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems
                        .filter(item => selectedCategory === 'all' || item.drinkcategory === selectedCategory)
                        .map((item) => (
                          <tr key={item.menuitemid} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-2.5 text-sm">{item.menuitemid}</td>
                            <td className="p-2.5 text-sm">{item.menuitemname}</td>
                            <td className="p-2.5 text-sm">{item.drinkcategory}</td>
                            <td className="p-2.5 text-sm">${item.price.toFixed(2)}</td>
                            <td className="p-2.5">
                              <Button onClick={() => handleShowIngredients(item)} size="sm" className="text-xs">
                                View Ingredients
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ingredients Modal */}
              {showIngredientsModal && selectedMenuItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowIngredientsModal(false)}>
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Ingredients for {selectedMenuItem.menuitemname}</h3>
                    
                    {loadingIngredients ? (
                      <div className="text-center p-5">Loading ingredients...</div>
                    ) : (
                      <>
                        {/* Existing Ingredients */}
                        {menuItemIngredients.length === 0 ? (
                          <div className="text-gray-500 p-5 text-center">No ingredients found for this menu item</div>
                        ) : (
                          <div className="border border-gray-300 rounded mb-4">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-100 border-b border-gray-300">
                                  <th className="p-2.5 text-left text-sm font-bold">Ingredient Name</th>
                                  <th className="p-2.5 text-left text-sm font-bold">Quantity</th>
                                  <th className="p-2.5 text-left text-sm font-bold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {menuItemIngredients.map((ingredient) => {
                                  const editedQty = editingIngredients[ingredient.ingredientid] !== undefined 
                                    ? editingIngredients[ingredient.ingredientid] 
                                    : ingredient.ingredientqty;
                                  return (
                                    <tr key={ingredient.ingredientid} className="border-b border-gray-200">
                                      <td className="p-2.5 text-sm">{ingredient.ingredientname}</td>
                                      <td className="p-2.5">
                                        <input
                                          type="number"
                                          value={editedQty}
                                          onChange={(e) => handleIngredientQuantityChange(ingredient.ingredientid, parseInt(e.target.value) || 0)}
                                          min="0"
                                          className="p-1 border border-gray-300 text-sm w-20"
                                        />
                                      </td>
                                      <td className="p-2.5">
                                        <Button 
                                          onClick={() => handleRemoveIngredient(ingredient.ingredientid)} 
                                          size="sm" 
                                          className="text-xs bg-red-500"
                                        >
                                          Remove
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Add New Ingredient */}
                        <div className="border border-gray-300 rounded p-4 mb-4 bg-gray-50">
                          <h4 className="text-sm font-bold mb-2">Add New Ingredient</h4>
                          <div className="flex gap-2 items-center">
                            <select
                              value={newIngredientId}
                              onChange={(e) => setNewIngredientId(e.target.value ? Number(e.target.value) : '')}
                              className="flex-1 p-2 border border-gray-300 text-sm bg-white"
                            >
                              <option value="">Select ingredient...</option>
                              {availableInventory
                                .filter(inv => !menuItemIngredients.some(mi => mi.ingredientid === inv.ingredientid))
                                .map((inv) => (
                                  <option key={inv.ingredientid} value={inv.ingredientid}>
                                    {inv.ingredientname}
                                  </option>
                                ))}
                            </select>
                            <input
                              type="number"
                              value={newIngredientQty}
                              onChange={(e) => setNewIngredientQty(parseInt(e.target.value) || 0)}
                              min="0"
                              placeholder="Qty"
                              className="p-2 border border-gray-300 text-sm w-24"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="mt-4 flex justify-end gap-2">
                      <Button 
                        onClick={() => {
                          setShowIngredientsModal(false);
                          setEditingIngredients({});
                          setNewIngredientId('');
                          setNewIngredientQty(0);
                        }}
                        className="bg-gray-500"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveIngredients}
                        disabled={savingIngredients}
                      >
                        {savingIngredients ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-normal m-0">Analytics & Reports</h2>
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium">Select Report:</label>
                  <select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value as any)}
                    className="p-2 border border-gray-300 text-sm bg-white rounded min-w-[200px]"
                  >
                    <option value="overview">Overview</option>
                    <option value="product-usage">Product Usage Chart</option>
                    <option value="x-report">X-Report (Current Day)</option>
                    <option value="z-report">Z-Report (End of Day)</option>
                    <option value="sales-report">Sales Report by Item</option>
                    <option value="add-menu-item">Add Menu Item</option>
                  </select>
                </div>
              </div>

              {/* Report Content */}
              <div className="border border-gray-300 p-4 bg-white rounded">
                {selectedReport === 'overview' && (
                  <>
                    {/* Sales Data */}
                    <div className="border border-gray-300 p-4 mb-5 bg-gray-50">
                      <h3 className="text-base font-normal mt-0 mb-2.5">Total Sales</h3>
                      <div className="flex gap-2.5 items-center mb-2.5">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="p-2 border border-gray-300 text-sm"
                        />
                        <span>to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="p-2 border border-gray-300 text-sm"
                        />
                        <Button onClick={handleSalesDateChange}>
                          Update
                        </Button>
                      </div>
                      {salesData && (
                        <div className="text-2xl font-bold">
                          ${salesData.total.toFixed(2)}
                          <div className="text-xs font-normal text-gray-600 mt-1.5">
                            {salesData.period}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Usage */}
                    <div className="border border-gray-300 p-4">
                      <h3 className="text-base font-normal mt-0 mb-4">Product Usage (Last 30 Days)</h3>
                      
                      {/* Filter Controls */}
                      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex gap-4 items-center flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Filter by:</label>
                            <select
                              value={productUsageFilterType}
                              onChange={(e) => {
                                setProductUsageFilterType(e.target.value as 'category' | 'drink');
                                setProductUsageFilter('all');
                              }}
                              className="p-2 border border-gray-300 text-sm bg-white rounded"
                            >
                              <option value="category">Category</option>
                              <option value="drink">Drink Name</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">
                              {productUsageFilterType === 'category' ? 'Select Category:' : 'Enter Drink Name:'}
                            </label>
                            {productUsageFilterType === 'category' ? (
                              <select
                                value={productUsageFilter}
                                onChange={(e) => setProductUsageFilter(e.target.value)}
                                className="p-2 border border-gray-300 text-sm bg-white rounded min-w-[200px]"
                              >
                                <option value="all">All</option>
                                {categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={productUsageFilter === 'all' ? '' : productUsageFilter}
                                onChange={(e) => setProductUsageFilter(e.target.value || 'all')}
                                placeholder="Type drink name..."
                                className="p-2 border border-gray-300 text-sm rounded min-w-[200px]"
                                list="drink-suggestions"
                              />
                            )}
                            {productUsageFilterType === 'drink' && (
                              <datalist id="drink-suggestions">
                                {Object.keys(productUsage).sort().map((drinkName) => (
                                  <option key={drinkName} value={drinkName} />
                                ))}
                              </datalist>
                            )}
                          </div>
                        </div>
                      </div>

                      {Object.keys(productUsage).length === 0 ? (
                        <div className="text-gray-500 p-5 text-center">No product usage data available</div>
                      ) : Object.keys(filteredProductUsage).length === 0 ? (
                        <div className="text-gray-500 p-5 text-center">No products found for selected filter</div>
                      ) : (
                        <div>
                          {Object.entries(filteredProductUsage)
                            .sort(([, a], [, b]) => b - a)
                            .map(([name, count]) => (
                              <div key={name} className="p-2.5 border-b border-gray-200 flex justify-between">
                                <span className="text-sm">{name}</span>
                                <span className="text-sm font-bold">{count} sold</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedReport === 'product-usage' && <ProductUsageChart />}
                {selectedReport === 'x-report' && <XReport />}
                {selectedReport === 'z-report' && <ZReport />}
                {selectedReport === 'sales-report' && <SalesReport />}
                {selectedReport === 'add-menu-item' && <AddMenuItem />}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-normal m-0">Order Overview</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowOrderFilterModal(true)}>
                    Filter Orders
                  </Button>
                  <Button onClick={loadOrders}>
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filter Modal */}
              {showOrderFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowOrderFilterModal(false)}>
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Filter Orders</h3>
                    
                    {/* Date Range Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Date Range:</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={orderFilters.dateFrom}
                          onChange={(e) => setOrderFilters({...orderFilters, dateFrom: e.target.value})}
                          className="p-2 border border-gray-300 text-sm rounded flex-1"
                          placeholder="From"
                        />
                        <span className="text-sm">to</span>
                        <input
                          type="date"
                          value={orderFilters.dateTo}
                          onChange={(e) => setOrderFilters({...orderFilters, dateTo: e.target.value})}
                          className="p-2 border border-gray-300 text-sm rounded flex-1"
                          placeholder="To"
                        />
                      </div>
                    </div>

                    {/* Total Amount Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Total Amount:</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={orderFilters.minTotal}
                          onChange={(e) => setOrderFilters({...orderFilters, minTotal: e.target.value})}
                          className="p-2 border border-gray-300 text-sm rounded flex-1"
                          placeholder="Min"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-sm">to</span>
                        <input
                          type="number"
                          value={orderFilters.maxTotal}
                          onChange={(e) => setOrderFilters({...orderFilters, maxTotal: e.target.value})}
                          className="p-2 border border-gray-300 text-sm rounded flex-1"
                          placeholder="Max"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Status:</label>
                      <select
                        value={orderFilters.status}
                        onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value as 'all' | 'complete' | 'pending'})}
                        className="w-full p-2 border border-gray-300 text-sm rounded bg-white"
                      >
                        <option value="all">All</option>
                        <option value="complete">Complete</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    {/* Order ID Filter */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Order ID:</label>
                      <input
                        type="text"
                        value={orderFilters.orderId}
                        onChange={(e) => setOrderFilters({...orderFilters, orderId: e.target.value})}
                        className="w-full p-2 border border-gray-300 text-sm rounded"
                        placeholder="Enter order ID"
                      />
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-2 justify-end">
                      <Button onClick={resetOrderFilters} className="bg-gray-500">
                        Reset
                      </Button>
                      <Button onClick={() => setShowOrderFilterModal(false)} className="bg-gray-500">
                        Cancel
                      </Button>
                      <Button onClick={applyOrderFilters}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1.5">Total Revenue for applied filters</div>
                  <div className="text-2xl font-bold">${getTotalRevenue().toFixed(2)}</div>
                </div>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1.5">Completed Orders for applied filters</div>
                  <div className="text-2xl font-bold">{getCompletedOrders()}</div>
                </div>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1.5">Pending Orders</div>
                  <div className="text-2xl font-bold">{getPendingOrders()}</div>
                </div>
              </div>

              {/* Orders List */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 p-2 border-b border-gray-300 text-sm text-gray-600">
                  Showing {filteredOrders.length} of {allFilteredOrders.length} matching orders
                  {allFilteredOrders.length !== orders.length && ` (${orders.length} total orders)`}
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="p-2.5 text-left text-sm font-bold">Order ID</th>
                      <th className="p-2.5 text-left text-sm font-bold">Date</th>
                      <th className="p-2.5 text-left text-sm font-bold">Total</th>
                      <th className="p-2.5 text-left text-sm font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderid} className="border-b border-gray-200">
                          <td className="p-2.5 text-sm">#{order.orderid}</td>
                          <td className="p-2.5 text-sm">
                            {new Date(order.timeoforder).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-sm">
                            ${Number(order.totalcost).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                order.is_complete 
                                  ? 'bg-green-50 text-green-800' 
                                  : 'bg-orange-50 text-orange-800'
                              }`}>
                                {order.is_complete ? 'Complete' : 'Pending'}
                              </span>
                              <button
                                onClick={() => toggleOrderStatus(order.orderid, order.is_complete)}
                                className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600 transition-colors"
                                title={`Mark as ${order.is_complete ? 'Pending' : 'Complete'}`}
                              >
                                ⟳
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Load More Controls */}
              {allFilteredOrders.length > filteredOrders.length && (
                <div className="mt-4 flex gap-3 justify-center">
                  <Button onClick={loadMore50Orders}>
                    Load 50 More Orders
                  </Button>
                  <Button onClick={loadAllOrders} className="bg-blue-600">
                    Load All ({allFilteredOrders.length - filteredOrders.length} more)
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManagerView;
