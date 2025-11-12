import { useState, useEffect } from 'react';
import { getAllInventory, addInventoryItem, updateInventoryQuantity } from '../api/inventoryApi';
import type { InventoryItem } from '../api/inventoryApi';
import { getProductUsageData, getTotalSales } from '../api/analyticsApi';
import { getAllOrders } from '../api/orderApi';
import type { OrderResponse } from '../api/orderApi';
import Button from './ui/Button';

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

  const loadInventory = async () => {
    const items = await getAllInventory();
    setInventory(items);
  };

  const loadAnalytics = async () => {
    const [usage, sales] = await Promise.all([
      getProductUsageData(),
      getTotalSales(startDate, endDate)
    ]);
    setProductUsage(usage);
    setSalesData({ total: sales.totalSales, period: `${startDate} to ${endDate}` });
  };

  const loadOrders = async () => {
    const allOrders = await getAllOrders();
    setOrders(allOrders);
  };

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

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item.ingredientid);
    setEditQuantity(item.ingredientcount);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditQuantity(0);
  };

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

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + Number(order.totalcost), 0);
  };

  const getCompletedOrders = () => {
    return orders.filter(order => order.is_complete).length;
  };

  const getPendingOrders = () => {
    return orders.filter(order => !order.is_complete).length;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '15px' }}>
      {/* Header */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button to="/">← Back to Menu</Button>
          <h1 style={{ fontSize: '24px', fontWeight: 'normal', margin: 0 }}>Manager Dashboard</h1>
          <div style={{ width: '120px' }}></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid #000' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'inventory' ? 'bold' : 'normal'
          }}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid #000' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'analytics' ? 'bold' : 'normal'
          }}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '2px solid #000' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'orders' ? 'bold' : 'normal'
          }}
        >
          Orders
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <>
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'normal', marginBottom: '15px' }}>Inventory Management</h2>
              
              {/* Add New Item Form */}
              <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'normal', marginTop: 0, marginBottom: '10px' }}>Add New Inventory Item</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px', flex: 1 }}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
                    min="0"
                    style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px', width: '120px' }}
                  />
                  <Button onClick={handleAddInventory}>Add Item</Button>
                </div>
              </div>

              {/* Inventory List */}
              <div style={{ border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Item Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Quantity</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                          No inventory items found
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item) => (
                        <tr key={item.ingredientid} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px', fontSize: '14px' }}>{item.ingredientid}</td>
                          <td style={{ padding: '10px', fontSize: '14px' }}>{item.ingredientname}</td>
                          <td style={{ padding: '10px', fontSize: '14px' }}>
                            {editingItem === item.ingredientid ? (
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                min="0"
                                style={{ padding: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100px' }}
                              />
                            ) : (
                              <span style={{ color: item.ingredientcount < 10 ? '#d32f2f' : '#000' }}>
                                {item.ingredientcount}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {editingItem === item.ingredientid ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <Button onClick={() => handleUpdateQuantity(item.ingredientid)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  Save
                                </Button>
                                <Button onClick={cancelEdit} style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button onClick={() => startEdit(item)} style={{ padding: '4px 8px', fontSize: '12px' }}>
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
              <h2 style={{ fontSize: '18px', fontWeight: 'normal', marginBottom: '15px' }}>Analytics</h2>
              
              {/* Sales Data */}
              <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'normal', marginTop: 0, marginBottom: '10px' }}>Total Sales</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                  />
                  <Button onClick={handleSalesDateChange} style={{ padding: '8px 16px' }}>
                    Update
                  </Button>
                </div>
                {salesData && (
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    ${salesData.total.toFixed(2)}
                    <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginTop: '5px' }}>
                      {salesData.period}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Usage */}
              <div style={{ border: '1px solid #ddd', padding: '15px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'normal', marginTop: 0, marginBottom: '15px' }}>Product Usage (Last 30 Days)</h3>
                {Object.keys(productUsage).length === 0 ? (
                  <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>No product usage data available</div>
                ) : (
                  <div>
                    {Object.entries(productUsage)
                      .sort(([, a], [, b]) => b - a)
                      .map(([name, count]) => (
                        <div key={name} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px' }}>{name}</span>
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{count} sold</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'normal', margin: 0 }}>Order Overview</h2>
                <Button onClick={loadOrders} style={{ padding: '8px 16px' }}>
                  Refresh
                </Button>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div style={{ border: '1px solid #ddd', padding: '15px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Revenue</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${getTotalRevenue().toFixed(2)}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '15px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Completed Orders</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{getCompletedOrders()}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '15px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Pending Orders</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{getPendingOrders()}</div>
                </div>
              </div>

              {/* Orders List */}
              <div style={{ border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Order ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Total</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.orderid} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px', fontSize: '14px' }}>#{order.orderid}</td>
                          <td style={{ padding: '10px', fontSize: '14px' }}>
                            {new Date(order.timeoforder).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px', fontSize: '14px' }}>
                            ${Number(order.totalcost).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px', fontSize: '14px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: order.is_complete ? '#e8f5e9' : '#fff3e0',
                              color: order.is_complete ? '#2e7d32' : '#e65100',
                              fontSize: '12px'
                            }}>
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
