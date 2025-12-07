-- Drop and recreate menuitemingredients table with sample data
-- This migration drops the existing menuitemingredients table and repopulates it
-- Note: This assumes menuitems and inventory tables already exist

-- Drop the table if it exists (CASCADE to handle any foreign key dependencies)
DROP TABLE IF EXISTS menuitemingredients CASCADE;

-- Create menuitemingredients table
CREATE TABLE menuitemingredients (
    menuitemingredientid INTEGER PRIMARY KEY,
    menuitemid INTEGER NOT NULL,
    ingredientid INTEGER NOT NULL,
    ingredientqty INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (menuitemid) REFERENCES menuitems(menuitemid) ON DELETE CASCADE,
    FOREIGN KEY (ingredientid) REFERENCES inventory(ingredientid) ON DELETE CASCADE,
    UNIQUE(menuitemid, ingredientid)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_menuitemingredients_menuitemid ON menuitemingredients(menuitemid);
CREATE INDEX IF NOT EXISTS idx_menuitemingredients_ingredientid ON menuitemingredients(ingredientid);

-- Populate with sample menu item ingredient mappings
INSERT INTO menuitemingredients (menuitemingredientid, menuitemid, ingredientid, ingredientqty) VALUES
-- Classic Milk Tea (menuitemid=1)
(1, 1, 1, 2),   -- Black Tea: 2 units
(2, 1, 8, 1),   -- Milk: 1 unit
(3, 1, 10, 1),  -- Sugar: 1 unit
(4, 1, 13, 1),  -- Tapioca Pearls: 1 unit
(5, 1, 24, 3),  -- Ice: 3 units

-- Taro Milk Tea (menuitemid=2)
(6, 2, 1, 1),   -- Black Tea: 1 unit
(7, 2, 7, 2),   -- Taro Powder: 2 units
(8, 2, 8, 1),   -- Milk: 1 unit
(9, 2, 10, 1),  -- Sugar: 1 unit
(10, 2, 13, 1), -- Tapioca Pearls: 1 unit
(11, 2, 24, 3), -- Ice: 3 units

-- Thai Milk Tea (menuitemid=3)
(12, 3, 1, 2),  -- Black Tea: 2 units
(13, 3, 8, 1),  -- Milk: 1 unit
(14, 3, 9, 1),  -- Creamer: 1 unit
(15, 3, 10, 1), -- Sugar: 1 unit
(16, 3, 13, 1), -- Tapioca Pearls: 1 unit
(17, 3, 24, 3), -- Ice: 3 units

-- Jasmine Milk Tea (menuitemid=4)
(18, 4, 3, 2),  -- Jasmine Tea: 2 units
(19, 4, 8, 1),  -- Milk: 1 unit
(20, 4, 10, 1), -- Sugar: 1 unit
(21, 4, 13, 1), -- Tapioca Pearls: 1 unit
(22, 4, 24, 3), -- Ice: 3 units

-- Honeydew Milk Tea (menuitemid=5)
(23, 5, 1, 1),  -- Black Tea: 1 unit
(24, 5, 22, 2), -- Honeydew Syrup: 2 units
(25, 5, 8, 1),  -- Milk: 1 unit
(26, 5, 13, 1), -- Tapioca Pearls: 1 unit
(27, 5, 24, 3), -- Ice: 3 units

-- Matcha Milk Tea (menuitemid=6)
(28, 6, 6, 2),  -- Matcha Powder: 2 units
(29, 6, 8, 1),  -- Milk: 1 unit
(30, 6, 10, 1), -- Sugar: 1 unit
(31, 6, 13, 1), -- Tapioca Pearls: 1 unit
(32, 6, 24, 3), -- Ice: 3 units

-- Oolong Milk Tea (menuitemid=7)
(33, 7, 4, 2),  -- Oolong Tea: 2 units
(34, 7, 8, 1),  -- Milk: 1 unit
(35, 7, 10, 1), -- Sugar: 1 unit
(36, 7, 13, 1), -- Tapioca Pearls: 1 unit
(37, 7, 24, 3), -- Ice: 3 units

-- Earl Grey Milk Tea (menuitemid=8)
(38, 8, 5, 2),  -- Earl Grey Tea: 2 units
(39, 8, 8, 1),  -- Milk: 1 unit
(40, 8, 10, 1), -- Sugar: 1 unit
(41, 8, 13, 1), -- Tapioca Pearls: 1 unit
(42, 8, 24, 3), -- Ice: 3 units

-- Passion Fruit Tea (menuitemid=9)
(43, 9, 2, 2),  -- Green Tea: 2 units
(44, 9, 17, 2), -- Passion Fruit Syrup: 2 units
(45, 9, 10, 1), -- Sugar: 1 unit
(46, 9, 24, 3), -- Ice: 3 units

-- Mango Green Tea (menuitemid=10)
(47, 10, 2, 2), -- Green Tea: 2 units
(48, 10, 14, 2), -- Mango Syrup: 2 units
(49, 10, 10, 1), -- Sugar: 1 unit
(50, 10, 24, 3), -- Ice: 3 units

-- Strawberry Green Tea (menuitemid=11)
(51, 11, 2, 2), -- Green Tea: 2 units
(52, 11, 15, 2), -- Strawberry Syrup: 2 units
(53, 11, 10, 1), -- Sugar: 1 unit
(54, 11, 24, 3), -- Ice: 3 units

-- Peach Oolong Tea (menuitemid=12)
(55, 12, 4, 2), -- Oolong Tea: 2 units
(56, 12, 16, 2), -- Peach Syrup: 2 units
(57, 12, 10, 1), -- Sugar: 1 unit
(58, 12, 24, 3), -- Ice: 3 units

-- Lychee Green Tea (menuitemid=13)
(59, 13, 2, 2), -- Green Tea: 2 units
(60, 13, 18, 2), -- Lychee Syrup: 2 units
(61, 13, 10, 1), -- Sugar: 1 unit
(62, 13, 24, 3), -- Ice: 3 units

-- Grapefruit Green Tea (menuitemid=14)
(63, 14, 2, 2), -- Green Tea: 2 units
(64, 14, 19, 2), -- Grapefruit Syrup: 2 units
(65, 14, 10, 1), -- Sugar: 1 unit
(66, 14, 24, 3), -- Ice: 3 units

-- Watermelon Green Tea (menuitemid=15)
(67, 15, 2, 2), -- Green Tea: 2 units
(68, 15, 20, 2), -- Watermelon Syrup: 2 units
(69, 15, 10, 1), -- Sugar: 1 unit
(70, 15, 24, 3), -- Ice: 3 units

-- Pineapple Green Tea (menuitemid=16)
(71, 16, 2, 2), -- Green Tea: 2 units
(72, 16, 21, 2), -- Pineapple Syrup: 2 units
(73, 16, 10, 1), -- Sugar: 1 unit
(74, 16, 24, 3), -- Ice: 3 units

-- Mango Slush (menuitemid=17)
(75, 17, 14, 3), -- Mango Syrup: 3 units
(76, 17, 10, 1), -- Sugar: 1 unit
(77, 17, 24, 5), -- Ice: 5 units

-- Strawberry Slush (menuitemid=18)
(78, 18, 15, 3), -- Strawberry Syrup: 3 units
(79, 18, 10, 1), -- Sugar: 1 unit
(80, 18, 24, 5), -- Ice: 5 units

-- Taro Slush (menuitemid=19)
(81, 19, 7, 3),  -- Taro Powder: 3 units
(82, 19, 8, 1),  -- Milk: 1 unit
(83, 19, 10, 1), -- Sugar: 1 unit
(84, 19, 24, 5), -- Ice: 5 units

-- Watermelon Slush (menuitemid=20)
(85, 20, 20, 3), -- Watermelon Syrup: 3 units
(86, 20, 10, 1), -- Sugar: 1 unit
(87, 20, 24, 5), -- Ice: 5 units

-- Passion Fruit Slush (menuitemid=21)
(88, 21, 17, 3), -- Passion Fruit Syrup: 3 units
(89, 21, 10, 1), -- Sugar: 1 unit
(90, 21, 24, 5), -- Ice: 5 units

-- Peach Slush (menuitemid=22)
(91, 22, 16, 3), -- Peach Syrup: 3 units
(92, 22, 10, 1), -- Sugar: 1 unit
(93, 22, 24, 5), -- Ice: 5 units

-- Vietnamese Coffee (menuitemid=23)
(94, 23, 23, 3), -- Coffee Beans: 3 units
(95, 23, 30, 1), -- Condensed Milk: 1 unit
(96, 23, 24, 2), -- Ice: 2 units

-- Coffee Milk Tea (menuitemid=24)
(97, 24, 23, 2), -- Coffee Beans: 2 units
(98, 24, 1, 1),  -- Black Tea: 1 unit
(99, 24, 8, 1),  -- Milk: 1 unit
(100, 24, 10, 1), -- Sugar: 1 unit
(101, 24, 24, 3), -- Ice: 3 units

-- Iced Americano (menuitemid=25)
(102, 25, 23, 3), -- Coffee Beans: 3 units
(103, 25, 24, 3), -- Ice: 3 units

-- Caramel Macchiato (menuitemid=26)
(104, 26, 23, 2), -- Coffee Beans: 2 units
(105, 26, 27, 2), -- Caramel Syrup: 2 units
(106, 26, 8, 1),  -- Milk: 1 unit
(107, 26, 24, 3), -- Ice: 3 units

-- Brown Sugar Boba Milk (menuitemid=27)
(108, 27, 12, 3), -- Brown Sugar: 3 units
(109, 27, 8, 2),  -- Milk: 2 units
(110, 27, 13, 2), -- Tapioca Pearls: 2 units
(111, 27, 24, 2), -- Ice: 2 units

-- Tiger Sugar Milk (menuitemid=28)
(112, 28, 12, 4), -- Brown Sugar: 4 units
(113, 28, 8, 2),  -- Milk: 2 units
(114, 28, 13, 2), -- Tapioca Pearls: 2 units
(115, 28, 24, 2), -- Ice: 2 units

-- Honey Lemon Aloe Vera (menuitemid=29)
(116, 29, 2, 1),  -- Green Tea: 1 unit
(117, 29, 11, 2), -- Honey: 2 units
(118, 29, 25, 2), -- Aloe Vera: 2 units
(119, 29, 24, 3), -- Ice: 3 units

-- Winter Melon Tea (menuitemid=30)
(120, 30, 2, 2),  -- Green Tea: 2 units
(121, 30, 26, 2), -- Winter Melon Syrup: 2 units
(122, 30, 10, 1), -- Sugar: 1 unit
(123, 30, 24, 3); -- Ice: 3 units

