-- ============================================================================
-- STEP 1: FIND ALL grant_free_access FUNCTIONS
-- ============================================================================
-- Run this to see what versions exist

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'grant_free_access'
ORDER BY schema_name, function_name;

-- ============================================================================
-- STEP 2: NUCLEAR OPTION - DROP ALL FUNCTIONS IN PUBLIC SCHEMA
-- ============================================================================
-- Uncomment and run this to drop ALL matching functions

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT n.nspname as schema_name,
               p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname IN (
            'grant_free_access',
            'start_free_trial',
            'extend_trial',
            'expire_free_trials',
            'calculate_trial_days_remaining',
            'extend_referrer_trial_on_completion',
            'add_to_balance'
        )
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
            r.schema_name, r.function_name, r.args);
        RAISE NOTICE 'Dropped function: %.%(%)', r.schema_name, r.function_name, r.args;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: VERIFY ALL GONE
-- ============================================================================

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
    'grant_free_access',
    'start_free_trial',
    'extend_trial',
    'expire_free_trials',
    'calculate_trial_days_remaining',
    'extend_referrer_trial_on_completion',
    'add_to_balance'
)
ORDER BY schema_name, function_name;

-- Should return 0 rows if successful

