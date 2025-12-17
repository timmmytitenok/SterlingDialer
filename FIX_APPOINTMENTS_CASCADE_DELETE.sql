-- ============================================================================
-- FIX: Stop appointments from being deleted when leads are deleted
-- ============================================================================
-- 
-- PROBLEM: The appointments table has a foreign key on lead_id with 
-- ON DELETE CASCADE. This means when a lead is deleted (e.g., when
-- deleting a Google Sheet), all appointments linked to that lead are
-- also deleted - causing stats to disappear!
--
-- SOLUTION: Change the foreign key to ON DELETE SET NULL, so appointments
-- remain but just lose their lead association when leads are deleted.
-- ============================================================================

-- Step 1: Make lead_id nullable (if it isn't already)
ALTER TABLE appointments ALTER COLUMN lead_id DROP NOT NULL;

-- Step 2: Drop the existing foreign key constraint
-- First, find the constraint name
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the foreign key constraint on lead_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'appointments' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'lead_id';
    
    -- If found, drop it
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE appointments DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on appointments.lead_id';
    END IF;
END $$;

-- Step 3: Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE appointments 
ADD CONSTRAINT appointments_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES leads(id) 
ON DELETE SET NULL;

-- Verify the change
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'appointments' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- EXPECTED RESULT after running this:
-- constraint_name: appointments_lead_id_fkey
-- delete_rule: SET NULL
--
-- Now when leads are deleted:
-- - Appointments will remain in the database
-- - Their lead_id will become NULL
-- - Stats will persist!
-- ============================================================================

