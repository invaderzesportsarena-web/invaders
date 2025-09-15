-- Fix the infinite recursion issue in user_roles RLS policies
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;

-- Create a simpler, non-recursive policy for admin access to user_roles
CREATE POLICY "user_roles_admin_select" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  -- Allow reading if user is the owner OR has admin role in profiles table
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "user_roles_admin_all_ops" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create a function to credit deposits that handles the full workflow
CREATE OR REPLACE FUNCTION public.process_approved_deposit(deposit_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deposit_record zcred_deposit_forms%ROWTYPE;
    v_credits_to_add numeric;
    v_current_balance numeric;
    v_new_balance numeric;
    v_transaction_id uuid;
    v_result json;
BEGIN
    -- Get the deposit record
    SELECT * INTO v_deposit_record
    FROM zcred_deposit_forms
    WHERE id = deposit_id AND status = 'approved';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit not found or not approved';
    END IF;
    
    -- Check if already credited (prevent double crediting)
    IF EXISTS (
        SELECT 1 FROM zcred_transactions 
        WHERE reason = 'deposit_credit' 
        AND reference = deposit_id::text
    ) THEN
        RAISE EXCEPTION 'Deposit already credited';
    END IF;
    
    -- Get credits to add (use approved_credits if set, otherwise amount_zc)
    v_credits_to_add := COALESCE(v_deposit_record.approved_credits, v_deposit_record.amount_zc);
    
    IF v_credits_to_add IS NULL OR v_credits_to_add <= 0 THEN
        RAISE EXCEPTION 'Invalid credit amount';
    END IF;
    
    -- Ensure user has a wallet
    INSERT INTO zcred_wallets (user_id, balance) 
    VALUES (v_deposit_record.user_id, 0) 
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Lock and update wallet
    SELECT balance INTO v_current_balance
    FROM zcred_wallets
    WHERE user_id = v_deposit_record.user_id
    FOR UPDATE;
    
    v_new_balance := v_current_balance + v_credits_to_add;
    
    UPDATE zcred_wallets 
    SET balance = v_new_balance, 
        updated_at = NOW()
    WHERE user_id = v_deposit_record.user_id;
    
    -- Create transaction record
    INSERT INTO zcred_transactions (
        user_id, 
        type, 
        amount, 
        balance_after, 
        reason, 
        reference, 
        reviewed_by, 
        reviewed_at,
        status
    ) VALUES (
        v_deposit_record.user_id,
        'deposit',
        v_credits_to_add,
        v_new_balance,
        'deposit_credit',
        deposit_id::text,
        v_deposit_record.reviewed_by,
        NOW(),
        'approved'
    ) RETURNING id INTO v_transaction_id;
    
    -- Return result
    v_result := json_build_object(
        'transaction_id', v_transaction_id,
        'user_id', v_deposit_record.user_id,
        'credits_added', v_credits_to_add,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'deposit_id', deposit_id
    );
    
    RETURN v_result;
END;
$$;