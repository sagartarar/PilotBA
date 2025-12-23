use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// ============================================================================
// USER MODELS
// ============================================================================

/// User role enum for RBAC
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    ReadOnly,
}

impl Default for UserRole {
    fn default() -> Self {
        UserRole::User
    }
}

/// User entity stored in database
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub name: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Public user info (safe to return in API responses)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        UserInfo {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }
    }
}

/// Request body for user registration
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub name: String,
}

/// Request body for user login
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Request body for token refresh
#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Auth response with tokens
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub token_type: String,
    pub user: UserInfo,
}

// ============================================================================
// TEAM/WORKSPACE MODELS
// ============================================================================

/// Team role for team-level RBAC
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "team_role", rename_all = "lowercase")]
pub enum TeamRole {
    Owner,
    Admin,
    Member,
    Viewer,
}

impl Default for TeamRole {
    fn default() -> Self {
        TeamRole::Member
    }
}

/// Team/Workspace entity
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Team {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub settings: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Team member association
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TeamMember {
    pub id: Uuid,
    pub team_id: Uuid,
    pub user_id: Uuid,
    pub role: TeamRole,
    pub joined_at: DateTime<Utc>,
}

/// Team info response (safe for API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamInfo {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub role: TeamRole,
    pub member_count: i64,
}

/// Request to create a new team
#[derive(Debug, Deserialize)]
pub struct CreateTeamRequest {
    pub name: String,
    pub description: Option<String>,
}

/// Request to update team settings
#[derive(Debug, Deserialize)]
pub struct UpdateTeamRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

/// Request to invite a user to a team
#[derive(Debug, Deserialize)]
pub struct InviteUserRequest {
    pub email: String,
    pub role: TeamRole,
}

/// Request to update member role
#[derive(Debug, Deserialize)]
pub struct UpdateMemberRoleRequest {
    pub role: TeamRole,
}

/// Team member with user details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMemberInfo {
    pub id: Uuid,
    pub user_id: Uuid,
    pub email: String,
    pub name: String,
    pub role: TeamRole,
    pub joined_at: DateTime<Utc>,
}

// ============================================================================
// DASHBOARD MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dashboard {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub user_id: Uuid,
    pub team_id: Option<Uuid>,
    pub layout: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dataset {
    pub id: Uuid,
    pub name: String,
    pub source_type: String,
    pub connection_info: serde_json::Value,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryRequest {
    pub dataset_id: Uuid,
    pub query: String,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResponse {
    pub columns: Vec<String>,
    pub data: Vec<serde_json::Value>,
    pub row_count: usize,
    pub execution_time_ms: u128,
}


