-- Enable Row Level Security on zcred_balances table
ALTER TABLE public.zcred_balances ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own balance
CREATE POLICY "Users can view their own balance" 
ON public.zcred_balances 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for admins to read all balances  
CREATE POLICY "Admins can view all balances" 
ON public.zcred_balances 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create policy for admins to update balances
CREATE POLICY "Admins can update balances" 
ON public.zcred_balances 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create policy for admins to insert balances
CREATE POLICY "Admins can insert balances" 
ON public.zcred_balances 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Create policy for admins to delete balances (if needed)
CREATE POLICY "Admins can delete balances" 
ON public.zcred_balances 
FOR DELETE 
USING (is_admin(auth.uid()));