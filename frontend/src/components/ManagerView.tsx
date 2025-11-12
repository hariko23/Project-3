import { useState, useEffect } from 'react';
import { getAllInventory } from '../api/inventoryApi';
import type { InventoryItem } from '../api/inventoryApi';
import Button from './ui/Button';

function ManagerView() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await getAllInventory();
      setInventory(items);
    } catch (err) {
      console.error('Error loading inventory:', err);
      alert('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '15px' }}>
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button to="/">← Back to Menu</Button>
          <h1 style={{ fontSize: '24px', fontWeight: 'normal', margin: 0 }}>Manager View</h1>
          <Button onClick={loadInventory} style={{ width: '120px' }}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div style={{ border: '1px solid #ddd', padding: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'normal', marginTop: 0, marginBottom: '15px' }}>Inventory</h2>
          {inventory.length === 0 ? (
            <div style={{ color: '#888', padding: '20px', textAlign: 'center' }}>No inventory items found</div>
          ) : (
            <div>
              {inventory.map((item) => (
                <div key={item.ingredientid} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <strong>{item.ingredientname}</strong> - Quantity: {item.ingredientcount}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ManagerView;
