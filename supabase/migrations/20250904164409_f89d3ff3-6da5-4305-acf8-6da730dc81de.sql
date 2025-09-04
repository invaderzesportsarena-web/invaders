-- Add missing columns to zcred_deposit_forms table for wallet request management
ALTER TABLE public.zcred_deposit_forms 
ADD COLUMN IF NOT EXISTS approved_credits numeric,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add missing columns to zcred_withdrawal_forms table for wallet request management  
ALTER TABLE public.zcred_withdrawal_forms
ADD COLUMN IF NOT EXISTS approved_credits numeric,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Ensure wallet_proofs storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('wallet_proofs', 'wallet_proofs', false, 5242880, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for wallet_proofs bucket
DO $$
BEGIN
  -- Policy for users to upload their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'wallet_proofs_upload_own'
  ) THEN
    EXECUTE 'CREATE POLICY wallet_proofs_upload_own ON storage.objects 
      FOR INSERT WITH CHECK (bucket_id = ''wallet_proofs'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  -- Policy for users to view their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'wallet_proofs_view_own'
  ) THEN
    EXECUTE 'CREATE POLICY wallet_proofs_view_own ON storage.objects 
      FOR SELECT USING (bucket_id = ''wallet_proofs'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  -- Policy for admins to view all files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'wallet_proofs_admin_view'
  ) THEN
    EXECUTE 'CREATE POLICY wallet_proofs_admin_view ON storage.objects 
      FOR SELECT USING (bucket_id = ''wallet_proofs'' AND is_admin(auth.uid()))';
  END IF;
END $$;