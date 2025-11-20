-- Check what columns actually exist in balance_transactions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'balance_transactions'
ORDER BY ordinal_position;

