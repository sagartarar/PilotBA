//! Teams/Workspaces Routes
//!
//! Provides CRUD operations for teams and team membership management.
//! Users can create teams, invite members, and manage roles.

use actix_web::{web, HttpRequest, HttpResponse};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::{ApiError, ApiResult};
use crate::middleware::auth::get_claims;
use crate::models::{
    CreateTeamRequest, InviteUserRequest, Team, TeamInfo, TeamMember, TeamMemberInfo,
    TeamRole, UpdateMemberRoleRequest, UpdateTeamRequest, User,
};

/// Configure teams routes
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/teams")
            .route("", web::post().to(create_team))
            .route("", web::get().to(list_teams))
            .route("/{id}", web::get().to(get_team))
            .route("/{id}", web::put().to(update_team))
            .route("/{id}", web::delete().to(delete_team))
            .route("/{id}/members", web::get().to(list_members))
            .route("/{id}/members", web::post().to(add_member))
            .route("/{id}/members/{user_id}", web::put().to(update_member_role))
            .route("/{id}/members/{user_id}", web::delete().to(remove_member))
            .route("/{id}/leave", web::post().to(leave_team)),
    );
}

// ============================================================================
// TEAM CRUD OPERATIONS
// ============================================================================

/// Create a new team
///
/// POST /api/teams
async fn create_team(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<CreateTeamRequest>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    // Validate input
    if body.name.is_empty() || body.name.len() > 255 {
        return Err(ApiError::bad_request("Team name must be 1-255 characters"));
    }

    // Generate slug from name
    let slug = generate_slug(&body.name);

    // Check if slug already exists
    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM teams WHERE slug = $1"
    )
    .bind(&slug)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    if existing.is_some() {
        return Err(ApiError::bad_request("A team with this name already exists"));
    }

    // Create team
    let team: Team = sqlx::query_as(
        r#"
        INSERT INTO teams (name, slug, description, owner_id, settings)
        VALUES ($1, $2, $3, $4, '{}')
        RETURNING *
        "#
    )
    .bind(&body.name)
    .bind(&slug)
    .bind(&body.description)
    .bind(&user_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Failed to create team: {}", e)))?;

    // Add owner as team member with owner role
    sqlx::query(
        r#"
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, 'owner')
        "#
    )
    .bind(&team.id)
    .bind(&user_id)
    .execute(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Failed to add team member: {}", e)))?;

    Ok(HttpResponse::Created().json(TeamInfo {
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        role: TeamRole::Owner,
        member_count: 1,
    }))
}

