const pool = require('../config/database');

const getAllEmployees = async (req, res) => {
    try {
        const query = 'SELECT employeeid, employeename, employeerole, hoursworked FROM employees ORDER BY employeename';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const addEmployee = async (req, res) => {
    try {
        const { employeename, employeerole, hoursworked } = req.body;
        
        if (!employeename || !employeerole || hoursworked === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const idResult = await pool.query('SELECT COALESCE(MAX(employeeid), 0) + 1 as next_id FROM employees');
        const nextId = idResult.rows[0].next_id;

        const query = 'INSERT INTO employees (employeeid, employeename, employeerole, hoursworked) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [nextId, employeename, employeerole, hoursworked]);
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeename, employeerole, hoursworked } = req.body;

        if (!employeename || !employeerole || hoursworked === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const query = 'UPDATE employees SET employeename = $1, employeerole = $2, hoursworked = $3 WHERE employeeid = $4 RETURNING *';
        const result = await pool.query(query, [employeename, employeerole, hoursworked, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM employees WHERE employeeid = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
};