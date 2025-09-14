-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view wallet proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own wallet proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all wallet proofs" ON storage.objects;

-- Ensure wallet_proofs bucket exists and is properly configured
DELETE FROM storage.buckets WHERE id = 'wallet_proofs';
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallet_proofs', 'wallet_proofs', true);

-- Create simple RLS policies for the public bucket
CREATE POLICY "Anyone can view wallet proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wallet_proofs');

CREATE POLICY "Authenticated users can upload wallet proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'wallet_proofs' AND auth.role() = 'authenticated');