/// List teams the user belongs to
///
/// GET /api/teams
async fn list_teams(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    // Get all teams user is a member of
    let teams: Vec<TeamInfo> = sqlx::query_as::<_, (Uuid, String, String, Option<String>, TeamRole, i64)>(
        r#"
        SELECT t.id, t.name, t.slug, t.description, tm.role,
               (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = $1
        ORDER BY t.name
        "#
    )
    .bind(&user_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?
    .into_iter()
    .map(|(id, name, slug, description, role, member_count)| TeamInfo {
        id, name, slug, description, role, member_count,
    })
    .collect();

    Ok(HttpResponse::Ok().json(teams))
}

/// Get team details
///
/// GET /api/teams/{id}
async fn get_team(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let team_id = path.into_inner();

    // Verify user is a member of the team
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let membership = match membership {
        Some(m) => m,
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Get team details
    let team: Option<Team> = sqlx::query_as(
        "SELECT * FROM teams WHERE id = $1"
    )
    .bind(&team_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let team = match team {
        Some(t) => t,
        None => return Err(ApiError::not_found("Team not found")),
    };

    // Get member count
    let (member_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM team_members WHERE team_id = $1"
    )
    .bind(&team_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    Ok(HttpResponse::Ok().json(TeamInfo {
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        role: membership.role,
        member_count,
    }))
}

/// Update team details
///
/// PUT /api/teams/{id}
async fn update_team(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateTeamRequest>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let team_id = path.into_inner();

    // Verify user has admin or owner role
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let membership = match membership {
        Some(m) if m.role == TeamRole::Owner || m.role == TeamRole::Admin => m,
        Some(_) => return Err(ApiError::forbidden("Only team owners and admins can update team settings")),
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Build update query dynamically
    let mut updates = Vec::new();
    let mut param_count = 1;

    if body.name.is_some() {
        updates.push(format!("name = ${}", param_count));
        param_count += 1;
    }
    if body.description.is_some() {
        updates.push(format!("description = ${}", param_count));
    }

    if updates.is_empty() {
        return Err(ApiError::bad_request("No fields to update"));
    }

    // Update team
    let query = format!(
        "UPDATE teams SET {} WHERE id = ${}",
        updates.join(", "),
        param_count + 1
    );

    let mut q = sqlx::query(&query);
    if let Some(ref name) = body.name {
        q = q.bind(name);
    }
    if let Some(ref description) = body.description {
        q = q.bind(description);
    }
    q = q.bind(&team_id);

    q.execute(pool.get_ref())
        .await
        .map_err(|e| ApiError::internal(format!("Failed to update team: {}", e)))?;

    // Return updated team info
    get_team(req, pool, web::Path::from(team_id)).await
}

/// Delete team
///
/// DELETE /api/teams/{id}
async fn delete_team(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let team_id = path.into_inner();

    // Verify user is the owner
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match membership {
        Some(m) if m.role == TeamRole::Owner => {},
        Some(_) => return Err(ApiError::forbidden("Only team owners can delete teams")),
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Delete team (cascade will handle team_members)
    sqlx::query("DELETE FROM teams WHERE id = $1")
        .bind(&team_id)
        .execute(pool.get_ref())
        .await
        .map_err(|e| ApiError::internal(format!("Failed to delete team: {}", e)))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Team deleted successfully"
    })))
}

// ============================================================================
// TEAM MEMBERSHIP OPERATIONS
// ============================================================================

/// List team members
///
/// GET /api/teams/{id}/members
async fn list_members(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let team_id = path.into_inner();

    // Verify user is a member
    let is_member: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    if is_member.is_none() {
        return Err(ApiError::forbidden("You are not a member of this team"));
    }

    // Get all team members with user details
    let members: Vec<TeamMemberInfo> = sqlx::query_as::<_, (Uuid, Uuid, String, String, TeamRole, chrono::DateTime<chrono::Utc>)>(
        r#"
        SELECT tm.id, tm.user_id, u.email, u.name, tm.role, tm.joined_at
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = $1
        ORDER BY tm.role, u.name
        "#
    )
    .bind(&team_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?
    .into_iter()
    .map(|(id, user_id, email, name, role, joined_at)| TeamMemberInfo {
        id, user_id, email, name, role, joined_at,
    })
    .collect();

    Ok(HttpResponse::Ok().json(members))
}

/// Add member to team (invite)
///
/// POST /api/teams/{id}/members
async fn add_member(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<InviteUserRequest>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let team_id = path.into_inner();

    // Verify user has admin or owner role
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match membership {
        Some(m) if m.role == TeamRole::Owner || m.role == TeamRole::Admin => {},
        Some(_) => return Err(ApiError::forbidden("Only team owners and admins can invite members")),
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Find user by email
    let target_user: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&body.email.to_lowercase())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let target_user = match target_user {
        Some(u) => u,
        None => return Err(ApiError::not_found("User not found with that email")),
    };

    // Check if already a member
    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&target_user.id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    if existing.is_some() {
        return Err(ApiError::bad_request("User is already a member of this team"));
    }

    // Cannot assign owner role through invite
    let role = if body.role == TeamRole::Owner {
        TeamRole::Admin
    } else {
        body.role.clone()
    };

    // Add member
    let member: TeamMember = sqlx::query_as(
        r#"
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, $3)
        RETURNING *
        "#
    )
    .bind(&team_id)
    .bind(&target_user.id)
    .bind(&role)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Failed to add member: {}", e)))?;

    Ok(HttpResponse::Created().json(TeamMemberInfo {
        id: member.id,
        user_id: target_user.id,
        email: target_user.email,
        name: target_user.name,
        role: member.role,
        joined_at: member.joined_at,
    }))
}

/// Update member role
///
/// PUT /api/teams/{id}/members/{user_id}
async fn update_member_role(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
    body: web::Json<UpdateMemberRoleRequest>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let (team_id, target_user_id) = path.into_inner();

    // Verify user has owner role (only owners can change roles)
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match membership {
        Some(m) if m.role == TeamRole::Owner => {},
        Some(_) => return Err(ApiError::forbidden("Only team owners can change member roles")),
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Cannot change owner's role or assign owner role
    if body.role == TeamRole::Owner {
        return Err(ApiError::bad_request("Cannot assign owner role. Transfer ownership instead."));
    }

    // Check target member exists and is not owner
    let target_member: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&target_user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match target_member {
        Some(m) if m.role == TeamRole::Owner => {
            return Err(ApiError::bad_request("Cannot change owner's role"))
        },
        Some(_) => {},
        None => return Err(ApiError::not_found("Member not found")),
    };

    // Update role
    sqlx::query(
        "UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3"
    )
    .bind(&body.role)
    .bind(&team_id)
    .bind(&target_user_id)
    .execute(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Failed to update role: {}", e)))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Member role updated"
    })))
}

/// Remove member from team
///
/// DELETE /api/teams/{id}/members/{user_id}
async fn remove_member(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let (team_id, target_user_id) = path.into_inner();

    // Verify user has admin or owner role
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match membership {
        Some(m) if m.role == TeamRole::Owner || m.role == TeamRole::Admin => {},
        Some(_) => return Err(ApiError::forbidden("Only team owners and admins can remove members")),
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Cannot remove owner
    let target_member: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&target_user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match target_member {
        Some(m) if m.role == TeamRole::Owner => {
            return Err(ApiError::bad_request("Cannot remove team owner"))
        },
        Some(_) => {},
        None => return Err(ApiError::not_found("Member not found")),
    };

    // Remove member
    sqlx::query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2")
        .bind(&team_id)
        .bind(&target_user_id)
        .execute(pool.get_ref())
        .await
        .map_err(|e| ApiError::internal(format!("Failed to remove member: {}", e)))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Member removed from team"
    })))
}

