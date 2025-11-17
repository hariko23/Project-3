import { useState } from 'react';
import Button from '../ui/Button';
import API_BASE_URL from '../../api/config';

/**
 * Add Menu Item Component
 * Allows adding new seasonal menu items to the POS system
 */
function AddMenuItem() {
  const [menuItemName, setMenuItemName] = useState('');
  const [drinkCategory, setDrinkCategory] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState<{ name: string; quantity: number }[]>([
    { name: '', quantity: 0 }
  ]);

  const categories = ['Milk Tea', 'Fruit Tea', 'Smoothie', 'Coffee', 'Seasonal'];

  const addIngredientRow = () => {
    setIngredients([...ingredients, { name: '', quantity: 0 }]);
  };

  const removeIngredientRow = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string | number) => {
    const updated = [...ingredients];
    updated[index][field] = value as never;
    setIngredients(updated);
  };

  const handleSubmit = async () => {
    if (!menuItemName || !drinkCategory || !price) {
      alert('Please fill in all required fields');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      // Add menu item
      const menuResponse = await fetch(`${API_BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuitemname: menuItemName,
          drinkcategory: drinkCategory,
          price: numPrice
        })
      });

      const menuResult = await menuResponse.json();
      if (!menuResult.success) {
        throw new Error(menuResult.error || 'Failed to add menu item');
      }

      // Add ingredients if any are specified
      const validIngredients = ingredients.filter(ing => ing.name && ing.quantity > 0);
      if (validIngredients.length > 0) {
        // TODO: Add API endpoint to link ingredients to menu item
        console.log('Ingredients to add:', validIngredients);
      }

      alert(`Menu item "${menuItemName}" added successfully!`);
      
      // Reset form
      setMenuItemName('');
      setDrinkCategory('');
      setPrice('');
      setIngredients([{ name: '', quantity: 0 }]);

    } catch (err) {
      console.error('Error adding menu item:', err);
      alert(`Failed to add menu item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal mt-0 mb-4">Add New Menu Item</h3>
      
      <div className="border border-gray-300 p-4 bg-gray-50 rounded">
        {/* Menu Item Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <input
              type="text"
              value={menuItemName}
              onChange={(e) => setMenuItemName(e.target.value)}
              className="w-full p-2 border border-gray-300 text-sm rounded"
              placeholder="e.g., Strawberry Matcha Latte"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={drinkCategory}
              onChange={(e) => setDrinkCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 text-sm rounded bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 text-sm rounded"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Ingredients Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Ingredients (Optional)</label>
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 text-sm rounded"
                  placeholder="Ingredient name"
                />
                <input
                  type="number"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-24 p-2 border border-gray-300 text-sm rounded"
                  placeholder="Qty"
                  min="0"
                />
                {ingredients.length > 1 && (
                  <Button 
                    onClick={() => removeIngredientRow(index)} 
                    size="sm"
                    className="bg-red-500 text-xs"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={addIngredientRow} size="sm" className="text-xs mt-2">
              + Add Ingredient
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-300">
            <Button onClick={handleSubmit} className="w-full">
              Add Menu Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddMenuItem;
