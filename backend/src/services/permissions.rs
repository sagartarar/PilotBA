//! RBAC Permission System
//!
//! Provides fine-grained role-based access control for PilotBA.
//! Permissions can be assigned at system level or team level.

use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use std::collections::HashSet;

// ============================================================================
// PERMISSIONS
// ============================================================================

/// All available permissions in the system
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    // Dashboard permissions
    DashboardCreate,
    DashboardRead,
    DashboardUpdate,
    DashboardDelete,
    DashboardShare,
    
    // Dataset/File permissions
    DatasetUpload,
    DatasetRead,
    DatasetUpdate,
    DatasetDelete,
    DatasetShare,
    
    // Query permissions
    QueryCreate,
    QueryRead,
    QueryExecute,
    QueryDelete,
    
    // Chart permissions
    ChartCreate,
    ChartRead,
    ChartUpdate,
    ChartDelete,
    ChartExport,
    
    // Team permissions
    TeamManageMembers,
    TeamManageSettings,
    TeamManageRoles,
    TeamViewAuditLog,
    
    // Admin permissions
    AdminManageUsers,
    AdminManageTeams,
    AdminManageSystem,
    AdminViewAllAuditLogs,
}

impl Permission {
    /// Get string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            Permission::DashboardCreate => "dashboard:create",
            Permission::DashboardRead => "dashboard:read",
            Permission::DashboardUpdate => "dashboard:update",
            Permission::DashboardDelete => "dashboard:delete",
            Permission::DashboardShare => "dashboard:share",
            
            Permission::DatasetUpload => "dataset:upload",
            Permission::DatasetRead => "dataset:read",
            Permission::DatasetUpdate => "dataset:update",
            Permission::DatasetDelete => "dataset:delete",
            Permission::DatasetShare => "dataset:share",
            
            Permission::QueryCreate => "query:create",
            Permission::QueryRead => "query:read",
            Permission::QueryExecute => "query:execute",
            Permission::QueryDelete => "query:delete",
            
            Permission::ChartCreate => "chart:create",
            Permission::ChartRead => "chart:read",
            Permission::ChartUpdate => "chart:update",
            Permission::ChartDelete => "chart:delete",
            Permission::ChartExport => "chart:export",
            
            Permission::TeamManageMembers => "team:manage_members",
            Permission::TeamManageSettings => "team:manage_settings",
            Permission::TeamManageRoles => "team:manage_roles",
            Permission::TeamViewAuditLog => "team:view_audit_log",
            
            Permission::AdminManageUsers => "admin:manage_users",
            Permission::AdminManageTeams => "admin:manage_teams",
            Permission::AdminManageSystem => "admin:manage_system",
            Permission::AdminViewAllAuditLogs => "admin:view_all_audit_logs",
        }
    }

    /// Get all permissions
    pub fn all() -> Vec<Permission> {
        vec![
            Permission::DashboardCreate,
            Permission::DashboardRead,
            Permission::DashboardUpdate,
            Permission::DashboardDelete,
            Permission::DashboardShare,
            Permission::DatasetUpload,
            Permission::DatasetRead,
            Permission::DatasetUpdate,
            Permission::DatasetDelete,
            Permission::DatasetShare,
            Permission::QueryCreate,
            Permission::QueryRead,
            Permission::QueryExecute,
            Permission::QueryDelete,
            Permission::ChartCreate,
            Permission::ChartRead,
            Permission::ChartUpdate,
            Permission::ChartDelete,
            Permission::ChartExport,
            Permission::TeamManageMembers,
            Permission::TeamManageSettings,
            Permission::TeamManageRoles,
            Permission::TeamViewAuditLog,
            Permission::AdminManageUsers,
            Permission::AdminManageTeams,
            Permission::AdminManageSystem,
            Permission::AdminViewAllAuditLogs,
        ]
    }
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/// Predefined system roles with their permissions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SystemRole {
    /// Full system access - all permissions
    SuperAdmin,
    /// Can manage users and teams at system level
    Admin,
    /// Standard user - can create and manage own content
    User,
    /// View-only access
    ReadOnly,
}

impl SystemRole {
    /// Get permissions for this role
    pub fn permissions(&self) -> HashSet<Permission> {
        match self {
            SystemRole::SuperAdmin => Permission::all().into_iter().collect(),
            
            SystemRole::Admin => vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DashboardDelete,
                Permission::DashboardShare,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::DatasetUpdate,
                Permission::DatasetDelete,
                Permission::DatasetShare,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::QueryDelete,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartDelete,
                Permission::ChartExport,
                Permission::TeamManageMembers,
                Permission::TeamManageSettings,
                Permission::AdminManageUsers,
                Permission::AdminManageTeams,
            ].into_iter().collect(),
            
            SystemRole::User => vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DashboardDelete,
                Permission::DashboardShare,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::DatasetUpdate,
                Permission::DatasetDelete,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::QueryDelete,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartDelete,
                Permission::ChartExport,
            ].into_iter().collect(),
            
