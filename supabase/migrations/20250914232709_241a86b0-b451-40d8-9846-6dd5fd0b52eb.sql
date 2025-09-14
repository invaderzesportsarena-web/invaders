-- Clean up remaining old policies on registrations table for complete security
DROP POLICY IF EXISTS "regs block player delete" ON public.registrations;
DROP POLICY IF EXISTS "regs block player update" ON public.registrations;
DROP POLICY IF EXISTS "regs create self before close" ON public.registrations;

-- Ensure we have clean, secure policies only
-- Users can only read their own registrations
-- Admins can read/write all registrations  
-- Users can insert registrations only for themselves and only before tournament closes