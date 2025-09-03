-- Update the latest registered user to admin role
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM profiles 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Create a development helper function to make any user admin
CREATE OR REPLACE FUNCTION public.make_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin'
  WHERE id = target_user_id;
END;
$$;