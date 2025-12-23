//! Audit Logging Service
//!
//! Provides audit logging functionality for tracking user actions.
//! Used for security monitoring, compliance, and debugging.

use sqlx::PgPool;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::net::IpAddr;

/// Audit action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditAction {
    // Authentication
    UserLogin,
    UserLogout,
    UserRegister,
    UserPasswordReset,
    TokenRefresh,
    
    // Team management
    TeamCreate,
    TeamUpdate,
    TeamDelete,
    TeamMemberAdd,
    TeamMemberRemove,
    TeamMemberRoleChange,
    
    // File operations
    FileUpload,
    FileDownload,
    FileDelete,
    FileShare,
    
    // Dashboard operations
    DashboardCreate,
    DashboardUpdate,
    DashboardDelete,
    DashboardShare,
    
    // Query operations
    QueryExecute,
    
    // Admin operations
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserDelete,
    AdminSettingsChange,
}

impl AuditAction {
    pub fn as_str(&self) -> &'static str {
        match self {
            AuditAction::UserLogin => "user.login",
            AuditAction::UserLogout => "user.logout",
            AuditAction::UserRegister => "user.register",
            AuditAction::UserPasswordReset => "user.password_reset",
            AuditAction::TokenRefresh => "user.token_refresh",
            
            AuditAction::TeamCreate => "team.create",
            AuditAction::TeamUpdate => "team.update",
            AuditAction::TeamDelete => "team.delete",
            AuditAction::TeamMemberAdd => "team.member_add",
            AuditAction::TeamMemberRemove => "team.member_remove",
            AuditAction::TeamMemberRoleChange => "team.member_role_change",
            
            AuditAction::FileUpload => "file.upload",
            AuditAction::FileDownload => "file.download",
            AuditAction::FileDelete => "file.delete",
            AuditAction::FileShare => "file.share",
            
            AuditAction::DashboardCreate => "dashboard.create",
            AuditAction::DashboardUpdate => "dashboard.update",
            AuditAction::DashboardDelete => "dashboard.delete",
            AuditAction::DashboardShare => "dashboard.share",
            
            AuditAction::QueryExecute => "query.execute",
            
            AuditAction::AdminUserCreate => "admin.user_create",
            AuditAction::AdminUserUpdate => "admin.user_update",
            AuditAction::AdminUserDelete => "admin.user_delete",
            AuditAction::AdminSettingsChange => "admin.settings_change",
        }
    }
}

/// Resource types for audit logging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResourceType {
    User,
    Team,
    File,
    Dashboard,
    Query,
    Settings,
}

impl ResourceType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ResourceType::User => "user",
            ResourceType::Team => "team",
            ResourceType::File => "file",
            ResourceType::Dashboard => "dashboard",
            ResourceType::Query => "query",
            ResourceType::Settings => "settings",
        }
    }
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub user_id: Option<Uuid>,
    pub team_id: Option<Uuid>,
    pub action: AuditAction,
    pub resource_type: Option<ResourceType>,
    pub resource_id: Option<Uuid>,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
}

/// Audit logging service
pub struct AuditService;

impl AuditService {
    /// Log an audit entry
    pub async fn log(pool: &PgPool, entry: AuditEntry) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO audit_log (user_id, team_id, action, resource_type, resource_id, details, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#
        )
        .bind(entry.user_id)
        .bind(entry.team_id)
        .bind(entry.action.as_str())
        .bind(entry.resource_type.map(|r| r.as_str()))
        .bind(entry.resource_id)
        .bind(entry.details)
        .bind(entry.ip_address.map(|ip| ip.to_string()))
        .bind(entry.user_agent)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Log a simple action (convenience method)
    pub async fn log_action(
        pool: &PgPool,
        user_id: Option<Uuid>,
        action: AuditAction,
    ) -> Result<(), sqlx::Error> {
        Self::log(pool, AuditEntry {
            user_id,
            team_id: None,
            action,
            resource_type: None,
            resource_id: None,
            details: None,
            ip_address: None,
            user_agent: None,
        }).await
    }

    /// Log action with resource
    pub async fn log_resource_action(
        pool: &PgPool,
        user_id: Option<Uuid>,
        team_id: Option<Uuid>,
        action: AuditAction,
        resource_type: ResourceType,
        resource_id: Uuid,
        details: Option<serde_json::Value>,
    ) -> Result<(), sqlx::Error> {
        Self::log(pool, AuditEntry {
            user_id,
            team_id,
            action,
            resource_type: Some(resource_type),
            resource_id: Some(resource_id),
            details,
            ip_address: None,
            user_agent: None,
        }).await
    }

    /// Query audit logs for a user
    pub async fn get_user_logs(
        pool: &PgPool,
        user_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AuditLogRecord>, sqlx::Error> {
        sqlx::query_as::<_, AuditLogRecord>(
            r#"
            SELECT id, user_id, team_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
            FROM audit_log
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
    }

    /// Query audit logs for a team
    pub async fn get_team_logs(
        pool: &PgPool,
        team_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AuditLogRecord>, sqlx::Error> {
        sqlx::query_as::<_, AuditLogRecord>(
            r#"
            SELECT id, user_id, team_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
            FROM audit_log
            WHERE team_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(team_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
    }
}

/// Audit log record from database
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLogRecord {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub team_id: Option<Uuid>,
    pub action: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<Uuid>,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_action_strings() {
        assert_eq!(AuditAction::UserLogin.as_str(), "user.login");
        assert_eq!(AuditAction::TeamCreate.as_str(), "team.create");
        assert_eq!(AuditAction::FileUpload.as_str(), "file.upload");
    }

    #[test]
    fn test_resource_type_strings() {
        assert_eq!(ResourceType::User.as_str(), "user");
        assert_eq!(ResourceType::Team.as_str(), "team");
        assert_eq!(ResourceType::File.as_str(), "file");
    }
}

