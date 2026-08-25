-- Backfill legacy account names and keep role values inside the server-owned
-- role set. This migration is deliberately additive and does not collect any
-- clinical or health information.

UPDATE "user"
SET first_name = trim(substr(name, 1, instr(trim(name) || ' ', ' ') - 1))
WHERE first_name IS NULL OR trim(first_name) = '';

UPDATE "user"
SET last_name = trim(substr(trim(name), instr(trim(name) || ' ', ' ') + 1))
WHERE last_name IS NULL OR trim(last_name) = '';

UPDATE "user"
SET first_name = 'User'
WHERE first_name IS NULL OR trim(first_name) = '';

UPDATE "user"
SET last_name = 'Account'
WHERE last_name IS NULL OR trim(last_name) = '';

UPDATE "user"
SET role = 'USER'
WHERE role IS NULL OR role NOT IN ('USER', 'THERAPIST', 'ADMIN');
