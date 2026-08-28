-- Migration: Create community memberships
-- Description: Adds tenant-scoped roles for users in communities.

CREATE TABLE IF NOT EXISTS community_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member'
      CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT community_memberships_community_user_key
      UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id
  ON community_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_community_memberships_community_id
  ON community_memberships(community_id);

DROP TRIGGER IF EXISTS update_community_memberships_updated_at
  ON community_memberships;
CREATE TRIGGER update_community_memberships_updated_at
BEFORE UPDATE ON community_memberships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
