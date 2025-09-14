-- Remove the security-problematic 'me' view that exposes auth.users
DROP VIEW IF EXISTS public.me;

-- Fix the zcred_balances view by dropping and recreating it properly
DROP VIEW IF EXISTS public.zcred_balances;
CREATE VIEW public.zcred_balances AS
SELECT w.user_id, w.balance
FROM zcred_wallets w;

-- Ensure profiles table has all necessary RLS policies
DROP POLICY IF EXISTS "profiles read self or admin" ON public.profiles;
CREATE POLICY "profiles_read_self_or_admin" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() = id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (this should happen via trigger)
CREATE POLICY "profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);