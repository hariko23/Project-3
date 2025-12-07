-- Drop and recreate inventory table with sample data
-- This migration drops the existing inventory table and repopulates it

-- Drop the table if it exists (CASCADE to handle any foreign key dependencies)
DROP TABLE IF EXISTS inventory CASCADE;

-- Create inventory table
CREATE TABLE inventory (
    ingredientid INTEGER PRIMARY KEY,
    ingredientname VARCHAR(255) NOT NULL,
    ingredientcount INTEGER NOT NULL DEFAULT 0
);

-- Create index on ingredientname for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(ingredientname);

-- Populate with sample inventory items
INSERT INTO inventory (ingredientid, ingredientname, ingredientcount) VALUES
(1, 'Black Tea', 500),
(2, 'Green Tea', 450),
(3, 'Jasmine Tea', 400),
(4, 'Oolong Tea', 350),
(5, 'Earl Grey Tea', 300),
(6, 'Matcha Powder', 200),
(7, 'Taro Powder', 250),
(8, 'Milk', 1000),
(9, 'Creamer', 800),
(10, 'Sugar', 2000),
(11, 'Honey', 500),
(12, 'Brown Sugar', 600),
(13, 'Tapioca Pearls', 1500),
(14, 'Mango Syrup', 300),
(15, 'Strawberry Syrup', 300),
(16, 'Peach Syrup', 300),
(17, 'Passion Fruit Syrup', 250),
(18, 'Lychee Syrup', 250),
(19, 'Grapefruit Syrup', 200),
(20, 'Watermelon Syrup', 250),
(21, 'Pineapple Syrup', 200),
(22, 'Honeydew Syrup', 200),
(23, 'Coffee Beans', 400),
(24, 'Ice', 5000),
(25, 'Aloe Vera', 300),
(26, 'Winter Melon Syrup', 200),
(27, 'Caramel Syrup', 250),
(28, 'Vanilla Extract', 150),
(29, 'Coconut Milk', 400),
(30, 'Condensed Milk', 300);

