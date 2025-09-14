-- Fix the security definer view issue by recreating the views as regular views
-- Drop and recreate the 'me' view without SECURITY DEFINER
DROP VIEW IF EXISTS public.me;
CREATE VIEW public.me AS 
SELECT id, email, created_at
FROM auth.users
WHERE id = auth.uid();

-- Drop and recreate the 'zcred_balances' view without SECURITY DEFINER  
DROP VIEW IF EXISTS public.zcred_balances;
CREATE VIEW public.zcred_balances AS
SELECT user_id, COALESCE(sum(amount), 0::numeric) AS balance
FROM zcred_transactions
WHERE status = 'approved'::zt_status
GROUP BY user_id;

-- Enable RLS on the views (this should be handled by the underlying tables)
-- The views will inherit RLS from their underlying tables

-- Also update the zcred_wallets table to have better RLS policies
DROP POLICY IF EXISTS "wallets_read_own" ON public.zcred_wallets;
CREATE POLICY "wallets_read_own" 
ON public.zcred_wallets 
FOR SELECT 
USING ((user_id = auth.uid()) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "wallets_admin_update" ON public.zcred_wallets;
CREATE POLICY "wallets_admin_update" 
ON public.zcred_wallets 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Allow users to insert their own wallet record (for initial creation)
CREATE POLICY "wallets_insert_own" 
ON public.zcred_wallets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());