-- Update banking account details in the database
UPDATE public.admin_account_details 
SET 
  account_number = '03492169543',
  account_title = 'Sultan',
  updated_at = NOW()
WHERE is_active = true;