/// Leave team
///
/// POST /api/teams/{id}/leave
async fn leave_team(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    let team_id = path.into_inner();

    // Check membership
    let membership: Option<TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2"
    )
    .bind(&team_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match membership {
        Some(m) if m.role == TeamRole::Owner => {
            return Err(ApiError::bad_request("Team owners cannot leave. Transfer ownership or delete the team."))
        },
        Some(_) => {},
        None => return Err(ApiError::forbidden("You are not a member of this team")),
    };

    // Leave team
    sqlx::query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2")
        .bind(&team_id)
        .bind(&user_id)
        .execute(pool.get_ref())
        .await
        .map_err(|e| ApiError::internal(format!("Failed to leave team: {}", e)))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Left team successfully"
    })))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Generate URL-friendly slug from name
fn generate_slug(name: &str) -> String {
    let mut result = String::new();
    let mut last_was_dash = true; // Start true to trim leading dashes

    for c in name.to_lowercase().chars() {
        if c.is_alphanumeric() {
            result.push(c);
            last_was_dash = false;
        } else if (c.is_whitespace() || c == '-' || c == '_') && !last_was_dash {
            result.push('-');
            last_was_dash = true;
        }
        // Skip other chars entirely
    }

    // Trim trailing dash and limit length
    if result.ends_with('-') {
        result.pop();
    }

    result.chars().take(100).collect()
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_slug() {
        assert_eq!(generate_slug("My Team"), "my-team");
        assert_eq!(generate_slug("Project_Alpha"), "project-alpha");
        assert_eq!(generate_slug("Test  Team  123"), "test-team-123");
        assert_eq!(generate_slug("Special!@#Chars"), "specialchars");
    }
}

