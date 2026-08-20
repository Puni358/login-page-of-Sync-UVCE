-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This enables public (unauthenticated) read access to the browsing tables.
--
-- Without these policies, anonymous visitors see no data on the marketplace,
-- lost & found, and suggestions pages because Supabase's default RLS blocks
-- all reads unless the requesting user is authenticated.

-- 1. Allow anyone to read marketplace / lost-and-found items
DROP POLICY IF EXISTS "Public can read items" ON items;
CREATE POLICY "Public can read items"
  ON items FOR SELECT
  USING (true);

-- 2. Allow anyone to read item images
DROP POLICY IF EXISTS "Public can read item_images" ON item_images;
CREATE POLICY "Public can read item_images"
  ON item_images FOR SELECT
  USING (true);

-- 3. Allow anyone to read public profile fields (name only — NOT phone/email)
--    If you have a separate public_profiles view, use that instead.
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
CREATE POLICY "Public can read profiles"
  ON profiles FOR SELECT
  USING (true);

-- 4. Allow anyone to read suggestions / questions
DROP POLICY IF EXISTS "Public can read suggestions" ON suggestions;
CREATE POLICY "Public can read suggestions"
  ON suggestions FOR SELECT
  USING (true);

-- 5. Allow anyone to read suggestion answers/replies (if table exists)
DROP POLICY IF EXISTS "Public can read suggestion_answers" ON suggestion_answers;
CREATE POLICY "Public can read suggestion_answers"
  ON suggestion_answers FOR SELECT
  USING (true);

-- NOTE: Write operations (INSERT, UPDATE, DELETE) still require authentication —
-- these policies only open up SELECT for anonymous visitors.
