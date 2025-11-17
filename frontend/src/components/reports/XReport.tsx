import { useState } from 'react';
import Button from '../ui/Button';
import API_BASE_URL from '../../api/config';

interface HourlySales {
  hour: number;
  sales: number;
  orders: number;
  avgOrderValue: number;
}

/**
 * X-Report Component
 * Shows sales activities per hour for the current day
 * Can be run multiple times without side effects
 */
function XReport() {
  const [reportData, setReportData] = useState<{
    hourlySales: HourlySales[];
    totalSales: number;
    totalOrders: number;
    paymentMethods: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/x-report`);
      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (err) {
      console.error('Error generating X-Report:', err);
      alert('Failed to generate X-Report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal mt-0 mb-4">X-Report (Current Day Sales)</h3>
      
      <div className="mb-4">
        <Button onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate X-Report'}
        </Button>
        <p className="text-xs text-gray-600 mt-2">
          This report shows hourly sales for today and can be run multiple times.
        </p>
      </div>

      {reportData && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1.5">Total Sales (Today)</div>
              <div className="text-2xl font-bold">${reportData.totalSales.toFixed(2)}</div>
            </div>
            <div className="border border-gray-300 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1.5">Total Orders</div>
              <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            </div>
          </div>

          {/* Hourly Sales Table */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 p-2 border-b border-gray-300">
              <h4 className="text-sm font-bold m-0">Hourly Breakdown</h4>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="p-2.5 text-left text-sm font-bold">Hour</th>
                  <th className="p-2.5 text-right text-sm font-bold">Sales</th>
                  <th className="p-2.5 text-right text-sm font-bold">Orders</th>
                  <th className="p-2.5 text-right text-sm font-bold">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {reportData.hourlySales.map((hour) => (
                  <tr key={hour.hour} className="border-b border-gray-200">
                    <td className="p-2.5 text-sm">
                      {hour.hour}:00 - {hour.hour + 1}:00
                    </td>
                    <td className="p-2.5 text-sm text-right">${hour.sales.toFixed(2)}</td>
                    <td className="p-2.5 text-sm text-right">{hour.orders}</td>
                    <td className="p-2.5 text-sm text-right">${hour.avgOrderValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Methods */}
          <div className="border border-gray-300 p-4">
            <h4 className="text-sm font-bold mb-2">Payment Methods</h4>
            {Object.entries(reportData.paymentMethods).map(([method, amount]) => (
              <div key={method} className="flex justify-between py-1 text-sm">
                <span>{method}</span>
                <span className="font-bold">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default XReport;
