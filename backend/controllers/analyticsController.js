const pool = require('../config/database');

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

const getTotalSales = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'startDate and endDate query parameters are required' });
        }

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
    getTotalSales
};

