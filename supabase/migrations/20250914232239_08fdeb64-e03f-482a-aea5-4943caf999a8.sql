-- Remove the zcred_balances view as it creates security confusion
-- Applications should use zcred_wallets table directly which has proper RLS policies

DROP VIEW IF EXISTS public.zcred_balances;