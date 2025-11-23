import API_BASE_URL from './config';

/**
 * Menu item structure
 * Represents a single item on the menu
 */
export interface MenuItem {
    menuitemid: number;
    drinkcategory: string;
    menuitemname: string;
    price: number;
}

/**
 * Menu item ingredient structure
 * Represents an ingredient used in a menu item
 */
export interface MenuItemIngredient {
    ingredientid: number;
    ingredientname: string;
    ingredientqty: number;
}

/**
 * Fetch all menu items
 * @returns Promise resolving to an array of menu items
 * Note: Prices are converted to numbers to handle potential string returns from database
 * @throws Error if the API request fails
 */
export const getAllMenuItems = async (): Promise<MenuItem[]> => {
    const response = await fetch(`${API_BASE_URL}/menu`);
    const result = await response.json();
    if (result.success) {
        // Ensure price is always a number (database might return it as string)
        return result.data.map((item: any) => ({
        ...item,
        price: Number(item.price)
        }));
    }
    throw new Error(result.error || 'Failed to fetch menu items');
};

/**
 * Add a new menu item
 * @param drinkcategory - Category of the drink
 * @param menuitemname - Name of the menu item
 * @param price - Price of the menu item
 * @returns Promise resolving to the newly created menu item
 * @throws Error if the API request fails
 */
export const addMenuItem = async (drinkcategory: string, menuitemname: string, price: number): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE_URL}/menu`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drinkcategory, menuitemname, price })
    });

    const result = await response.json();
    if (result.success) {
        return {
            ...result.data,
            price: Number(result.data.price)
        };
    }
    throw new Error(result.error || 'Failed to add menu item');
};

/**
 * Update a menu item
 * @param menuItemId - The ID of the menu item to update
 * @param updates - Object with optional fields: drinkcategory, menuitemname, price
 * @returns Promise resolving to the updated menu item
 * @throws Error if the API request fails
 */
export const updateMenuItem = async (menuItemId: number, updates: { drinkcategory?: string; menuitemname?: string; price?: number }): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
    });

    const result = await response.json();
    if (result.success) {
        return {
            ...result.data,
            price: Number(result.data.price)
        };
    }
    throw new Error(result.error || 'Failed to update menu item');
};

/**
 * Delete a menu item
 * @param menuItemId - The ID of the menu item to delete
 * @returns Promise resolving to success confirmation
 * @throws Error if the API request fails
 */
export const deleteMenuItem = async (menuItemId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to delete menu item');
    }
};

/**
 * Fetch ingredients for a specific menu item
 * @param menuItemId - The ID of the menu item
 * @returns Promise resolving to an array of ingredients
 * @throws Error if the API request fails
 */
export const getMenuItemIngredients = async (menuItemId: number): Promise<MenuItemIngredient[]> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}/ingredients`);
    const result = await response.json();
    if (result.success) {
        return result.data;
    }
    throw new Error(result.error || 'Failed to fetch menu item ingredients');
};

/**
 * Update ingredient quantity for a menu item
 * @param menuItemId - The ID of the menu item
 * @param ingredientId - The ID of the ingredient
 * @param ingredientqty - The new quantity
 * @returns Promise resolving to the updated ingredient
 * @throws Error if the API request fails
 */
export const updateMenuItemIngredient = async (menuItemId: number, ingredientId: number, ingredientqty: number): Promise<MenuItemIngredient> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}/ingredients/${ingredientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientqty })
    });

    const result = await response.json();
    if (result.success) {
        return result.data;
    }
    throw new Error(result.error || 'Failed to update menu item ingredient');
};

/**
 * Add an ingredient to a menu item
 * @param menuItemId - The ID of the menu item
 * @param ingredientid - The ID of the ingredient to add
 * @param ingredientqty - The quantity of the ingredient
 * @returns Promise resolving to the newly added ingredient
 * @throws Error if the API request fails
 */
export const addMenuItemIngredient = async (menuItemId: number, ingredientid: number, ingredientqty: number): Promise<MenuItemIngredient> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}/ingredients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientid, ingredientqty })
    });

    const result = await response.json();
    if (result.success) {
        return result.data;
    }
    throw new Error(result.error || 'Failed to add menu item ingredient');
};

/**
 * Remove an ingredient from a menu item
 * @param menuItemId - The ID of the menu item
 * @param ingredientId - The ID of the ingredient to remove
 * @returns Promise resolving to success confirmation
 * @throws Error if the API request fails
 */
export const removeMenuItemIngredient = async (menuItemId: number, ingredientId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/menu/${menuItemId}/ingredients/${ingredientId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to remove menu item ingredient');
    }
};