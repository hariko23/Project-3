import { useState } from 'react';
import Button from '../ui/Button';
import API_BASE_URL from '../../api/config';

interface SalesReportItem {
  menuitemid: number;
  menuitemname: string;
  quantitysold: number;
  totalsales: number;
}

/**
 * Sales Report Component
 * Shows sales by item for a given time window
 */
function SalesReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [salesData, setSalesData] = useState<SalesReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSales, setTotalSales] = useState(0);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/analytics/sales-report?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      if (result.success) {
        setSalesData(result.data);
        const total = result.data.reduce((sum: number, item: SalesReportItem) => sum + item.totalsales, 0);
        setTotalSales(total);
      }
    } catch (err) {
      console.error('Error generating sales report:', err);
      alert('Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal mt-0 mb-4">Sales Report by Item</h3>
      
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
          <Button onClick={generateReport} disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Sales Summary */}
      {salesData.length > 0 && (
        <>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-gray-600">Total Sales</div>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
          </div>

          {/* Sales Data Table */}
          <div className="border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="p-2.5 text-left text-sm font-bold">Item ID</th>
                  <th className="p-2.5 text-left text-sm font-bold">Item Name</th>
                  <th className="p-2.5 text-right text-sm font-bold">Quantity Sold</th>
                  <th className="p-2.5 text-right text-sm font-bold">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {salesData
                  .sort((a, b) => b.totalsales - a.totalsales)
                  .map((item) => (
                    <tr key={item.menuitemid} className="border-b border-gray-200">
                      <td className="p-2.5 text-sm">{item.menuitemid}</td>
                      <td className="p-2.5 text-sm">{item.menuitemname}</td>
                      <td className="p-2.5 text-sm text-right">{item.quantitysold}</td>
                      <td className="p-2.5 text-sm text-right font-bold">
                        ${item.totalsales.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesReport;
