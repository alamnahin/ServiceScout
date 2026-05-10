-- Atomic approval flow for provider withdrawals.
-- Ensures status update + wallet deduction happen in one transaction.

CREATE OR REPLACE FUNCTION public.approve_withdrawal_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_amount NUMERIC(10,2);
  v_status public.withdrawal_status;
  v_balance NUMERIC(10,2);
  v_new_balance NUMERIC(10,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT provider_id, amount, status
    INTO v_provider_id, v_amount, v_status
  FROM public.withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'request_not_pending';
  END IF;

  SELECT wallet_balance
    INTO v_balance
  FROM public.providers
  WHERE id = v_provider_id
  FOR UPDATE;

  IF v_balance < v_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  v_new_balance := v_balance - v_amount;

  UPDATE public.providers
  SET wallet_balance = v_new_balance
  WHERE id = v_provider_id;

  UPDATE public.withdrawal_requests
  SET status = 'approved', processed_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.wallet_transactions (provider_id, booking_id, type, amount, balance_after, description)
  VALUES (v_provider_id, NULL, 'withdrawal', v_amount, v_new_balance, 'Withdrawal approved by admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_withdrawal_request(UUID) TO authenticated;