            SystemRole::ReadOnly => vec![
                Permission::DashboardRead,
                Permission::DatasetRead,
                Permission::QueryRead,
                Permission::ChartRead,
                Permission::ChartExport,
            ].into_iter().collect(),
        }
    }
}

/// Team-level roles with their permissions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TeamRoleType {
    /// Team owner - full control
    Owner,
    /// Team admin - can manage members and settings
    Admin,
    /// Regular member - can create and edit content
    Member,
    /// View-only access to team resources
    Viewer,
}

impl TeamRoleType {
    /// Get team permissions for this role
    pub fn team_permissions(&self) -> HashSet<Permission> {
        match self {
            TeamRoleType::Owner => vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DashboardDelete,
                Permission::DashboardShare,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::DatasetUpdate,
                Permission::DatasetDelete,
                Permission::DatasetShare,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::QueryDelete,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartDelete,
                Permission::ChartExport,
                Permission::TeamManageMembers,
                Permission::TeamManageSettings,
                Permission::TeamManageRoles,
                Permission::TeamViewAuditLog,
            ].into_iter().collect(),
            
            TeamRoleType::Admin => vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DashboardShare,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::DatasetUpdate,
                Permission::DatasetShare,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartExport,
                Permission::TeamManageMembers,
            ].into_iter().collect(),
            
            TeamRoleType::Member => vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartExport,
            ].into_iter().collect(),
            
            TeamRoleType::Viewer => vec![
                Permission::DashboardRead,
                Permission::DatasetRead,
                Permission::QueryRead,
                Permission::ChartRead,
                Permission::ChartExport,
            ].into_iter().collect(),
        }
    }
}

// ============================================================================
// PERMISSION SERVICE
// ============================================================================

/// Permission checking service
pub struct PermissionService;

impl PermissionService {
    /// Check if user has a specific permission at system level
    pub async fn has_permission(
        pool: &PgPool,
        user_id: Uuid,
        permission: Permission,
    ) -> Result<bool, sqlx::Error> {
        // Get user's system role
        let user: Option<(String,)> = sqlx::query_as(
            "SELECT role::text FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let user_role = match user {
            Some((role,)) => role,
            None => return Ok(false),
        };

        // Map database role to SystemRole
        let system_role = match user_role.as_str() {
            "admin" => SystemRole::Admin,
            "user" => SystemRole::User,
            "readonly" => SystemRole::ReadOnly,
            _ => SystemRole::User,
        };

        Ok(system_role.permissions().contains(&permission))
    }

