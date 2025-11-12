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