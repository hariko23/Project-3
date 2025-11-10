const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.getAllMenuItems);
router.post('/', menuController.addMenuItem);
router.put('/:id/price', menuController.updateMenuItemPrice);

module.exports = router;