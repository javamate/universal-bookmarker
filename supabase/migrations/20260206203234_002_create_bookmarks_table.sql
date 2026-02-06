/*
  # Create Bookmarks Table

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `url` (text)
      - `content` (jsonb - description, summary, etc)
      - `categories` (text[])
      - `tags` (text[])
      - `privacy` (jsonb - encryption, visibility settings)
      - `metadata` (jsonb - word count, read time, etc)
      - `algolia_object_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on bookmarks table
    - Add policies for users to read/write/delete their own bookmarks
    - Add index on user_id for fast queries
*/

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  content jsonb DEFAULT '{"description": "", "summary": "", "wordCount": 0}'::jsonb,
  categories text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  privacy jsonb DEFAULT '{"isEncrypted": false, "isPublic": false}'::jsonb,
  metadata jsonb DEFAULT '{"wordCount": 0, "readTime": 0}'::jsonb,
  algolia_object_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_categories ON bookmarks USING GIN (categories);
