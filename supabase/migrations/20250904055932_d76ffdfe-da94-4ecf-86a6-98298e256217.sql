-- Add cover_url column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN cover_url text;

-- Create storage policies for tournament covers if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload tournament covers
CREATE POLICY "Tournament covers admin upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'covers' 
  AND is_admin(auth.uid())
);

-- Allow admins to update tournament covers
CREATE POLICY "Tournament covers admin update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'covers' 
  AND is_admin(auth.uid())
);

-- Allow admins to delete tournament covers
CREATE POLICY "Tournament covers admin delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'covers' 
  AND is_admin(auth.uid())
);

-- Allow public read access to tournament covers
CREATE POLICY "Tournament covers public read" ON storage.objects
FOR SELECT USING (bucket_id = 'covers');