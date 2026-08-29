-- Migration: Add operational bot fields
-- Description: Prepares bots for a future runtime without storing provider
-- credentials. Multiple bots may share a channel; each bot has one channel.

ALTER TABLE bots
  ADD COLUMN IF NOT EXISTS channel_id UUID
    REFERENCES channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS command_prefix TEXT NOT NULL DEFAULT '!',
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE bots DROP CONSTRAINT IF EXISTS bots_status_check;

UPDATE bots
SET status = CASE status
  WHEN 'online' THEN 'running'
  WHEN 'offline' THEN 'stopped'
  WHEN 'error' THEN 'error'
  ELSE 'stopped'
END;

ALTER TABLE bots
  ADD CONSTRAINT bots_status_check
  CHECK (status IN ('draft', 'stopped', 'starting', 'running', 'stopping', 'error'));

ALTER TABLE bots
  ADD CONSTRAINT bots_config_object_check
  CHECK (jsonb_typeof(config) = 'object'),
  ADD CONSTRAINT bots_command_prefix_length_check
  CHECK (char_length(command_prefix) <= 20),
  ADD CONSTRAINT bots_description_length_check
  CHECK (char_length(description) <= 5000),
  ADD CONSTRAINT bots_last_error_length_check
  CHECK (last_error IS NULL OR char_length(last_error) <= 2000);

CREATE INDEX IF NOT EXISTS idx_bots_channel_id ON bots(channel_id);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
