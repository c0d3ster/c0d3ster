-- First, remove duplicate users (keep the most recent one for each email)
-- Skip NULL emails since they don't need deduplication
DELETE FROM users 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY email
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM users
    WHERE email IS NOT NULL
  ) t 
  WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");