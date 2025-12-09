import API_BASE_URL from './config';

/**
 * Order item structure for creating orders
 * Contains menu item ID, quantity, size, and price
 */
export interface OrderItem {
  menuitemid: number;
  quantity: number;
  size?: string; // Optional size: Small, Medium, or Large (defaults to Medium)
  price?: number; // Optional price per item (calculated based on size)
  toppings?: string[]; // Optional array of topping IDs
  iceLevel?: number; // Optional ice level (0-100)
  sugarLevel?: number; // Optional sugar level (0-100)
  isHot?: boolean; // Optional hot option
}

/**
 * Data structure for creating a new order
 */
export interface CreateOrderData {
  timeoforder?: string; // Optional ISO timestamp, defaults to current time
  customerid?: number | null; // Optional customer ID
  employeeid: number; // Required employee ID who created the order
  totalcost: number; // Total cost of the order
  orderweek: number; // Week number of the order
  orderItems: OrderItem[]; // Array of items in the order
}

/**
 * Order response structure
 * Represents a complete order record
 */
export interface OrderResponse {
  orderid: number;
  timeoforder: string;
  customerid: number | null;
  employeeid: number;
  totalcost: number;
  orderweek: number;
  is_complete: boolean;
  size: string;
}

/**
 * Order item detail structure
 * Contains order item information with menu item details
 */
export interface OrderItemDetail {
  orderitemid: number;
  orderid: number;
  menuitemid: number;
  quantity: number;
  is_complete: boolean;
  size: string;
  menuitemname: string;
  price: number;
  toppings?: string; // Optional comma-separated list of topping IDs
  iceLevel?: number; // Ice level: 0-100 (0=no ice, 25=light, 50=regular, 100=extra)
  sugarLevel?: number; // Sugar level: 0-100
  isHot?: boolean; // Whether the drink should be served hot
  // Database column aliases for compatibility
  icelevel?: number; // Database column name
  sugarlevel?: number; // Database column name
  is_hot?: boolean; // Database column name
}

/**
 * Fetch all orders
 * @returns Promise resolving to an array of all orders
 * @throws Error if the API request fails
 */
export const getAllOrders = async (): Promise<OrderResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch orders');
};

/**
 * Create a new order
 * Validates inventory and creates order with items in a transaction
 * @param orderData - Order data including items, employee, and totals
 * @returns Promise resolving to the newly created order
 * @throws Error if the API request fails or inventory is insufficient
 */
export const createOrder = async (orderData: CreateOrderData): Promise<OrderResponse> => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to create order');
};

/**
 * Fetch all items for a specific order
 * @param orderId - The ID of the order
 * @returns Promise resolving to an array of order items with menu details
 * @throws Error if the API request fails
 */
export const getOrderItems = async (orderId: number): Promise<OrderItemDetail[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch order items');
};

/**
 * Mark an order item as complete or incomplete
 * Also updates the order status if all items are complete
 * @param orderItemId - The ID of the order item to update
 * @param isComplete - Whether the item is complete (defaults to true)
 * @returns Promise resolving to the updated order item
 * @throws Error if the API request fails
 */
export const markOrderItemComplete = async (orderItemId: number, isComplete: boolean = true): Promise<OrderItemDetail> => {
  const response = await fetch(`${API_BASE_URL}/orders/items/${orderItemId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isComplete })
  });

  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to update order item');
};