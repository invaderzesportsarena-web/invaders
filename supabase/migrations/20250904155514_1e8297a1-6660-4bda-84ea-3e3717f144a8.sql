-- Temporarily drop the zcred_balances view to allow column type changes
DROP VIEW IF EXISTS public.zcred_balances;

-- Update Z-Credits system to support decimal values (up to 2 decimal places)

-- Update zcred_transactions table to use numeric instead of integer for amount
ALTER TABLE public.zcred_transactions 
ALTER COLUMN amount TYPE NUMERIC(10,2);

-- Update zcred_withdrawal_forms to use numeric for Z-Credits amount
ALTER TABLE public.zcred_withdrawal_forms 
ALTER COLUMN amount_zcreds TYPE NUMERIC(10,2);

-- Update tournaments entry fee to support decimals
ALTER TABLE public.tournaments 
ALTER COLUMN entry_fee_credits TYPE NUMERIC(10,2);

-- Update orders total to support decimals
ALTER TABLE public.orders 
ALTER COLUMN total_credits TYPE NUMERIC(10,2);

-- Update order_items price to support decimals
ALTER TABLE public.order_items 
ALTER COLUMN price_credits TYPE NUMERIC(10,2);

-- Update products price to support decimals
ALTER TABLE public.products 
ALTER COLUMN price_credits TYPE NUMERIC(10,2);

-- Recreate the zcred_balances view with decimal support
CREATE VIEW public.zcred_balances AS
SELECT 
  user_id,
  COALESCE(SUM(amount), 0) as balance
FROM public.zcred_transactions 
WHERE status = 'approved'
GROUP BY user_id;

-- Add check constraints to ensure amounts don't exceed 2 decimal places
ALTER TABLE public.zcred_transactions 
ADD CONSTRAINT check_amount_decimal_places 
CHECK (scale(amount) <= 2);

ALTER TABLE public.zcred_withdrawal_forms 
ADD CONSTRAINT check_zcreds_decimal_places 
CHECK (scale(amount_zcreds) <= 2);

ALTER TABLE public.tournaments 
ADD CONSTRAINT check_entry_fee_decimal_places 
CHECK (scale(entry_fee_credits) <= 2);