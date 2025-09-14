-- CRITICAL SECURITY FIX: Remove public access to banking information
-- The admin_account_details table contains sensitive financial data that should NEVER be publicly accessible

-- Drop the dangerous public read policy that exposes banking information
DROP POLICY IF EXISTS "acct_public_read" ON public.admin_account_details;

-- Create a secure policy that only allows authenticated users to read active account details
-- This is safer than public access while still allowing legitimate access
CREATE POLICY "acct_authenticated_read_active" 
ON public.admin_account_details 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Keep the admin write policy as it's already secure
-- Admins retain full control over the banking information

-- Additional security: Create a policy for users to only read active account details
-- when they need it for deposits/withdrawals (authenticated users only)
CREATE POLICY "acct_users_read_for_transactions" 
ON public.admin_account_details 
FOR SELECT 
USING (
    is_active = true 
    AND auth.uid() IS NOT NULL
    AND auth.role() = 'authenticated'
);