-- Make Hassan and Sami admins using the proper admin function
SELECT public.update_user_role('42843d76-2269-4ec1-8323-315d86d4fa29', 'admin');
SELECT public.update_user_role('30e211f8-45f8-402d-abfa-bd5f685f9281', 'admin');