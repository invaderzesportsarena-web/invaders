-- Enable Row Level Security on zcred_balances
ALTER TABLE public.zcred_balances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read only their own balance
CREATE POLICY "balance read own" 
ON public.zcred_balances 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy: Admins can read all balances 
CREATE POLICY "balance admin read all" 
ON public.zcred_balances 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Policy: Admins can update balances (for manual adjustments if needed)
CREATE POLICY "balance admin update" 
ON public.zcred_balances 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Policy: Admins can insert new balance records
CREATE POLICY "balance admin insert" 
ON public.zcred_balances 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));