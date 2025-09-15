-- Fix register_for_tournament function to use correct enum value for zt_type
CREATE OR REPLACE FUNCTION public.register_for_tournament(p_tournament_id uuid, p_team_name text, p_entry_fee numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_balance numeric;
  v_registration_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Profile completion guard (username, in_game_name, whatsapp required)
  if exists (
    select 1 from public.profiles
    where id = v_uid
      and (coalesce(username,'') = '' or coalesce(in_game_name,'') = '' or (coalesce(whatsapp,'') = '' AND coalesce(whatsapp_number,'') = ''))
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

  -- Deduct from wallet
  update public.zcred_wallets
     set balance = balance - p_entry_fee,
         updated_at = now()
   where user_id = v_uid;

  -- Get updated balance for transaction record
  select balance into v_balance
  from public.zcred_wallets
  where user_id = v_uid;

  -- Create transaction record using 'adjust' type (valid enum value)
  insert into public.zcred_transactions(user_id, type, amount, reason, reference, status, balance_after)
  values (v_uid, 'adjust', -p_entry_fee, 'tournament_entry', p_tournament_id::text, 'approved', v_balance);

  -- Registration with AUTO-APPROVAL since payment was successful
  insert into public.registrations(tournament_id, captain_id, team_name, status)
  values (p_tournament_id, v_uid, p_team_name, 'approved')
  returning id into v_registration_id;
  
end;
$function$