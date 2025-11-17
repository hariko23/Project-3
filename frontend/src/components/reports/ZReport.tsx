import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import API_BASE_URL from '../../api/config';

/**
 * Z-Report Component
 * End-of-day report that resets daily totals
 * Should only be run once per day
 */
function ZReport() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastRunDate, setLastRunDate] = useState<string | null>(null);
  const [canRunToday, setCanRunToday] = useState(true);

  useEffect(() => {
    checkLastRun();
  }, []);

  const checkLastRun = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/z-report/last-run`);
      const result = await response.json();
      if (result.success && result.lastRunDate) {
        setLastRunDate(result.lastRunDate);
        const lastRun = new Date(result.lastRunDate).toDateString();
        const today = new Date().toDateString();
        setCanRunToday(lastRun !== today);
      }
    } catch (err) {
      console.error('Error checking last Z-Report run:', err);
    }
  };

  const generateReport = async () => {
    if (!canRunToday) {
      alert('Z-Report has already been run today. It can only be run once per day.');
      return;
    }

    const confirmed = window.confirm(
      'WARNING: This will generate the end-of-day report and reset all daily totals to zero. This action cannot be undone. Continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/z-report`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
        setCanRunToday(false);
        setLastRunDate(new Date().toISOString());
      }
    } catch (err) {
      console.error('Error generating Z-Report:', err);
      alert('Failed to generate Z-Report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal mt-0 mb-4">Z-Report (End of Day)</h3>
      
      <div className="mb-4">
        <Button 
          onClick={generateReport} 
          disabled={loading || !canRunToday}
          className={!canRunToday ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {loading ? 'Generating...' : 'Generate Z-Report'}
        </Button>
        <div className="mt-2 text-xs">
          {!canRunToday && (
            <p className="text-red-600 font-bold">
              Z-Report already run today. Cannot run again until tomorrow.
            </p>
          )}
          {lastRunDate && (
            <p className="text-gray-600">
              Last run: {new Date(lastRunDate).toLocaleString()}
            </p>
          )}
          <p className="text-gray-600 mt-1">
            ⚠️ This report resets daily totals and should only be run at end of day.
          </p>
        </div>
      </div>

      {reportData && (
        <div className="space-y-4">
          <div className="border border-green-300 bg-green-50 p-4 rounded">
            <p className="text-sm font-bold text-green-800">
              ✓ Z-Report Generated Successfully
            </p>
            <p className="text-xs text-green-700 mt-1">
              Daily totals have been reset to zero.
            </p>
          </div>

          {/* Sales Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-300 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1.5">Total Sales</div>
              <div className="text-2xl font-bold">${reportData.totalSales?.toFixed(2)}</div>
            </div>
            <div className="border border-gray-300 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1.5">Total Orders</div>
              <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            </div>
            <div className="border border-gray-300 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1.5">Total Cash</div>
              <div className="text-2xl font-bold">${reportData.totalCash?.toFixed(2)}</div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border border-gray-300 p-4">
            <h4 className="text-sm font-bold mb-3">Day Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Tax Collected:</p>
                <p className="font-bold">${reportData.taxCollected?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Discounts:</p>
                <p className="font-bold">${reportData.discounts?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZReport;
