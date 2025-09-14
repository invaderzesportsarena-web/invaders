-- Add missing amount_pkr column to zcred_withdrawal_forms table
ALTER TABLE public.zcred_withdrawal_forms 
ADD COLUMN IF NOT EXISTS amount_pkr NUMERIC;

-- Check if sync_withdrawal_amounts trigger exists and create/recreate it properly
DROP TRIGGER IF EXISTS sync_withdrawal_amounts_trigger ON public.zcred_withdrawal_forms;

CREATE TRIGGER sync_withdrawal_amounts_trigger
  BEFORE INSERT OR UPDATE ON public.zcred_withdrawal_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_withdrawal_amounts();