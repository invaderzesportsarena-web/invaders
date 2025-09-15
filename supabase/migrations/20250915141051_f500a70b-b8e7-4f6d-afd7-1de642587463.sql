-- Create function to process withdrawal submission with immediate deduction
CREATE OR REPLACE FUNCTION public.process_withdrawal_submission(
  p_user_id uuid,
  p_amount_zcreds numeric,
  p_recipient_name text,
  p_recipient_bank text,
  p_recipient_account_no text,
  p_iban_optional text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_withdrawal_id uuid;
  v_transaction_id uuid;
BEGIN
  -- Validate inputs
  IF p_amount_zcreds <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;
  
  IF p_amount_zcreds < 150 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is 150 Z-Credits';
  END IF;
  
  -- Ensure user has a wallet
  INSERT INTO zcred_wallets (user_id, balance) 
  VALUES (p_user_id, 0) 
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Lock and get current balance
  SELECT balance INTO v_current_balance
  FROM zcred_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount_zcreds THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', v_current_balance, p_amount_zcreds;
  END IF;
  
  -- Calculate new balance after deduction
  v_new_balance := v_current_balance - p_amount_zcreds;
  
  -- Update wallet balance (deduct immediately)
  UPDATE zcred_wallets 
  SET balance = v_new_balance, 
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create withdrawal request
  INSERT INTO zcred_withdrawal_forms (
    user_id,
    amount_zcreds,
    recipient_name,
    recipient_bank,
    recipient_account_no,
    iban_optional,
    notes,
    status
  ) VALUES (
    p_user_id,
    p_amount_zcreds,
    p_recipient_name,
    p_recipient_bank,
    p_recipient_account_no,
    p_iban_optional,
    p_notes,
    'submitted'
  ) RETURNING id INTO v_withdrawal_id;
  
  -- Create transaction record for the deduction
  INSERT INTO zcred_transactions (
    user_id,
    type,
    amount,
    balance_after,
    reason,
    reference,
    status
  ) VALUES (
    p_user_id,
    'withdrawal_hold',
    -p_amount_zcreds,
    v_new_balance,
    'withdrawal_hold',
    v_withdrawal_id::text,
    'approved'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_withdrawal_id;
END;
$function$;

-- Create function to handle withdrawal rejection (restore balance)
CREATE OR REPLACE FUNCTION public.process_withdrawal_rejection(
  p_withdrawal_id uuid,
  p_rejection_reason text,
  p_admin_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_withdrawal_record zcred_withdrawal_forms%ROWTYPE;
  v_current_balance numeric;
  v_new_balance numeric;
  v_transaction_id uuid;
  v_result json;
BEGIN
  -- Check if user performing this action is admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can reject withdrawals';
  END IF;
  
  -- Get the withdrawal record
  SELECT * INTO v_withdrawal_record
  FROM zcred_withdrawal_forms
  WHERE id = p_withdrawal_id AND status = 'submitted';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;
  
  -- Update withdrawal status to rejected
  UPDATE zcred_withdrawal_forms 
  SET status = 'rejected',
      rejection_reason = p_rejection_reason,
      reviewed_by = p_admin_id,
      reviewed_at = NOW()
  WHERE id = p_withdrawal_id;
  
  -- Lock and get current balance
  SELECT balance INTO v_current_balance
  FROM zcred_wallets
  WHERE user_id = v_withdrawal_record.user_id
  FOR UPDATE;
  
  -- Calculate new balance after restoring the amount
  v_new_balance := v_current_balance + v_withdrawal_record.amount_zcreds;
  
  -- Update wallet balance (restore the amount)
  UPDATE zcred_wallets 
  SET balance = v_new_balance, 
      updated_at = NOW()
  WHERE user_id = v_withdrawal_record.user_id;
  
  -- Create transaction record for the restoration
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
    v_withdrawal_record.user_id,
    'withdrawal_refund',
    v_withdrawal_record.amount_zcreds,
    v_new_balance,
    'withdrawal_rejected',
    p_withdrawal_id::text,
    p_admin_id,
    NOW(),
    'approved'
  ) RETURNING id INTO v_transaction_id;
  
  -- Return result
  v_result := json_build_object(
    'transaction_id', v_transaction_id,
    'user_id', v_withdrawal_record.user_id,
    'refunded_amount', v_withdrawal_record.amount_zcreds,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'withdrawal_id', p_withdrawal_id
  );
  
  RETURN v_result;
END;
$function$;