-- Migration to add PICKED_UP to OrderStatus enum
-- This script can be run directly on your Supabase/PostgreSQL database

-- Check if PICKED_UP already exists in the enum
DO $$
BEGIN
    -- Check if the enum value exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'OrderStatus' 
        AND e.enumlabel = 'PICKED_UP'
    ) THEN
        -- Add the new enum value
        ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP';
        RAISE NOTICE 'Added PICKED_UP to OrderStatus enum';
    ELSE
        RAISE NOTICE 'PICKED_UP already exists in OrderStatus enum';
    END IF;
END
$$;
