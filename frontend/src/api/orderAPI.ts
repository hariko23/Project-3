import API_BASE_URL from './config';

export interface OrderItem {
  menuitemid: number;
  quantity: number;
}

export interface CreateOrderData {
  timeoforder?: string;
  customerid?: number | null;
  employeeid: number;
  totalcost: number;
  orderweek: number;
  orderItems: OrderItem[];
}

export interface OrderResponse {
  orderid: number;
  timeoforder: string;
  customerid: number | null;
  employeeid: number;
  totalcost: number;
  orderweek: number;
  is_complete: boolean;
}

export interface OrderItemDetail {
  orderitemid: number;
  orderid: number;
  menuitemid: number;
  quantity: number;
  is_complete: boolean;
  menuitemname: string;
  price: number;
}

export const getAllOrders = async (): Promise<OrderResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch orders');
};

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

export const getOrderItems = async (orderId: number): Promise<OrderItemDetail[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch order items');
};

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