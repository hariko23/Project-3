const pool = require('../config/database');

/**
 * Get product usage data for the last 30 days
 * Returns a count of how many times each menu item was sold
 * @route GET /api/analytics/product-usage
 * @returns {Object} Object with menu item names as keys and total sold as values
 */
const getProductUsageData = async (req, res) => {
    try {
        const query = `
            SELECT m.menuitemname, SUM(oi.quantity) as total_sold
            FROM menuitems m
            JOIN orderitems oi ON m.menuitemid = oi.menuitemid
            JOIN orders o ON oi.orderid = o.orderid
            WHERE DATE(o.timeoforder) >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY m.menuitemname
            ORDER BY total_sold DESC
        `;
        const result = await pool.query(query);
        
        const usage = {};
        result.rows.forEach(row => {
            usage[row.menuitemname] = parseInt(row.total_sold);
        });
        
        res.json({ success: true, data: usage });
    } catch (error) {
        console.error('Error fetching product usage data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get total sales for a date range
 * @route GET /api/analytics/sales
 * @param {string} startDate - Start date (YYYY-MM-DD format)
 * @param {string} endDate - End date (YYYY-MM-DD format)
 * @returns {Object} Object with totalSales property
 */
const getTotalSales = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate required query parameters
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'startDate and endDate query parameters are required' });
        }

        // Calculate total sales for the date range
        const query = 'SELECT COALESCE(SUM(totalcost), 0) as total FROM orders WHERE DATE(timeoforder) BETWEEN $1 AND $2';
        const result = await pool.query(query, [startDate, endDate]);
        
        res.json({ success: true, data: { totalSales: parseFloat(result.rows[0].total) } });
    } catch (error) {
        console.error('Error fetching total sales:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getProductUsageData,
    getTotalSales,
    getProductUsageChart,
    getXReport,
    getZReportLastRun,
    generateZReport,
    getSalesReport
};

/**
 * Get product usage (inventory) for a given time window
 * @route GET /api/analytics/product-usage-chart
 */
const getProductUsageChart = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'startDate and endDate required' });
        }

        const query = `
            SELECT i.ingredientname, COALESCE(SUM(mii.quantityused * oi.quantity), 0) as totalused
            FROM inventory i
            LEFT JOIN menuitemingredients mii ON i.ingredientid = mii.ingredientid
            LEFT JOIN orderitems oi ON mii.menuitemid = oi.menuitemid
            LEFT JOIN orders o ON oi.orderid = o.orderid
            WHERE DATE(o.timeoforder) BETWEEN $1 AND $2
            GROUP BY i.ingredientname
            ORDER BY totalused DESC
        `;
        
        const result = await pool.query(query, [startDate, endDate]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching product usage chart:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get X-Report (hourly sales for current day, no side effects)
 * @route GET /api/analytics/x-report
 */
const getXReport = async (req, res) => {
    try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Get hourly sales
        const hourlyQuery = `
            SELECT 
                EXTRACT(HOUR FROM timeoforder) as hour,
                COALESCE(SUM(totalcost), 0) as sales,
                COUNT(*) as orders,
                COALESCE(AVG(totalcost), 0) as avgOrderValue
            FROM orders
            WHERE DATE(timeoforder) = $1
            GROUP BY EXTRACT(HOUR FROM timeoforder)
            ORDER BY hour
        `;
        const hourlyResult = await pool.query(hourlyQuery, [today]);
        
        // Get total sales
        const totalQuery = `
            SELECT 
                COALESCE(SUM(totalcost), 0) as totalSales,
                COUNT(*) as totalOrders
            FROM orders
            WHERE DATE(timeoforder) = $1
        `;
        const totalResult = await pool.query(totalQuery, [today]);
        
        // Get payment methods (placeholder - adjust based on your schema)
        const paymentMethods = {
            'Cash': totalResult.rows[0].totalsales * 0.4,
            'Credit Card': totalResult.rows[0].totalsales * 0.5,
            'Debit Card': totalResult.rows[0].totalsales * 0.1
        };
        
        res.json({
            success: true,
            data: {
                hourlySales: hourlyResult.rows.map(row => ({
                    hour: parseInt(row.hour),
                    sales: parseFloat(row.sales),
                    orders: parseInt(row.orders),
                    avgOrderValue: parseFloat(row.avgordervalue)
                })),
                totalSales: parseFloat(totalResult.rows[0].totalsales),
                totalOrders: parseInt(totalResult.rows[0].totalorders),
                paymentMethods
            }
        });
    } catch (error) {
        console.error('Error generating X-Report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get last Z-Report run date
 * @route GET /api/analytics/z-report/last-run
 */
const getZReportLastRun = async (req, res) => {
    try {
        // Check if z_report_log table exists, create if not
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS z_report_log (
                id SERIAL PRIMARY KEY,
                run_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(createTableQuery);
        
        const query = 'SELECT run_date FROM z_report_log ORDER BY run_date DESC LIMIT 1';
        const result = await pool.query(query);
        
        res.json({
            success: true,
            lastRunDate: result.rows.length > 0 ? result.rows[0].run_date : null
        });
    } catch (error) {
        console.error('Error checking Z-Report last run:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Generate Z-Report (end-of-day report with side effects)
 * @route POST /api/analytics/z-report
 */
const generateZReport = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if already run today
        const checkQuery = `
            SELECT * FROM z_report_log 
            WHERE DATE(run_date) = $1
        `;
        const checkResult = await pool.query(checkQuery, [today]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Z-Report has already been run today'
            });
        }
        
        // Get today's totals
        const totalsQuery = `
            SELECT 
                COALESCE(SUM(totalcost), 0) as totalSales,
                COUNT(*) as totalOrders,
                COALESCE(SUM(CASE WHEN is_complete = true THEN totalcost ELSE 0 END), 0) as totalCash
            FROM orders
            WHERE DATE(timeoforder) = $1
        `;
        const totalsResult = await pool.query(totalsQuery, [today]);
        
        const reportData = {
            totalSales: parseFloat(totalsResult.rows[0].totalsales),
            totalOrders: parseInt(totalsResult.rows[0].totalorders),
            totalCash: parseFloat(totalsResult.rows[0].totalcash),
            taxCollected: parseFloat(totalsResult.rows[0].totalsales) * 0.0825, // 8.25% tax
            discounts: 0 // Placeholder
        };
        
        // Log the Z-Report run
        await pool.query('INSERT INTO z_report_log (run_date) VALUES (CURRENT_TIMESTAMP)');
        
        // Note: In a real system, you might reset daily counters here
        // For this implementation, we're just logging the report generation
        
        res.json({ success: true, data: reportData });
    } catch (error) {
        console.error('Error generating Z-Report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get sales report by item for a given time window
 * @route GET /api/analytics/sales-report
 */
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'startDate and endDate required' });
        }

        const query = `
            SELECT 
                m.menuitemid,
                m.menuitemname,
                COALESCE(SUM(oi.quantity), 0) as quantitysold,
                COALESCE(SUM(oi.quantity * m.price), 0) as totalsales
            FROM menuitems m
            LEFT JOIN orderitems oi ON m.menuitemid = oi.menuitemid
            LEFT JOIN orders o ON oi.orderid = o.orderid
            WHERE DATE(o.timeoforder) BETWEEN $1 AND $2
            GROUP BY m.menuitemid, m.menuitemname
            HAVING SUM(oi.quantity) > 0
            ORDER BY totalsales DESC
        `;
        
        const result = await pool.query(query, [startDate, endDate]);
        
        res.json({
            success: true,
            data: result.rows.map(row => ({
                menuitemid: parseInt(row.menuitemid),
                menuitemname: row.menuitemname,
                quantitysold: parseInt(row.quantitysold),
                totalsales: parseFloat(row.totalsales)
            }))
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

