-- Fix the function to use correct transaction type enum
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
    -- Get the deposit record (use 'verified' status)
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
    
    -- Get credits to add (use approved_credits if set, otherwise amount_zc, otherwise amount_money)
    v_credits_to_add := COALESCE(
        v_deposit_record.approved_credits, 
        v_deposit_record.amount_zc, 
        v_deposit_record.amount_money
    );
    
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
    
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;
    
    v_new_balance := v_current_balance + v_credits_to_add;
    
    UPDATE zcred_wallets 
    SET balance = v_new_balance, 
        updated_at = NOW()
    WHERE user_id = v_deposit_record.user_id;
    
    -- Create transaction record (use correct enum type)
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
        'credit'::zt_type,
        v_credits_to_add,
        v_new_balance,
        'deposit_credit',
        deposit_id::text,
        COALESCE(v_deposit_record.reviewed_by, v_deposit_record.user_id),
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

-- Now credit the 3 verified deposits  
SELECT public.process_verified_deposit('1a335484-1481-479e-86a0-21fee055eedb'); -- Hassan's 250 Z-Credits
SELECT public.process_verified_deposit('412d07b9-69d1-4766-a2f0-9090f54071e0'); -- Sami's 200 Z-Credits  
SELECT public.process_verified_deposit('de8060fa-27e5-42d4-9391-df72113f9f3e'); -- GHDF's 200 Z-Credits