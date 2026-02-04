/*
  # Create storage bucket for vehicle images

  1. Storage Setup
    - Creates 'images' bucket for vehicle photos
    - Sets up proper access policies
    - Allows public read access for images
    - Restricts upload/modify to authenticated users

  2. Security
    - RLS policies for proper access control
    - File size and type restrictions
*/

-- Create the images bucket with basic settings
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Update bucket settings if it exists
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'images';

-- Create policies for the images bucket (only if they don't exist)
DO $$ 
BEGIN
  -- Policy for authenticated users to upload images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload images'
  ) THEN
    CREATE POLICY "Authenticated users can upload images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'images');
  END IF;

  -- Policy for authenticated users to update images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update images'
  ) THEN
    CREATE POLICY "Authenticated users can update images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'images');
  END IF;

  -- Policy for authenticated users to delete images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete images'
  ) THEN
    CREATE POLICY "Authenticated users can delete images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'images');
  END IF;

  -- Policy for public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view images'
  ) THEN
    CREATE POLICY "Public can view images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'images');
  END IF;
END $$;