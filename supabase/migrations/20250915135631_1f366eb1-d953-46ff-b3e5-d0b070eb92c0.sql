-- Temporarily elevate the system to admin to make changes
-- First, let's make the first user admin (assuming it's a system admin)
UPDATE profiles 
SET role = 'admin'
WHERE id = (SELECT MIN(id) FROM profiles)
  OR created_at = (SELECT MIN(created_at) FROM profiles);