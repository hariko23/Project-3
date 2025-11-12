import API_BASE_URL from './config';

/**
 * Inventory item structure
 * Represents a single ingredient in the inventory
 */
export interface InventoryItem {
  ingredientid: number;
  ingredientname: string;
  ingredientcount: number;
}

/**
 * Data structure for adding a new inventory item
 */
export interface AddInventoryItemData {
  ingredientname: string;
  ingredientcount: number;
}

/**
 * Fetch all inventory items
 * @returns Promise resolving to an array of inventory items
 * @throws Error if the API request fails
 */
export const getAllInventory = async (): Promise<InventoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/inventory`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch inventory');
};

/**
 * Add a new inventory item
 * @param itemData - Object containing ingredientname and ingredientcount
 * @returns Promise resolving to the newly created inventory item
 * @throws Error if the API request fails
 */
export const addInventoryItem = async (itemData: AddInventoryItemData): Promise<InventoryItem> => {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData)
  });

  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to add inventory item');
};

/**
 * Update the quantity of an existing inventory item
 * @param id - Inventory item ID
 * @param newQuantity - New quantity value
 * @returns Promise resolving to the updated inventory item
 * @throws Error if the API request fails
 */
export const updateInventoryQuantity = async (id: number, newQuantity: number): Promise<InventoryItem> => {
  const response = await fetch(`${API_BASE_URL}/inventory/${id}/quantity`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newQuantity })
  });

  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to update inventory quantity');
};

