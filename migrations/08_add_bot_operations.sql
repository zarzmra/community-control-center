-- Migration: Add durable bot operations
-- Description: Separates desired intent from observed status and stores a durable
-- operation history for future runtime execution without implementing workers yet.

ALTER TABLE bots
  ADD COLUMN IF NOT EXISTS desired_status TEXT NOT NULL DEFAULT 'stopped'
    CHECK (desired_status IN ('stopped', 'running'));

UPDATE bots
SET desired_status = CASE
  WHEN status IN ('running', 'starting', 'stopping') THEN 'running'
  ELSE 'stopped'
END
WHERE desired_status IS NULL OR desired_status NOT IN ('stopped', 'running');

CREATE TABLE IF NOT EXISTS bot_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('start', 'stop', 'restart')),
  phase TEXT NOT NULL DEFAULT 'none' CHECK (phase IN ('none', 'starting', 'stopping')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'claimed', 'running', 'completed', 'failed', 'cancelled', 'expired')
  ),
  requested_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_by TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error TEXT,
  correlation_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_bot_operations_active_per_bot
  ON bot_operations (bot_id)
  WHERE status IN ('pending', 'claimed', 'running');

CREATE INDEX IF NOT EXISTS idx_bot_operations_bot_status
  ON bot_operations (bot_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_operations_community_status
  ON bot_operations (community_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_operations_correlation_id
  ON bot_operations (correlation_id);
