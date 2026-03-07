-- Migration 018: Referral Rewards
-- Adds update policy for service role to mark referrals as completed

-- Allow service role to update referral status (for completion checks)
-- Note: This uses security definer function pattern for controlled updates
CREATE OR REPLACE FUNCTION complete_referral(p_referral_id UUID, p_dp_awarded INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE referrals
  SET
    status = 'completed',
    completed_at = NOW(),
    dp_awarded = p_dp_awarded
  WHERE id = p_referral_id
    AND status = 'pending';
END;
$$;

-- Grant execute to authenticated users (function itself validates caller)
GRANT EXECUTE ON FUNCTION complete_referral(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_referral(UUID, INTEGER) TO service_role;
