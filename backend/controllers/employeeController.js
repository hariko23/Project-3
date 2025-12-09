const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all employees
 * @route GET /api/employees
 * @returns {Array} Array of employees with employeeid, employeename, employeerole, and hoursworked
 */
const getAllEmployees = asyncHandler(async (req, res) => {
    const query = 'SELECT employeeid, employeename, employeerole, hoursworked FROM employees ORDER BY employeename';
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
});

/**
 * Add a new employee
 * @route POST /api/employees
 * @param {string} employeename - Name of the employee
 * @param {string} employeerole - Role of the employee (e.g., "Manager", "Cashier")
 * @param {number} hoursworked - Hours worked by the employee
 * @returns {Object} The newly created employee
 */
const addEmployee = asyncHandler(async (req, res) => {
    const { employeename, employeerole, hoursworked } = req.body;
    
    // Validate required fields
    if (!employeename || !employeerole || hoursworked === undefined) {
        throw new AppError('Missing required fields', 400);
    }

    // Generate next available ID
    const idResult = await pool.query('SELECT COALESCE(MAX(employeeid), 0) + 1 as next_id FROM employees');
    const nextId = idResult.rows[0].next_id;

    const query = 'INSERT INTO employees (employeeid, employeename, employeerole, hoursworked) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [nextId, employeename, employeerole, hoursworked]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
});

/**
 * Update an existing employee
 * @route PUT /api/employees/:id
 * @param {number} id - Employee ID (from URL params)
 * @param {string} employeename - Updated employee name (from request body)
 * @param {string} employeerole - Updated employee role (from request body)
 * @param {number} hoursworked - Updated hours worked (from request body)
 * @returns {Object} Updated employee
 */
const updateEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { employeename, employeerole, hoursworked } = req.body;

    // Validate required fields
    if (!employeename || !employeerole || hoursworked === undefined) {
        throw new AppError('Missing required fields', 400);
    }

    // Update employee information
    const query = 'UPDATE employees SET employeename = $1, employeerole = $2, hoursworked = $3 WHERE employeeid = $4 RETURNING *';
    const result = await pool.query(query, [employeename, employeerole, hoursworked, id]);

    if (result.rows.length === 0) {
        throw new AppError('Employee not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
});

/**
 * Delete an employee
 * @route DELETE /api/employees/:id
 * @param {number} id - Employee ID (from URL params)
 * @returns {Object} Success message
 */
const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Delete employee by ID
    const query = 'DELETE FROM employees WHERE employeeid = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        throw new AppError('Employee not found', 404);
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
});

module.exports = {
    getAllEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
};