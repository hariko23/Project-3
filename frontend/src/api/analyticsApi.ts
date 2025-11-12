import API_BASE_URL from './config';

/**
 * Product usage data structure
 * Maps menu item names to their total quantity sold in the last 30 days
 */
export interface ProductUsageData {
  [menuitemname: string]: number;
}

/**
 * Sales data structure
 * Contains total sales amount for a given date range
 */
export interface SalesData {
  totalSales: number;
}

/**
 * Fetch product usage data for the last 30 days
 * @returns Promise resolving to an object mapping menu item names to quantities sold
 * @throws Error if the API request fails
 */
export const getProductUsageData = async (): Promise<ProductUsageData> => {
  const response = await fetch(`${API_BASE_URL}/analytics/product-usage`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch product usage data');
};

/**
 * Fetch total sales for a specific date range
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise resolving to sales data with totalSales property
 * @throws Error if the API request fails
 */
export const getTotalSales = async (startDate: string, endDate: string): Promise<SalesData> => {
  const response = await fetch(`${API_BASE_URL}/analytics/sales?startDate=${startDate}&endDate=${endDate}`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to fetch sales data');
};

