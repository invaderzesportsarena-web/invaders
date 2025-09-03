-- Update the current user to admin role
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  SELECT email 
  FROM auth.users 
  WHERE id = (
    SELECT id 
    FROM profiles 
    ORDER BY created_at DESC 
    LIMIT 1
  )
);

-- Create a temporary admin setup function for development
CREATE OR REPLACE FUNCTION public.setup_admin_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin'
  WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = user_email
  );
END;
$$;