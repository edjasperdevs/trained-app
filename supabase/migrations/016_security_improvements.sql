-- Migration 016: Security Improvements
-- Adds health data consent tracking and rate limiting tables

-- ─────────────────────────────────────────────────────────────────────────────
-- Health Data Consent Tracking (HIPAA/Privacy Compliance)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.health_data_consent (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    steps_authorized BOOLEAN DEFAULT false NOT NULL,
    consent_granted_at TIMESTAMPTZ,
    consent_revoked_at TIMESTAMPTZ,
    device_model TEXT,
    os_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.health_data_consent ENABLE ROW LEVEL SECURITY;

-- Users can only view/modify their own consent
CREATE POLICY "Users can view own health consent"
    ON public.health_data_consent FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health consent"
    ON public.health_data_consent FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health consent"
    ON public.health_data_consent FOR UPDATE
    USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Rate Limiting Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
    ON public.rate_limits (user_id, action, created_at DESC);

-- Enable RLS (only service role should access this)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No user policies - only service role can access
-- This prevents users from clearing their own rate limit records

-- ─────────────────────────────────────────────────────────────────────────────
-- Cleanup old rate limit entries (run periodically)
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE created_at < NOW() - INTERVAL '2 hours';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit Log for Sensitive Operations
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for querying by user and time
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time
    ON public.audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
    ON public.audit_log (action, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit entries
CREATE POLICY "Users can view own audit log"
    ON public.audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert (via Edge Functions)
-- No insert policy for regular users
