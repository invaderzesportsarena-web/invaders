-- Clean up duplicate policies and create a single secure policy for admin_account_details

-- Remove the duplicate policy we just created
DROP POLICY IF EXISTS "acct_users_read_for_transactions" ON public.admin_account_details;

-- The acct_authenticated_read_active policy is sufficient for authenticated users
-- Let's verify our current policies are secure