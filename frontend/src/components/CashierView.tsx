import { useState, useEffect } from 'react';
import { getAllMenuItems } from '../api/menuApi';
import type { MenuItem } from '../api/menuApi';
import { createOrder, getAllOrders, getOrderItems, markOrderItemComplete } from '../api/orderApi';
import type { OrderResponse, OrderItemDetail } from '../api/orderApi';
import Button from './ui/Button';

interface OrderItem {
  menuitemid: number;
  quantity: number;
  name: string;
  price: number;
}

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

  useEffect(() => {
    loadMenuItems();
    loadIncompleteOrders();
  }, []);

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

  const updateItemQuantity = (menuitemid: number, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [menuitemid]: quantity
    }));
  };

  const loadIncompleteOrders = async () => {
    try {
      const orders = await getAllOrders();
      const incomplete = orders.filter(order => !order.is_complete);
      setIncompleteOrders(incomplete);
    } catch (err) {
      console.error('Error loading incomplete orders:', err);
    }
  };

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

  const clearOrder = () => {
    setCurrentOrder([]);
    setCustomerName('');
  };

  const getTotal = () => {
    return currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      alert('Order is empty');
      return;
    }

    try {
      const orderData = {
        timeoforder: new Date().toISOString(),
        customerid: null,
        employeeid: 1,
        totalcost: getTotal(),
        orderweek: getCurrentWeek(),
        orderItems: currentOrder.map(item => ({
          menuitemid: item.menuitemid,
          quantity: item.quantity
        }))
      };

      const result = await createOrder(orderData);
      alert(`Order #${result.orderid} submitted successfully!\nTotal: $${getTotal().toFixed(2)}`);
      clearOrder();
      loadIncompleteOrders(); // Refresh incomplete orders list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Insufficient inventory')) {
        alert('Cannot fulfill this order due to insufficient inventory.\nPlease check stock levels and try again.');
      } else {
        alert(`Failed to submit order: ${errorMessage}`);
      }
      console.error('Error submitting order:', error);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', padding: '15px' }}>
      {/* Header */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button to="/">← Back to Menu</Button>
          <h1 style={{ fontSize: '24px', fontWeight: 'normal', margin: 0 }}>Cashier Order System</h1>
          <div style={{ width: '120px' }}></div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', flex: 1, minHeight: 0 }}>
        {/* Left Panel - Menu Items */}
        <div style={{ border: '1px solid #ddd', padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'normal', marginTop: 0, marginBottom: '8px', flexShrink: 0 }}>Menu Items</h2>
          {loading ? (
            <p>Loading menu items...</p>
          ) : (
            <>
              <div style={{ border: '1px solid #ddd', flex: 1, overflowY: 'auto', marginBottom: '8px', padding: '5px', minHeight: 0 }}>
                {menuItems.map((item) => (
                  <div
                    key={item.menuitemid}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {item.menuitemname} - ${item.price.toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '12px' }}>Qty:</label>
                      <select
                        value={itemQuantities[item.menuitemid] || 1}
                        onChange={(e) => updateItemQuantity(item.menuitemid, parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: '4px',
                          border: '1px solid #ddd',
                          fontSize: '12px',
                          width: '50px',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      <Button onClick={() => addToOrder(item)} style={{ padding: '4px 8px', fontSize: '12px' }}>
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
        <div style={{ border: '1px solid #ddd', padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'normal', marginTop: 0, marginBottom: '8px', flexShrink: 0 }}>Current Order</h2>
          <div style={{ border: '1px solid #ddd', flex: 1, overflowY: 'auto', marginBottom: '8px', padding: '5px', minHeight: 0 }}>
            {currentOrder.length === 0 ? (
              <div style={{ color: '#888', padding: '10px' }}>No items in order</div>
            ) : (
              currentOrder.map((item, index) => (
                <div key={index} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {item.name} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                </div>
              ))
            )}
          </div>
          <div style={{ marginBottom: '8px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>
            Total: ${getTotal().toFixed(2)}
          </div>
          <div style={{ marginBottom: '8px', flexShrink: 0 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Customer Name (Optional):</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
              placeholder="Enter customer name"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
            <Button onClick={clearOrder}>
              Clear Order
            </Button>
            <Button onClick={submitOrder} style={{ fontWeight: 'bold' }}>
              Submit Order
            </Button>
          </div>
        </div>

        {/* Right Panel - Uncompleted Orders */}
        <div style={{ border: '1px solid #ddd', padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'normal', margin: 0 }}>Uncompleted Orders</h2>
            <Button onClick={loadIncompleteOrders} style={{ padding: '4px 8px', fontSize: '12px' }}>
              Refresh
            </Button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {incompleteOrders.length === 0 ? (
              <div style={{ color: '#888', fontSize: '14px', padding: '10px' }}>No uncompleted orders</div>
            ) : (
              incompleteOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.orderid);
                const items = orderItemsMap[order.orderid] || [];
                const isLoading = loadingItems.has(order.orderid);
                const completedCount = items.filter(item => item.is_complete).length;
                const totalCount = items.length;

                return (
                  <div key={order.orderid} style={{ borderBottom: '1px solid #eee', fontSize: '12px' }}>
                    <div
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#f5f5f5' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={() => toggleOrderExpansion(order.orderid)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Order #{order.orderid}</div>
                        <div>Total: ${Number(order.totalcost).toFixed(2)}</div>
                        {totalCount > 0 && (
                          <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                            {completedCount}/{totalCount} drinks completed
                          </div>
                        )}
                        <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                          {new Date(order.timeoforder).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', color: '#666' }}>
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '8px', backgroundColor: '#fafafa', borderTop: '1px solid #eee' }}>
                        {isLoading ? (
                          <div style={{ color: '#888', fontSize: '11px', padding: '4px' }}>Loading drinks...</div>
                        ) : items.length === 0 ? (
                          <div style={{ color: '#888', fontSize: '11px', padding: '4px' }}>No items found</div>
                        ) : (
                          items.map((item) => (
                            <div
                              key={item.orderitemid}
                              style={{
                                padding: '6px',
                                marginBottom: '4px',
                                backgroundColor: item.is_complete ? '#e8f5e9' : '#fff',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: item.is_complete ? 'normal' : 'bold' }}>
                                  {item.menuitemname} x{item.quantity}
                                </div>
                                <div style={{ fontSize: '10px', color: '#666' }}>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}>
                                <input
                                  type="checkbox"
                                  checked={item.is_complete}
                                  onChange={() => handleMarkComplete(item)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ cursor: 'pointer' }}
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