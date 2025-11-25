-- Migration: Add toppings column to orderitems table
-- This column will store selected toppings as a comma-separated string
-- Example: "boba,lycheejelly,pudding"

ALTER TABLE orderitems 
ADD COLUMN IF NOT EXISTS toppings TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN orderitems.toppings IS 'Comma-separated list of topping IDs (e.g., "boba,lycheejelly,pudding")';
