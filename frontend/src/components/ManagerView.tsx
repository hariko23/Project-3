import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { getAllInventory, addInventoryItem, updateInventoryQuantity } from '../api/inventoryApi';
import type { InventoryItem } from '../api/inventoryApi';
import { getAllMenuItems, getMenuItemIngredients, updateMenuItemIngredient, addMenuItemIngredient, removeMenuItemIngredient, addMenuItem, updateMenuItem, deleteMenuItem, uploadImage } from '../api/menuApi';
import type { MenuItem, MenuItemIngredient } from '../api/menuApi';
import { getProductUsageData, getTotalSales } from '../api/analyticsApi';
import { getAllOrders, getOrderItems } from '../api/orderApi';
import type { OrderResponse, OrderItemDetail } from '../api/orderApi';
import Button from './ui/Button';
import API_BASE_URL from '../api/config';
import ProductUsageChart from './reports/ProductUsageChart';
import XReport from './reports/XReport';
import ZReport from './reports/ZReport';
import SalesReport from './reports/SalesReport';
import Translator from './Translator';

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
  
  // Order items state
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<Record<number, OrderItemDetail[]>>({});
  const [loadingOrderItems, setLoadingOrderItems] = useState<number | null>(null);
  
  // Report selection state
  const [selectedReport, setSelectedReport] = useState<'overview' | 'product-usage' | 'x-report' | 'z-report' | 'sales-report'>('overview');
  
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

  // Menu item create/update modal state
  const [showCreateMenuItemModal, setShowCreateMenuItemModal] = useState(false);
  const [showUpdateMenuItemModal, setShowUpdateMenuItemModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [newMenuItemName, setNewMenuItemName] = useState('');
  const [newMenuItemCategory, setNewMenuItemCategory] = useState('');
  const [newMenuItemPrice, setNewMenuItemPrice] = useState<number>(0);
  const [updatingMenuItem, setUpdatingMenuItem] = useState(false);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
  
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
      toast.error('Failed to load data');
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
      toast.warning('Please enter a valid item name and quantity');
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
      toast.success('Inventory item added successfully');
    } catch (err) {
      console.error('Error adding inventory:', err);
      toast.error('Failed to add inventory item');
    }
  };

  /**
   * Update the quantity of an existing inventory item
   * @param id - Inventory item ID to update
   */
  const handleUpdateQuantity = async (id: number) => {
    if (editQuantity < 0) {
      toast.warning('Quantity cannot be negative');
      return;
    }

    try {
      await updateInventoryQuantity(id, editQuantity);
      setEditingItem(null);
      await loadInventory();
      toast.success('Inventory updated successfully');
    } catch (err) {
      console.error('Error updating inventory:', err);
      toast.error('Failed to update inventory');
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
        toast.error('Failed to load sales data');
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
   * Toggle order details expansion and load order items
   * @param orderId - Order ID to expand/collapse
   */
  const toggleOrderDetails = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      // Collapse if already expanded
      setExpandedOrderId(null);
      return;
    }

    // Expand and load items if not already loaded
    setExpandedOrderId(orderId);
    if (!orderItems[orderId]) {
      setLoadingOrderItems(orderId);
      try {
        const items = await getOrderItems(orderId);
        setOrderItems(prev => ({
          ...prev,
          [orderId]: items
        }));
      } catch (err) {
        console.error('Error loading order items:', err);
        toast.error('Failed to load order items');
      } finally {
        setLoadingOrderItems(null);
      }
    }
  };

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
      toast.error(`Failed to update order status: ${errorMessage}`);
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
      toast.error('Failed to load ingredients');
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
      toast.success('Ingredients updated successfully');
    } catch (err) {
      console.error('Error saving ingredients:', err);
      toast.error('Failed to save ingredients');
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
      toast.success('Ingredient removed successfully');
    } catch (err) {
      console.error('Error removing ingredient:', err);
      toast.error('Failed to remove ingredient');
    }
  };

  /**
   * Handle creating a new menu item
   */
  const handleCreateMenuItem = async () => {
    if (!newMenuItemName.trim() || !newMenuItemCategory.trim() || newMenuItemPrice <= 0) {
      toast.warning('Please fill in all fields with valid values');
      return;
    }

    let imageUrl = '';
    if (imageFile) {
      setUploadingImage(true);
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (err) {
        console.error('Error uploading image:', err);
        toast.error('Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    try {
      await addMenuItem(newMenuItemCategory, newMenuItemName.trim(), newMenuItemPrice, imageUrl || undefined);
      setShowCreateMenuItemModal(false);
      setNewMenuItemName('');
      setNewMenuItemCategory('');
      setNewMenuItemPrice(0);
      setImageFile(null);
      setImagePreview(null);
      await loadMenuItems();
      toast.success('Menu item created successfully');
    } catch (err) {
      console.error('Error creating menu item:', err);
      toast.error('Failed to create menu item');
    }
  };

  /**
   * Handle updating a menu item
   */
  const handleUpdateMenuItem = async () => {
    if (!editingMenuItem) return;

    if (!editingMenuItem.menuitemname.trim() || !editingMenuItem.drinkcategory.trim() || editingMenuItem.price <= 0) {
      toast.warning('Please fill in all fields with valid values');
      return;
    }

    let imageUrl = editingMenuItem.image_url;
    if (editingImageFile) {
      setUpdatingMenuItem(true);
      try {
        imageUrl = await uploadImage(editingImageFile);
      } catch (err) {
        console.error('Error uploading image:', err);
        toast.error('Failed to upload image. Please try again.');
        setUpdatingMenuItem(false);
        return;
      }
    }

    setUpdatingMenuItem(true);
    try {
      await updateMenuItem(editingMenuItem.menuitemid, {
        menuitemname: editingMenuItem.menuitemname.trim(),
        drinkcategory: editingMenuItem.drinkcategory,
        price: editingMenuItem.price,
        image_url: imageUrl || undefined
      });
      setShowUpdateMenuItemModal(false);
      setEditingMenuItem(null);
      setEditingImageFile(null);
      setEditingImagePreview(null);
      await loadMenuItems();
      toast.success('Menu item updated successfully');
    } catch (err) {
      console.error('Error updating menu item:', err);
      toast.error('Failed to update menu item');
    } finally {
      setUpdatingMenuItem(false);
    }
  };

  /**
   * Handle deleting a menu item
   * @param menuItem - Menu item to delete
   */
  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${menuItem.menuitemname}"? This will also delete all associated ingredients.`)) {
      return;
    }

    try {
      await deleteMenuItem(menuItem.menuitemid);
      await loadMenuItems();
      toast.success('Menu item deleted successfully');
    } catch (err) {
      console.error('Error deleting menu item:', err);
      toast.error('Failed to delete menu item');
    }
  };

  /**
   * Open update modal for a menu item
   * @param menuItem - Menu item to edit
   */
  const handleEditMenuItem = (menuItem: MenuItem) => {
    setEditingMenuItem({ ...menuItem });
    setEditingImageFile(null);
    setEditingImagePreview(null);
    setShowUpdateMenuItemModal(true);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-card border-b-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button to="/" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium">
            ← Back to Menu
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Manager Dashboard</h1>
          <Translator />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b-2 border-purple-200 dark:border-purple-800 shadow-sm">
        <div className="flex gap-2 px-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-4 border-none bg-transparent cursor-pointer text-base font-medium transition-all ${
              activeTab === 'inventory' 
                ? 'border-b-4 border-purple-600 text-purple-600' 
                : 'border-b-4 border-transparent text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-4 border-none bg-transparent cursor-pointer text-base font-medium transition-all ${
              activeTab === 'menu' 
                ? 'border-b-4 border-purple-600 text-purple-600' 
                : 'border-b-4 border-transparent text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400'
            }`}
          >
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-4 border-none bg-transparent cursor-pointer text-base font-medium transition-all ${
              activeTab === 'analytics' 
                ? 'border-b-4 border-purple-600 text-purple-600' 
                : 'border-b-4 border-transparent text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-4 border-none bg-transparent cursor-pointer text-base font-medium transition-all ${
              activeTab === 'orders' 
                ? 'border-b-4 border-purple-600 text-purple-600' 
                : 'border-b-4 border-transparent text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-2xl font-semibold text-purple-600 mb-2">Loading...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-foreground">Inventory Management</h2>

              {/* Add New Item Form */}
              <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Add New Inventory Item
                </h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">Item Name</label>
                    <input
                      type="text"
                      placeholder="Enter ingredient name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <Button 
                    onClick={handleAddInventory}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium text-base transition-colors"
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Inventory List (Raw Ingredients) */}
              <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4">
                  <h3 className="text-xl font-bold text-white">
                    Raw Ingredients Inventory
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-purple-50 dark:bg-gray-800 border-b-2 border-purple-200 dark:border-gray-700">
                        <th className="p-4 text-left text-sm font-bold text-foreground">ID</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Item Name</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Quantity</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Status</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center">
                            <div className="text-muted-foreground">
                              <div className="text-lg">No inventory items found</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        inventory.map((item) => (
                          <tr key={item.ingredientid} className="border-b border-border hover:bg-accent transition-colors">
                            <td className="p-4 text-base font-medium text-foreground">{item.ingredientid}</td>
                            <td className="p-4 text-base font-medium text-foreground">{item.ingredientname}</td>
                            <td className="p-4 text-base">
                              {editingItem === item.ingredientid ? (
                                <input
                                  type="number"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="p-2 border-2 border-purple-300 rounded-lg text-base w-32 focus:border-purple-500 focus:outline-none"
                                />
                              ) : (
                                <span className={`font-semibold ${item.ingredientcount < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                  {item.ingredientcount}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              {item.ingredientcount < 10 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                  Low Stock
                                </span>
                              ) : item.ingredientcount < 30 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                  Medium
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              {editingItem === item.ingredientid ? (
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleUpdateQuantity(item.ingredientid)} 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    onClick={cancelEdit} 
                                    size="sm" 
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  onClick={() => startEdit(item)} 
                                  size="sm" 
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                  ✏️ Edit
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
            </div>
          )}

          {/* Menu Items Tab */}
          {activeTab === 'menu' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-foreground">Menu Items</h2>
                <Button 
                  onClick={() => setShowCreateMenuItemModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium text-base transition-colors"
                >
                  + Create Menu Item
                </Button>
              </div>
              
              {/* Category Filter */}
              <div className="mb-6 bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 shadow-sm">
                <label className="block text-sm font-medium text-foreground mb-2">Filter by Drink Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-64 p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors"
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
              <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4">
                  <h3 className="text-xl font-bold text-white">
                    Menu Items ({selectedCategory === 'all' ? 'All Categories' : selectedCategory})
                  </h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-purple-50 dark:bg-gray-800 z-10">
                      <tr className="border-b-2 border-purple-200 dark:border-gray-700">
                        <th className="p-4 text-left text-sm font-bold text-foreground">ID</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Drink Name</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Category</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Price</th>
                        <th className="p-4 text-left text-sm font-bold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems
                        .filter(item => selectedCategory === 'all' || item.drinkcategory === selectedCategory)
                        .map((item) => (
                          <tr key={item.menuitemid} className="border-b border-border hover:bg-accent transition-colors">
                            <td className="p-4 text-base font-medium text-foreground">{item.menuitemid}</td>
                            <td className="p-4 text-base font-medium text-foreground">{item.menuitemname}</td>
                            <td className="p-4 text-base">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {item.drinkcategory}
                              </span>
                            </td>
                            <td className="p-4 text-base font-semibold text-green-600">${item.price.toFixed(2)}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleShowIngredients(item)} 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                  Ingredients
                                </Button>
                                <Button 
                                  onClick={() => handleEditMenuItem(item)} 
                                  size="sm" 
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                  ✏️ Edit
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteMenuItem(item)} 
                                  size="sm" 
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                  Delete
                                </Button>
                              </div>
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
                  <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
                      <h3 className="text-2xl font-bold text-white">Ingredients for {selectedMenuItem.menuitemname}</h3>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    
                    {loadingIngredients ? (
                      <div className="text-center p-5">Loading ingredients...</div>
                    ) : (
                      <>
                        {/* Existing Ingredients */}
                        {menuItemIngredients.length === 0 ? (
                          <div className="text-gray-400 p-8 text-center">
                            <div className="text-lg">No ingredients found for this menu item</div>
                          </div>
                        ) : (
                          <div className="border-2 border-purple-200 rounded-lg mb-4 overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-purple-50 dark:bg-gray-800 border-b-2 border-purple-200 dark:border-gray-700">
                                  <th className="p-4 text-left text-sm font-bold text-foreground">Ingredient Name</th>
                                  <th className="p-4 text-left text-sm font-bold text-foreground">Quantity</th>
                                  <th className="p-4 text-left text-sm font-bold text-foreground">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {menuItemIngredients.map((ingredient) => {
                                  const editedQty = editingIngredients[ingredient.ingredientid] !== undefined 
                                    ? editingIngredients[ingredient.ingredientid] 
                                    : ingredient.ingredientqty;
                                  return (
                                    <tr key={ingredient.ingredientid} className="border-b border-border hover:bg-accent transition-colors">
                                      <td className="p-4 text-base font-medium text-foreground">{ingredient.ingredientname}</td>
                                      <td className="p-4">
                                        <input
                                          type="number"
                                          value={editedQty}
                                          onChange={(e) => handleIngredientQuantityChange(ingredient.ingredientid, parseInt(e.target.value) || 0)}
                                          min="0"
                                          className="p-2 border-2 border-border rounded-lg text-base w-24 bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                                        />
                                      </td>
                                      <td className="p-4">
                                        <Button 
                                          onClick={() => handleRemoveIngredient(ingredient.ingredientid)} 
                                          size="sm" 
                                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
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
                        <div className="border-2 border-purple-200 dark:border-gray-700 rounded-lg p-4 bg-purple-50 dark:bg-gray-800">
                          <h4 className="text-base font-bold mb-3 text-foreground">Add New Ingredient</h4>
                          <div className="flex gap-3 items-center">
                            <select
                              value={newIngredientId}
                              onChange={(e) => setNewIngredientId(e.target.value ? Number(e.target.value) : '')}
                              className="flex-1 p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
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
                              placeholder="Quantity"
                              className="p-3 border-2 border-border rounded-lg text-base w-32 bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    </div>
                    
                    <div className="border-t-2 border-purple-200 dark:border-purple-800 p-6 bg-muted flex justify-end gap-3">
                      <Button 
                        onClick={() => {
                          setShowIngredientsModal(false);
                          setEditingIngredients({});
                          setNewIngredientId('');
                          setNewIngredientQty(0);
                        }}
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-medium"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveIngredients}
                        disabled={savingIngredients}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                      >
                        {savingIngredients ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Menu Item Modal */}
              {showCreateMenuItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateMenuItemModal(false)}>
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
                      <h3 className="text-2xl font-bold text-white">Create New Menu Item</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Menu Item Name</label>
                          <input
                            type="text"
                            value={newMenuItemName}
                            onChange={(e) => setNewMenuItemName(e.target.value)}
                            placeholder="Enter menu item name"
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                          <select
                            value={newMenuItemCategory}
                            onChange={(e) => setNewMenuItemCategory(e.target.value)}
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          >
                            <option value="">Select category...</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Price</label>
                          <input
                            type="number"
                            value={newMenuItemPrice}
                            onChange={(e) => setNewMenuItemPrice(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Menu Item Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImageFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          />
                          {imagePreview && (
                            <div className="mt-2">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t-2 border-purple-200 dark:border-purple-800 p-6 bg-muted flex justify-end gap-3">
                      <Button 
                        onClick={() => {
                          setShowCreateMenuItemModal(false);
                          setNewMenuItemName('');
                          setNewMenuItemCategory('');
                          setNewMenuItemPrice(0);
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-medium"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateMenuItem}
                        disabled={uploadingImage}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                      >
                        {uploadingImage ? 'Uploading...' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Update Menu Item Modal */}
              {showUpdateMenuItemModal && editingMenuItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUpdateMenuItemModal(false)}>
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
                      <h3 className="text-2xl font-bold text-white">Edit Menu Item</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Menu Item Name</label>
                          <input
                            type="text"
                            value={editingMenuItem.menuitemname}
                            onChange={(e) => setEditingMenuItem({ ...editingMenuItem, menuitemname: e.target.value })}
                            placeholder="Enter menu item name"
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                          <select
                            value={editingMenuItem.drinkcategory}
                            onChange={(e) => setEditingMenuItem({ ...editingMenuItem, drinkcategory: e.target.value })}
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Price</label>
                          <input
                            type="number"
                            value={editingMenuItem.price}
                            onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Menu Item Image
                          </label>
                          {editingMenuItem.image_url && !editingImagePreview && (
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground mb-1">Current Image:</p>
                              <img 
                                src={editingMenuItem.image_url} 
                                alt="Current" 
                                className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                              />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditingImageFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditingImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full p-3 border-2 border-border rounded-lg text-base bg-background text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                          />
                          {editingImagePreview && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground mb-1">New Image Preview:</p>
                              <img 
                                src={editingImagePreview} 
                                alt="Preview" 
                                className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t-2 border-purple-200 dark:border-purple-800 p-6 bg-muted flex justify-end gap-3">
                      <Button 
                        onClick={() => {
                          setShowUpdateMenuItemModal(false);
                          setEditingMenuItem(null);
                          setEditingImageFile(null);
                          setEditingImagePreview(null);
                        }}
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-medium"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateMenuItem} 
                        disabled={updatingMenuItem}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                      >
                        {updatingMenuItem ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Analytics & Reports</h2>
                <div className="flex gap-3 items-center">
                  <label className="text-sm font-medium text-gray-700">Select Report:</label>
                  <select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value as any)}
                    className="p-3 border-2 border-gray-300 rounded-lg text-base bg-white focus:border-purple-500 focus:outline-none transition-colors min-w-[200px]"
                  >
                    <option value="overview">Overview</option>
                    <option value="product-usage">Product Usage Chart</option>
                    <option value="x-report">X-Report (Current Day)</option>
                    <option value="z-report">Z-Report (End of Day)</option>
                    <option value="sales-report">Sales Report by Item</option>
                  </select>
                </div>
              </div>

              {/* Report Content */}
              <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg shadow-sm overflow-hidden">
                {selectedReport === 'overview' && (
                  <div className="p-6">
                    {/* Sales Data */}
                    <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6 shadow-sm">
                      <h3 className="text-xl font-semibold mb-4 text-foreground">Total Sales</h3>
                      <div className="flex gap-3 items-center mb-4 flex-wrap">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="p-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-base bg-background dark:bg-gray-800 text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                        />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="p-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-base bg-background dark:bg-gray-800 text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                        />
                        <Button 
                          onClick={handleSalesDateChange}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                        >
                          Update
                        </Button>
                      </div>
                      {salesData && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                          <div className="text-4xl font-bold text-purple-600">
                            ${salesData.total.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-2">
                            {salesData.period}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Usage */}
                    <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4">
                        <h3 className="text-xl font-bold text-white">Product Usage (Last 30 Days)</h3>
                      </div>
                      <div className="p-6">
                        {/* Filter Controls */}
                        <div className="mb-6 p-4 bg-purple-50 dark:bg-gray-800 border-2 border-purple-200 dark:border-gray-700 rounded-lg">
                          <div className="flex gap-4 items-center flex-wrap">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">Filter by:</label>
                              <select
                                value={productUsageFilterType}
                                onChange={(e) => {
                                  setProductUsageFilterType(e.target.value as 'category' | 'drink');
                                  setProductUsageFilter('all');
                                }}
                                className="p-2 border-2 border-gray-300 rounded-lg text-base bg-white focus:border-purple-500 focus:outline-none"
                              >
                                <option value="category">Category</option>
                                <option value="drink">Drink Name</option>
                              </select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">
                                {productUsageFilterType === 'category' ? 'Select Category:' : 'Enter Drink Name:'}
                              </label>
                              {productUsageFilterType === 'category' ? (
                                <select
                                  value={productUsageFilter}
                                  onChange={(e) => setProductUsageFilter(e.target.value)}
                                  className="p-2 border-2 border-gray-300 rounded-lg text-base bg-white focus:border-purple-500 focus:outline-none min-w-[200px]"
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
                                  className="p-2 border-2 border-gray-300 rounded-lg text-base focus:border-purple-500 focus:outline-none min-w-[200px]"
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
                          <div className="text-gray-400 p-8 text-center">
                            <div className="text-lg">No product usage data available</div>
                          </div>
                        ) : Object.keys(filteredProductUsage).length === 0 ? (
                          <div className="text-gray-400 p-8 text-center">
                            <div className="text-lg">No products found for selected filter</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(filteredProductUsage)
                              .sort(([, a], [, b]) => b - a)
                              .map(([name, count]) => (
                                <div key={name} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors">
                                  <span className="text-base font-medium text-gray-800 dark:text-foreground">{name}</span>
                                  <span className="text-base font-bold text-purple-600 dark:text-purple-400">{count} sold</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport === 'product-usage' && (
                  <div className="p-6">
                    <ProductUsageChart />
                  </div>
                )}
                {selectedReport === 'x-report' && (
                  <div className="p-6">
                    <XReport />
                  </div>
                )}
                {selectedReport === 'z-report' && (
                  <div className="p-6">
                    <ZReport />
                  </div>
                )}
                {selectedReport === 'sales-report' && (
                  <div className="p-6">
                    <SalesReport />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Order Overview</h2>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowOrderFilterModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Filter Orders
                  </Button>
                  <Button 
                    onClick={loadOrders}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filter Modal */}
              {showOrderFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowOrderFilterModal(false)}>
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
                      <h3 className="text-2xl font-bold text-white">Filter Orders</h3>
                    </div>
                    <div className="p-6">
                      {/* Date Range Filter */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="date"
                            value={orderFilters.dateFrom}
                            onChange={(e) => setOrderFilters({...orderFilters, dateFrom: e.target.value})}
                            className="p-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-base flex-1 bg-background dark:bg-gray-800 text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                            placeholder="From"
                          />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">to</span>
                          <input
                            type="date"
                            value={orderFilters.dateTo}
                            onChange={(e) => setOrderFilters({...orderFilters, dateTo: e.target.value})}
                            className="p-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-base flex-1 bg-background dark:bg-gray-800 text-foreground focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                            placeholder="To"
                          />
                        </div>
                      </div>

                      {/* Total Amount Filter */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount:</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={orderFilters.minTotal}
                            onChange={(e) => setOrderFilters({...orderFilters, minTotal: e.target.value})}
                            className="p-3 border-2 border-gray-300 rounded-lg text-base flex-1 focus:border-purple-500 focus:outline-none"
                            placeholder="Min"
                            min="0"
                            step="0.01"
                          />
                          <span className="text-sm font-medium text-gray-600">to</span>
                          <input
                            type="number"
                            value={orderFilters.maxTotal}
                            onChange={(e) => setOrderFilters({...orderFilters, maxTotal: e.target.value})}
                            className="p-3 border-2 border-gray-300 rounded-lg text-base flex-1 focus:border-purple-500 focus:outline-none"
                            placeholder="Max"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                        <select
                          value={orderFilters.status}
                          onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value as 'all' | 'complete' | 'pending'})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg text-base bg-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="all">All</option>
                          <option value="complete">Complete</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>

                      {/* Order ID Filter */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Order ID:</label>
                        <input
                          type="text"
                          value={orderFilters.orderId}
                          onChange={(e) => setOrderFilters({...orderFilters, orderId: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg text-base focus:border-purple-500 focus:outline-none"
                          placeholder="Enter order ID"
                        />
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="border-t-2 border-purple-200 p-6 bg-gray-50 flex gap-3 justify-end">
                      <Button 
                        onClick={resetOrderFilters} 
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-medium"
                      >
                        Reset
                      </Button>
                      <Button 
                        onClick={() => setShowOrderFilterModal(false)} 
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-medium"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={applyOrderFilters}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white border-2 border-purple-200 rounded-lg p-6 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue for applied filters</div>
                  <div className="text-3xl font-bold text-purple-600">${getTotalRevenue().toFixed(2)}</div>
                </div>
                <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-2">Completed Orders for applied filters</div>
                  <div className="text-3xl font-bold text-green-600">{getCompletedOrders()}</div>
                </div>
                <div className="bg-white border-2 border-orange-200 rounded-lg p-6 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-2">Pending Orders</div>
                  <div className="text-3xl font-bold text-orange-600">{getPendingOrders()}</div>
                </div>
              </div>

              {/* Orders List */}
              <div className="bg-card border-2 border-purple-200 dark:border-purple-800 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-purple-100 p-4 border-b-2 border-purple-200 text-base font-medium text-purple-800">
                  Showing {filteredOrders.length} of {allFilteredOrders.length} matching orders
                  {allFilteredOrders.length !== orders.length && ` (${orders.length} total orders)`}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-purple-50 dark:bg-gray-800 border-b-2 border-purple-200 dark:border-gray-700">
                        <th className="p-4 text-left text-sm font-bold text-gray-700 dark:text-foreground w-12"></th>
                        <th className="p-4 text-left text-sm font-bold text-gray-700 dark:text-foreground">Order ID</th>
                        <th className="p-4 text-left text-sm font-bold text-gray-700 dark:text-foreground">Date</th>
                        <th className="p-4 text-left text-sm font-bold text-gray-700 dark:text-foreground">Total</th>
                        <th className="p-4 text-left text-sm font-bold text-gray-700 dark:text-foreground">Status</th>
                      </tr>
                    </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <div className="text-gray-400">
                            <div className="text-lg">No orders found</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <>
                          <tr key={order.orderid} className="border-b border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="p-4">
                              <button
                                onClick={() => toggleOrderDetails(order.orderid)}
                                className="w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-base font-bold transition-colors shadow-sm"
                                title="View order details"
                              >
                                {expandedOrderId === order.orderid ? '−' : '+'}
                              </button>
                            </td>
                            <td className="p-4 text-base font-medium text-gray-800">#{order.orderid}</td>
                            <td className="p-4 text-base text-gray-700">
                              {new Date(order.timeoforder).toLocaleString()}
                            </td>
                            <td className="p-4 text-base font-semibold text-green-600">
                              ${Number(order.totalcost).toFixed(2)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                  order.is_complete 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {order.is_complete ? 'Complete' : 'Pending'}
                                </span>
                                <button
                                  onClick={() => toggleOrderStatus(order.orderid, order.is_complete)}
                                  className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                  title={`Mark as ${order.is_complete ? 'Pending' : 'Complete'}`}
                                >
                                  ⟳
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedOrderId === order.orderid && (
                            <tr key={`${order.orderid}-details`} className="bg-purple-50 dark:bg-gray-800">
                              <td colSpan={5} className="p-6">
                                {loadingOrderItems === order.orderid ? (
                                  <div className="text-center text-base text-gray-500 py-6">
                                    Loading order items...
                                  </div>
                                ) : orderItems[order.orderid] && orderItems[order.orderid].length > 0 ? (
                                  <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3">
                                      <h4 className="text-base font-bold text-white">Order Items</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                      <thead>
                                        <tr className="bg-purple-50 dark:bg-gray-800 border-b-2 border-purple-200 dark:border-gray-700">
                                          <th className="p-3 text-left text-sm font-bold text-gray-700 dark:text-foreground">Drink Name</th>
                                          <th className="p-3 text-left text-sm font-bold text-gray-700 dark:text-foreground">Size</th>
                                          <th className="p-3 text-left text-sm font-bold text-gray-700 dark:text-foreground">Customizations</th>
                                          <th className="p-3 text-left text-sm font-bold text-gray-700 dark:text-foreground">Quantity</th>
                                          <th className="p-3 text-left text-sm font-bold text-gray-700 dark:text-foreground">Price</th>
                                          <th className="p-3 text-left text-sm font-bold text-gray-700 dark:text-foreground">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {orderItems[order.orderid].map((item) => {
                                          const toppings = item.toppings ? item.toppings.split(',').filter(t => t.trim()) : [];
                                          
                                          // Use database column names with fallbacks
                                          const iceLevelValue = (item as any).icelevel || (item as any).iceLevel || 75;
                                          const sugarLevelValue = (item as any).sugarlevel || (item as any).sugarLevel || 100;
                                          const isHot = (item as any).is_hot || (item as any).isHot || false;
                                          
                                          const iceLevel = ICE_LEVELS.find(ice => ice.id === iceLevelValue)?.name || 'Regular Ice';
                                          const sugarLevel = SUGAR_LEVELS.find(sugar => sugar.id === sugarLevelValue)?.name || '100%';
                                          
                                          return (
                                          <tr key={item.orderitemid} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-sm font-medium text-gray-800 dark:text-foreground">
                                              <div className="flex flex-col">
                                                <span>{item.menuitemname}</span>
                                                {isHot && (
                                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded mt-1 w-fit">
                                                    HOT
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="p-3 text-sm">
                                              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                                                {item.size}
                                              </span>
                                            </td>
                                            <td className="p-3 text-sm">
                                              <div className="space-y-1">
                                                {/* Ice and Sugar Level */}
                                                <div className="flex flex-wrap gap-1">
                                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                                                    {iceLevel}
                                                  </span>
                                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-medium">
                                                    {sugarLevel} Sugar
                                                  </span>
                                                </div>
                                                {/* Toppings */}
                                                {toppings.length > 0 && (
                                                  <div className="flex flex-wrap gap-1">
                                                    {toppings.map((toppingId, idx) => {
                                                      const topping = AVAILABLE_TOPPINGS.find(t => t.id === toppingId.trim());
                                                      return (
                                                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
                                                          {topping?.name || toppingId}
                                                        </span>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                            <td className="p-3 text-sm font-medium text-gray-700">{item.quantity}</td>
                                            <td className="p-3 text-sm font-semibold text-green-600">${Number(item.price).toFixed(2)}</td>
                                            <td className="p-3 text-sm font-bold text-purple-600">
                                              ${(Number(item.price) * item.quantity).toFixed(2)}
                                            </td>
                                          </tr>
                                        );})}
                                      </tbody>
                                      </table>
                                    </div>
                                    </div>
                                ) : (
                                  <div className="text-center text-base text-gray-400 py-6">
                                    No items found for this order
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Load More Controls */}
              {allFilteredOrders.length > filteredOrders.length && (
                <div className="mt-6 flex gap-4 justify-center">
                  <Button 
                    onClick={loadMore50Orders}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium text-base"
                  >
                    Load 50 More Orders
                  </Button>
                  <Button 
                    onClick={loadAllOrders} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-base"
                  >
                    Load All ({allFilteredOrders.length - filteredOrders.length} more)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ManagerView;
