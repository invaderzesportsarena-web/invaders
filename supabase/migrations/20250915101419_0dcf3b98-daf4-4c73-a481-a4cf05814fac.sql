-- Fix the handle_new_user function to remove team_name reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id, 
    split_part(new.email,'@',1), 
    split_part(new.email,'@',1), 
    'player'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;