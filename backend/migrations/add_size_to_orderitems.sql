-- Add size column to orderitems table
-- This migration adds a size field to track drink sizes (Small, Medium, Large)

-- Add size column with default value 'Medium' for existing records
ALTER TABLE orderitems 
ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT 'Medium';

-- Add check constraint to ensure valid sizes
ALTER TABLE orderitems 
DROP CONSTRAINT IF EXISTS check_size_valid;

ALTER TABLE orderitems 
ADD CONSTRAINT check_size_valid 
CHECK (size IN ('Small', 'Medium', 'Large'));

-- Comment on the column
COMMENT ON COLUMN orderitems.size IS 'Size of the drink: Small, Medium, or Large';
