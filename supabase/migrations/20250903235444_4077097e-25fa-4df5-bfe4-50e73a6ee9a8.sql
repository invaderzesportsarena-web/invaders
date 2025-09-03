-- Add slots and registration start timing to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN slots integer DEFAULT NULL,
ADD COLUMN reg_starts_at timestamp with time zone DEFAULT NULL;