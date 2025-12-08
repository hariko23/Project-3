-- Migration: Add drink customization columns to orderitems table
-- Adds ice level, sugar level, and hot option fields

-- Add ice level column (no, light, regular, extra)
ALTER TABLE orderitems 
ADD COLUMN IF NOT EXISTS ice_level VARCHAR(20) DEFAULT 'regular';

-- Add check constraint for ice levels
ALTER TABLE orderitems 
DROP CONSTRAINT IF EXISTS check_ice_level_valid;

ALTER TABLE orderitems 
ADD CONSTRAINT check_ice_level_valid 
CHECK (ice_level IN ('no', 'light', 'regular', 'extra'));

-- Add sugar level column (0, 25, 50, 75, 100)
ALTER TABLE orderitems 
ADD COLUMN IF NOT EXISTS sugar_level VARCHAR(10) DEFAULT '100';

-- Add check constraint for sugar levels
ALTER TABLE orderitems 
DROP CONSTRAINT IF EXISTS check_sugar_level_valid;

ALTER TABLE orderitems 
ADD CONSTRAINT check_sugar_level_valid 
CHECK (sugar_level IN ('0', '25', '50', '75', '100'));

-- Add hot option column (boolean)
ALTER TABLE orderitems 
ADD COLUMN IF NOT EXISTS is_hot BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN orderitems.ice_level IS 'Ice level: no, light, regular, extra';
COMMENT ON COLUMN orderitems.sugar_level IS 'Sugar percentage: 0, 25, 50, 75, 100';
COMMENT ON COLUMN orderitems.is_hot IS 'Whether the drink should be served hot';