-- Update the minimum deposit constraint to allow 120 PKR
ALTER TABLE public.zcred_deposit_forms 
DROP CONSTRAINT IF EXISTS chk_min_deposit_pkr;

-- Add new constraint with minimum of 120 PKR
ALTER TABLE public.zcred_deposit_forms 
ADD CONSTRAINT chk_min_deposit_pkr 
CHECK (amount_pkr >= 120);