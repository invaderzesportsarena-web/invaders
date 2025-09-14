-- Ensure wallet_proofs bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallet_proofs', 'wallet_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for wallet_proofs bucket if they don't exist
CREATE POLICY "Authenticated users can view wallet proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wallet_proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload their own wallet proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'wallet_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all wallet proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wallet_proofs' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'admin'
));