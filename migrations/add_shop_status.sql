-- Migration: Add Shop Status to Food Trucks
-- Run this in your Supabase SQL Editor

-- Step 1: Create the ShopStatus enum
CREATE TYPE "ShopStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- Step 2: Add shopStatus column to FoodTruck table with default value
ALTER TABLE "FoodTruck" 
ADD COLUMN "shopStatus" "ShopStatus" NOT NULL DEFAULT 'OPEN';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'FoodTruck' AND column_name = 'shopStatus';
