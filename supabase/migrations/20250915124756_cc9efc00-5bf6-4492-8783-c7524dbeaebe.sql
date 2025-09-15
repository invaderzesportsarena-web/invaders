-- Update the process_approved_deposit function to handle verified deposits
CREATE OR REPLACE FUNCTION public.process_verified_deposit(deposit_id uuid)
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
    WHERE id = deposit_id AND status = 'verified';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit not found or not verified';
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
        RAISE EXCEPTION 'Invalid credit amount: %', v_credits_to_add;
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
    
    -- Handle case where user doesn't have a wallet yet
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;
    
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

-- Create a function to process all pending verified deposits
CREATE OR REPLACE FUNCTION public.process_all_pending_deposits()
RETURNS json[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deposit_record RECORD;
    v_results json[] := '{}';
    v_result json;
BEGIN
    -- Only admins can run this
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can process deposits';
    END IF;
    
    -- Process all verified deposits that haven't been credited yet
    FOR v_deposit_record IN
        SELECT df.id 
        FROM zcred_deposit_forms df 
        WHERE df.status = 'verified' 
        AND df.approved_credits IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM zcred_transactions t 
            WHERE t.reference = df.id::text 
            AND t.reason = 'deposit_credit'
        )
        ORDER BY df.created_at ASC
    LOOP
        BEGIN
            SELECT process_verified_deposit(v_deposit_record.id) INTO v_result;
            v_results := v_results || v_result;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but continue with other deposits
                v_result := json_build_object(
                    'deposit_id', v_deposit_record.id,
                    'error', SQLERRM
                );
                v_results := v_results || v_result;
        END;
    END LOOP;
    
    RETURN v_results;
END;
$$;