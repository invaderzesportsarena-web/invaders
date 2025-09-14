-- Fix security issue: Add RLS policies to zcred_balances table
-- This table contains sensitive financial data and needs proper protection

-- Enable RLS on zcred_balances table
ALTER TABLE public.zcred_balances ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own balance
CREATE POLICY "balances_read_own" 
ON public.zcred_balances 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policy to allow admins to read all balances
CREATE POLICY "balances_admin_read" 
ON public.zcred_balances 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create policy to allow users to insert their own balance record
CREATE POLICY "balances_insert_own" 
ON public.zcred_balances 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create policy to allow admins to update any balance
CREATE POLICY "balances_admin_update" 
ON public.zcred_balances 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create policy to allow admins to insert any balance record
CREATE POLICY "balances_admin_insert" 
ON public.zcred_balances 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Note: No DELETE policies as balance records should be preserved for audit purposes