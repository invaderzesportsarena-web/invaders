-- Update profiles table to work with existing schema and add trigger for auto-creation
-- First, update the existing trigger function to use existing profile fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger for automatic profile creation on user signup (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END
$$;