    /// Check if user has a specific permission within a team
    pub async fn has_team_permission(
        pool: &PgPool,
        user_id: Uuid,
        team_id: Uuid,
        permission: Permission,
    ) -> Result<bool, sqlx::Error> {
        // First check system-level admin permissions
        if Self::has_permission(pool, user_id, Permission::AdminManageTeams).await? {
            return Ok(true);
        }

        // Get user's team role
        let team_member: Option<(String,)> = sqlx::query_as(
            "SELECT role::text FROM team_members WHERE team_id = $1 AND user_id = $2"
        )
        .bind(team_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let team_role = match team_member {
            Some((role,)) => role,
            None => return Ok(false), // Not a team member
        };

        // Map database role to TeamRoleType
        let role_type = match team_role.as_str() {
            "owner" => TeamRoleType::Owner,
            "admin" => TeamRoleType::Admin,
            "member" => TeamRoleType::Member,
            "viewer" => TeamRoleType::Viewer,
            _ => TeamRoleType::Viewer,
        };

        Ok(role_type.team_permissions().contains(&permission))
    }

    /// Get all permissions for a user at system level
    pub async fn get_user_permissions(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<HashSet<Permission>, sqlx::Error> {
        let user: Option<(String,)> = sqlx::query_as(
            "SELECT role::text FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let user_role = match user {
            Some((role,)) => role,
            None => return Ok(HashSet::new()),
        };

        let system_role = match user_role.as_str() {
            "admin" => SystemRole::Admin,
            "user" => SystemRole::User,
            "readonly" => SystemRole::ReadOnly,
            _ => SystemRole::User,
        };

        Ok(system_role.permissions())
    }

    /// Get all permissions for a user within a team
    pub async fn get_team_permissions(
        pool: &PgPool,
        user_id: Uuid,
        team_id: Uuid,
    ) -> Result<HashSet<Permission>, sqlx::Error> {
        let team_member: Option<(String,)> = sqlx::query_as(
            "SELECT role::text FROM team_members WHERE team_id = $1 AND user_id = $2"
        )
        .bind(team_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let team_role = match team_member {
            Some((role,)) => role,
            None => return Ok(HashSet::new()),
        };

        let role_type = match team_role.as_str() {
            "owner" => TeamRoleType::Owner,
            "admin" => TeamRoleType::Admin,
            "member" => TeamRoleType::Member,
            "viewer" => TeamRoleType::Viewer,
            _ => TeamRoleType::Viewer,
        };

        Ok(role_type.team_permissions())
    }

    /// Check if user can access a specific resource
    pub async fn can_access_resource(
        pool: &PgPool,
        user_id: Uuid,
        resource_type: &str,
        resource_id: Uuid,
        required_permission: Permission,
    ) -> Result<bool, sqlx::Error> {
        // Check if user owns the resource directly
        let owns = match resource_type {
            "file" => {
                let result: Option<(Uuid,)> = sqlx::query_as(
                    "SELECT id FROM files WHERE id = $1 AND user_id = $2"
                )
                .bind(resource_id)
                .bind(user_id)
                .fetch_optional(pool)
                .await?;
                result.is_some()
            },
            "dashboard" => {
                let result: Option<(Uuid,)> = sqlx::query_as(
                    "SELECT id FROM dashboards WHERE id = $1 AND user_id = $2"
                )
                .bind(resource_id)
                .bind(user_id)
                .fetch_optional(pool)
                .await?;
                result.is_some()
            },
            _ => false,
        };

        if owns {
            return Ok(true);
        }

        // Check if resource belongs to a team user has access to
        let team_id: Option<(Uuid,)> = match resource_type {
            "file" => {
                sqlx::query_as(
                    "SELECT team_id FROM files WHERE id = $1 AND team_id IS NOT NULL"
                )
                .bind(resource_id)
                .fetch_optional(pool)
                .await?
            },
            "dashboard" => {
                sqlx::query_as(
                    "SELECT team_id FROM dashboards WHERE id = $1 AND team_id IS NOT NULL"
                )
                .bind(resource_id)
                .fetch_optional(pool)
                .await?
            },
            _ => None,
        };

        if let Some((team_id,)) = team_id {
            return Self::has_team_permission(pool, user_id, team_id, required_permission).await;
        }

        // Check system-level permissions
        Self::has_permission(pool, user_id, required_permission).await
    }
}

// ============================================================================
// PERMISSION RESPONSE TYPES
// ============================================================================

/// Permission info for API responses
#[derive(Debug, Clone, Serialize)]
pub struct PermissionInfo {
    pub permission: String,
    pub granted: bool,
}

/// User permissions summary for API responses
#[derive(Debug, Clone, Serialize)]
pub struct UserPermissionsSummary {
    pub user_id: Uuid,
    pub system_permissions: Vec<String>,
    pub team_permissions: Vec<TeamPermissionInfo>,
}

/// Team permissions info
#[derive(Debug, Clone, Serialize)]
pub struct TeamPermissionInfo {
    pub team_id: Uuid,
    pub team_name: String,
    pub role: String,
    pub permissions: Vec<String>,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_strings() {
        assert_eq!(Permission::DashboardCreate.as_str(), "dashboard:create");
        assert_eq!(Permission::AdminManageUsers.as_str(), "admin:manage_users");
    }

    #[test]
    fn test_system_role_permissions() {
        let admin_perms = SystemRole::Admin.permissions();
        assert!(admin_perms.contains(&Permission::DashboardCreate));
        assert!(admin_perms.contains(&Permission::AdminManageUsers));
        assert!(!admin_perms.contains(&Permission::AdminManageSystem));

        let readonly_perms = SystemRole::ReadOnly.permissions();
        assert!(readonly_perms.contains(&Permission::DashboardRead));
        assert!(!readonly_perms.contains(&Permission::DashboardCreate));
    }

    #[test]
    fn test_team_role_permissions() {
        let owner_perms = TeamRoleType::Owner.team_permissions();
        assert!(owner_perms.contains(&Permission::TeamManageMembers));
        assert!(owner_perms.contains(&Permission::TeamManageRoles));

        let viewer_perms = TeamRoleType::Viewer.team_permissions();
        assert!(viewer_perms.contains(&Permission::DashboardRead));
        assert!(!viewer_perms.contains(&Permission::DashboardCreate));
    }

    #[test]
    fn test_super_admin_has_all_permissions() {
        let perms = SystemRole::SuperAdmin.permissions();
        assert_eq!(perms.len(), Permission::all().len());
    }
}

