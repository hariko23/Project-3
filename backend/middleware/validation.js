const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema object
 * @param {string} property - Property to validate (body, params, query)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }
    next();
  };
};

// Order validation schemas
const createOrderSchema = Joi.object({
  totalcost: Joi.number().positive().required(),
  employeeid: Joi.number().integer().positive().required(),
  orderweek: Joi.number().integer().min(1).max(53).required(),
  orderItems: Joi.array().items(
    Joi.object({
      menuitemid: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
      size: Joi.string().valid('Small', 'Medium', 'Large').optional(),
      price: Joi.number().positive().optional()
    })
  ).min(1).required()
});

// Menu item validation schemas
const createMenuItemSchema = Joi.object({
  menuitemname: Joi.string().trim().min(1).max(255).required(),
  drinkcategory: Joi.string().trim().min(1).max(100).required(),
  price: Joi.number().positive().required()
});

// Inventory validation schemas
const updateInventorySchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
  reorder_level: Joi.number().integer().positive().optional()
});

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const orderItemIdParamSchema = Joi.object({
  orderItemId: Joi.number().integer().positive().required()
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.number().integer().positive().required()
});

module.exports = {
  validate,
  createOrderSchema,
  createMenuItemSchema,
  updateInventorySchema,
  idParamSchema,
  orderItemIdParamSchema,
  orderIdParamSchema
};