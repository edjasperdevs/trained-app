-- RevenueCat subscription state sync
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.
  entitlements TEXT[] NOT NULL DEFAULT '{}',
  product_id TEXT, -- e.g., 'welltrained_premium_monthly'
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'PRODUCTION', -- SANDBOX or PRODUCTION
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: Users can read their own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage subscriptions (webhook handler uses service_role key)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Index for user lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Index for active subscription queries
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, is_active) WHERE is_active = true;

COMMENT ON TABLE subscriptions IS 'RevenueCat subscription events synced via webhook';
COMMENT ON COLUMN subscriptions.event_type IS 'RevenueCat event type: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, etc.';
COMMENT ON COLUMN subscriptions.is_active IS 'Computed from event_type: true for active states, false for expired/cancelled';
