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

-- Update zcred_balances view to handle the new decimal format
-- (Note: zcred_wallets already uses numeric, so the view will automatically support decimals)

-- Add a check constraint to ensure amounts don't exceed 2 decimal places on critical tables
ALTER TABLE public.zcred_transactions 
ADD CONSTRAINT check_amount_decimal_places 
CHECK (scale(amount) <= 2);

ALTER TABLE public.zcred_withdrawal_forms 
ADD CONSTRAINT check_zcreds_decimal_places 
CHECK (scale(amount_zcreds) <= 2);

ALTER TABLE public.tournaments 
ADD CONSTRAINT check_entry_fee_decimal_places 
CHECK (scale(entry_fee_credits) <= 2);

-- Update the admin_adjust_wallet function to handle decimals
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_user_id uuid, p_delta numeric(10,2), p_reason text DEFAULT 'admin_adjust'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admins only';
  end if;

  insert into public.zcred_wallets(user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.zcred_wallets
     set balance = balance + p_delta,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.zcred_transactions(user_id, amount, reason)
  values (p_user_id, p_delta, p_reason);
end;
$function$

-- Update the register_for_tournament function to handle decimal entry fees
CREATE OR REPLACE FUNCTION public.register_for_tournament(p_tournament_id uuid, p_team_name text, p_entry_fee numeric(10,2))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_balance numeric;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Profile completion guard (username, ign, whatsapp required)
  if exists (
    select 1 from public.profiles
    where id = v_uid
      and (coalesce(username,'') = '' or coalesce(in_game_name,'') = '' or coalesce(whatsapp,'') = '')
  ) then
    raise exception 'Complete your profile (username, in-game name, WhatsApp) before registering.';
  end if;

  -- Lock wallet row and check balance
  insert into public.zcred_wallets(user_id, balance)
  values (v_uid, 0)
  on conflict (user_id) do nothing;

  select balance into v_balance
  from public.zcred_wallets
  where user_id = v_uid
  for update;

  if v_balance < p_entry_fee then
    raise exception 'Insufficient Z-Creds. Needed %, available %', p_entry_fee, v_balance;
  end if;

  -- Deduct
  update public.zcred_wallets
     set balance = balance - p_entry_fee,
         updated_at = now()
   where user_id = v_uid;

  -- Ledger
  insert into public.zcred_transactions(user_id, amount, reason, ref_id)
  values (v_uid, -p_entry_fee, 'tournament_entry', p_tournament_id);

  -- Registration
  insert into public.registrations(tournament_id, user_id, team_name)
  values (p_tournament_id, v_uid, p_team_name);
end;
$function$