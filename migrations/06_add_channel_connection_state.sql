-- Migration: Add channel connection state
-- Description: Separates the future provider connection lifecycle from the
-- existing channel status field kept for backward compatibility.

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (connection_status IN (
      'configured',
      'pending',
      'connected',
      'disconnected',
      'error'
    ));

UPDATE channels
SET connection_status = CASE status
  WHEN 'connected' THEN 'connected'
  WHEN 'disconnected' THEN 'disconnected'
  WHEN 'pending' THEN 'pending'
END
WHERE connection_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_channels_connection_status
  ON channels(connection_status);
