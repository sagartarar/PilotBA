-- Migration: Create Audit Log
-- Phase 3: User Management - Audit Logging

-- Audit log table for tracking all user actions
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_team ON audit_log(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_team_created ON audit_log(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at DESC);

-- Comments
COMMENT ON TABLE audit_log IS 'Stores all user actions for security auditing and compliance';
COMMENT ON COLUMN audit_log.action IS 'Action type: user.login, team.create, file.upload, etc.';
COMMENT ON COLUMN audit_log.resource_type IS 'Type of resource affected: user, team, file, dashboard, etc.';
COMMENT ON COLUMN audit_log.details IS 'JSON object with additional action-specific details';

-- Common audit actions:
-- Authentication: user.login, user.logout, user.register, user.password_reset
-- Team: team.create, team.update, team.delete, team.member_add, team.member_remove
-- File: file.upload, file.download, file.delete
-- Dashboard: dashboard.create, dashboard.update, dashboard.delete, dashboard.share

