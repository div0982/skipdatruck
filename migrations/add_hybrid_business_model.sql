-- Migration: Add HYBRID to BusinessModel enum
-- Run this in your Supabase SQL Editor

-- Add HYBRID value to existing BusinessModel enum
ALTER TYPE "BusinessModel" ADD VALUE 'HYBRID';

-- Verify the change
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM 
    pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE 
    t.typname = 'BusinessModel'
ORDER BY 
    e.enumsortorder;
