import { useState, useEffect } from 'react';
import { getAllInventory, addInventoryItem, updateInventoryQuantity } from '../api/inventoryApi';
import type { InventoryItem } from '../api/inventoryApi';
import { getProductUsageData, getTotalSales } from '../api/analyticsApi';
import { getAllOrders } from '../api/orderApi';
import type { OrderResponse } from '../api/orderApi';
import Button from './ui/Button';

/**
 * Manager View component
 * Dashboard for managers with three main tabs:
 * - Inventory: View, add, and update inventory items
 * - Analytics: View product usage data and sales reports with date range selection
 * - Orders: View all orders with summary statistics (total revenue, completed/pending counts)
 */
function ManagerView() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'orders'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productUsage, setProductUsage] = useState<Record<string, number>>({});
  const [salesData, setSalesData] = useState<{ total: number; period: string } | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  
  // Inventory form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(0);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  
  // Date range for sales
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

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
   * Load analytics data (product usage and sales)
   * Fetches both datasets in parallel for better performance
   */
  const loadAnalytics = async () => {
    const [usage, sales] = await Promise.all([
      getProductUsageData(),
      getTotalSales(startDate, endDate)
    ]);
    setProductUsage(usage);
    setSalesData({ total: sales.totalSales, period: `${startDate} to ${endDate}` });
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
   * Calculate total revenue from all orders
   * @returns Sum of all order totals
   */
  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + Number(order.totalcost), 0);
  };

  /**
   * Count completed orders
   * @returns Number of orders marked as complete
   */
  const getCompletedOrders = () => {
    return orders.filter(order => order.is_complete).length;
  };

  /**
   * Count pending orders
   * @returns Number of orders not yet complete
   */
  const getPendingOrders = () => {
    return orders.filter(order => !order.is_complete).length;
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

              {/* Inventory List */}
              <div className="border border-gray-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-lg font-normal mb-4">Analytics</h2>
              
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
                {Object.keys(productUsage).length === 0 ? (
                  <div className="text-gray-500 p-5 text-center">No product usage data available</div>
                ) : (
                  <div>
                    {Object.entries(productUsage)
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
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-normal m-0">Order Overview</h2>
                <Button onClick={loadOrders}>
                  Refresh
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1.5">Total Revenue</div>
                  <div className="text-2xl font-bold">${getTotalRevenue().toFixed(2)}</div>
                </div>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1.5">Completed Orders</div>
                  <div className="text-2xl font-bold">{getCompletedOrders()}</div>
                </div>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1.5">Pending Orders</div>
                  <div className="text-2xl font-bold">{getPendingOrders()}</div>
                </div>
              </div>

              {/* Orders List */}
              <div className="border border-gray-300">
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
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.orderid} className="border-b border-gray-200">
                          <td className="p-2.5 text-sm">#{order.orderid}</td>
                          <td className="p-2.5 text-sm">
                            {new Date(order.timeoforder).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-sm">
                            ${Number(order.totalcost).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.is_complete 
                                ? 'bg-green-50 text-green-800' 
                                : 'bg-orange-50 text-orange-800'
                            }`}>
                              {order.is_complete ? 'Complete' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManagerView;
