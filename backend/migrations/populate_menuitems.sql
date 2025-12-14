-- Drop and recreate menuitems table with sample data
-- This migration drops the existing menuitems table and repopulates it

-- Drop the table if it exists (CASCADE to handle any foreign key dependencies)
DROP TABLE IF EXISTS menuitems CASCADE;

-- Create menuitems table
CREATE TABLE menuitems (
    menuitemid INTEGER PRIMARY KEY,
    drinkcategory VARCHAR(255) NOT NULL,
    menuitemname VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Create index on drinkcategory for faster filtering
CREATE INDEX IF NOT EXISTS idx_menuitems_category ON menuitems(drinkcategory);

-- Create index on menuitemname for faster lookups
CREATE INDEX IF NOT EXISTS idx_menuitems_name ON menuitems(menuitemname);

-- Populate with sample menu items
INSERT INTO menuitems (menuitemid, drinkcategory, menuitemname, price) VALUES
-- Milk Tea Category
(1, 'Milk Tea', 'Classic Milk Tea', 5.50),
(2, 'Milk Tea', 'Taro Milk Tea', 6.00),
(3, 'Milk Tea', 'Thai Milk Tea', 5.75),
(4, 'Milk Tea', 'Jasmine Milk Tea', 5.50),
(5, 'Milk Tea', 'Honeydew Milk Tea', 6.25),
(6, 'Milk Tea', 'Matcha Milk Tea', 6.50),
(7, 'Milk Tea', 'Oolong Milk Tea', 5.75),
(8, 'Milk Tea', 'Earl Grey Milk Tea', 5.75),

-- Fruit Tea Category
(9, 'Fruit Tea', 'Passion Fruit Tea', 5.00),
(10, 'Fruit Tea', 'Mango Green Tea', 5.50),
(11, 'Fruit Tea', 'Strawberry Green Tea', 5.50),
(12, 'Fruit Tea', 'Peach Oolong Tea', 5.75),
(13, 'Fruit Tea', 'Lychee Green Tea', 5.50),
(14, 'Fruit Tea', 'Grapefruit Green Tea', 5.75),
(15, 'Fruit Tea', 'Watermelon Green Tea', 5.50),
(16, 'Fruit Tea', 'Pineapple Green Tea', 5.50),

-- Slush Category
(17, 'Slush', 'Mango Slush', 6.00),
(18, 'Slush', 'Strawberry Slush', 6.00),
(19, 'Slush', 'Taro Slush', 6.50),
(20, 'Slush', 'Watermelon Slush', 6.00),
(21, 'Slush', 'Passion Fruit Slush', 6.00),
(22, 'Slush', 'Peach Slush', 6.25),

-- Coffee Category
(23, 'Coffee', 'Vietnamese Coffee', 5.50),
(24, 'Coffee', 'Coffee Milk Tea', 5.75),
(25, 'Coffee', 'Iced Americano', 4.50),
(26, 'Coffee', 'Caramel Macchiato', 6.00),

-- Specialty Category
(27, 'Specialty', 'Brown Sugar Boba Milk', 6.50),
(28, 'Specialty', 'Tiger Sugar Milk', 6.75),
(29, 'Specialty', 'Honey Lemon Aloe Vera', 5.75),
(30, 'Specialty', 'Winter Melon Tea', 4.75);






