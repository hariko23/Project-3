import { useState } from 'react';
import Button from '../ui/Button';
import API_BASE_URL from '../../api/config';

interface ProductUsageData {
  ingredientname: string;
  totalused: number;
}

/**
 * Product Usage Chart Component
 * Displays inventory usage for a given time window
 */
function ProductUsageChart() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [usageData, setUsageData] = useState<ProductUsageData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/product-usage-chart?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      if (result.success) {
        setUsageData(result.data);
      }
    } catch (err) {
      console.error('Error fetching product usage:', err);
      alert('Failed to fetch product usage data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal mt-0 mb-4">Product Usage Chart</h3>
      
      {/* Date Range Selection */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div className="flex gap-2.5 items-center">
          <label className="text-sm font-medium">Time Period:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-gray-300 text-sm rounded"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border border-gray-300 text-sm rounded"
          />
          <Button onClick={fetchUsageData} disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Usage Data Table */}
      {usageData.length > 0 && (
        <div className="border border-gray-300">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="p-2.5 text-left text-sm font-bold">Ingredient</th>
                <th className="p-2.5 text-right text-sm font-bold">Total Used</th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-2.5 text-sm">{item.ingredientname}</td>
                  <td className="p-2.5 text-sm text-right">{item.totalused}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductUsageChart;
