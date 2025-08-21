-- First, remove duplicate users (keep the most recent one for each email)
DELETE FROM users 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM users
  ) t 
  WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");