-- Clean up test/admin bonus transactions from balance_transactions
-- This removes all manual credits that were counted as revenue

DELETE FROM balance_transactions 
WHERE transaction_type = 'credit' 
AND description LIKE '%Manual credit - Admin bonus%';

-- Verify the cleanup
SELECT COUNT(*) as remaining_transactions 
FROM balance_transactions;

-- Show what's left
SELECT transaction_type, amount, created_at, description 
FROM balance_transactions 
ORDER BY created_at DESC;

