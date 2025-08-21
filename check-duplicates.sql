-- Check for duplicate emails
SELECT email, COUNT(*) as count, 
       array_agg(clerk_id) as clerk_ids,
       array_agg(first_name || ' ' || last_name) as names
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;
