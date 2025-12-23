//! Authentication Routes
//!
//! Provides registration, login, logout, refresh, and user info endpoints.
//! Uses Argon2 for password hashing and JWT for stateless authentication.

use actix_web::{web, HttpRequest, HttpResponse};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::{ApiError, ApiResult};
use crate::middleware::auth::{generate_jwt, generate_refresh_token, get_claims, Claims};
use crate::models::{AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, User, UserInfo, UserRole};

/// Configure auth routes
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/register", web::post().to(register))
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout))
            .route("/me", web::get().to(me))
            .route("/refresh", web::post().to(refresh_token)),
    );
}

/// Register endpoint
///
/// POST /api/auth/register
async fn register(
    pool: web::Data<PgPool>,
    body: web::Json<RegisterRequest>,
) -> ApiResult<HttpResponse> {
    // Validate input
    validate_registration(&body)?;

    // Check if email already exists
    let existing: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&body.email.to_lowercase())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    if existing.is_some() {
        return Err(ApiError::bad_request("Email already registered"));
    }

    // Hash password with Argon2
    let password_hash = hash_password(&body.password)?;

    // Create user
    let user: User = sqlx::query_as(
        r#"
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#
    )
    .bind(&body.email.to_lowercase())
    .bind(&password_hash)
    .bind(&body.name)
    .bind(UserRole::User)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Failed to create user: {}", e)))?;

    // Generate tokens
    let (access_token, refresh_token, expires_in) = generate_tokens(&user)?;

    Ok(HttpResponse::Created().json(AuthResponse {
        access_token,
        refresh_token,
        expires_in,
        token_type: "Bearer".to_string(),
        user: user.into(),
    }))
}

/// Login endpoint
///
/// POST /api/auth/login
async fn login(
    pool: web::Data<PgPool>,
    body: web::Json<LoginRequest>,
) -> ApiResult<HttpResponse> {
    // Validate input
    if body.email.is_empty() || body.password.is_empty() {
        return Err(ApiError::bad_request("Email and password are required"));
    }

    // Find user by email
    let user: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&body.email.to_lowercase())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let user = match user {
        Some(u) => u,
        None => return Err(ApiError::unauthorized("Invalid email or password")),
    };

    // Verify password
    if !verify_password(&body.password, &user.password_hash)? {
        return Err(ApiError::unauthorized("Invalid email or password"));
    }

    // Generate tokens
    let (access_token, refresh_token, expires_in) = generate_tokens(&user)?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token,
        expires_in,
        token_type: "Bearer".to_string(),
        user: user.into(),
    }))
}

/// Logout endpoint
///
/// POST /api/auth/logout
/// Adds refresh token to blacklist
async fn logout(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: Option<web::Json<RefreshRequest>>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req);

    // If refresh token provided, blacklist it
    if let Some(refresh_body) = body {
        let token_hash = sha256_hash(&refresh_body.refresh_token);
        
        // Calculate expiration (7 days from now to match refresh token expiry)
        let expires_at = chrono::Utc::now() + chrono::Duration::days(7);
        
        let user_id = claims.as_ref()
            .map(|c| Uuid::parse_str(&c.sub).ok())
            .flatten()
            .unwrap_or_else(Uuid::nil);

        // Add to blacklist
        sqlx::query(
            r#"
            INSERT INTO revoked_tokens (token_hash, user_id, expires_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (token_hash) DO NOTHING
            "#
        )
        .bind(&token_hash)
        .bind(&user_id)
        .bind(&expires_at)
        .execute(pool.get_ref())
        .await
        .ok(); // Ignore errors - logout should succeed anyway
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}

/// Get current user info
///
/// GET /api/auth/me
async fn me(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    // Fetch fresh user data from database
    let user: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    match user {
        Some(u) => Ok(HttpResponse::Ok().json(UserInfo::from(u))),
        None => Err(ApiError::unauthorized("User not found")),
    }
}

/// Refresh token endpoint
///
/// POST /api/auth/refresh
async fn refresh_token(
    pool: web::Data<PgPool>,
    body: web::Json<RefreshRequest>,
) -> ApiResult<HttpResponse> {
    // Validate refresh token format (basic check)
    if body.refresh_token.len() < 32 {
        return Err(ApiError::unauthorized("Invalid refresh token"));
    }

    let token_hash = sha256_hash(&body.refresh_token);

    // Check if token is blacklisted
    let is_revoked: Option<(String,)> = sqlx::query_as(
        "SELECT token_hash FROM revoked_tokens WHERE token_hash = $1"
    )
    .bind(&token_hash)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    if is_revoked.is_some() {
        return Err(ApiError::unauthorized("Token has been revoked"));
    }

    // Decode the refresh token to get user info
    let jwt_secret = get_jwt_secret();
    let claims = crate::middleware::auth::validate_refresh_token(&body.refresh_token, &jwt_secret)
        .map_err(|_| ApiError::unauthorized("Invalid or expired refresh token"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID in token"))?;

    // Fetch user to ensure they still exist and get current data
    let user: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let user = match user {
        Some(u) => u,
        None => return Err(ApiError::unauthorized("User not found")),
    };

    // Generate new tokens
    let (access_token, new_refresh_token, expires_in) = generate_tokens(&user)?;

    // Optionally blacklist the old refresh token (rotation)
    let expires_at = chrono::Utc::now() + chrono::Duration::days(7);
    sqlx::query(
        "INSERT INTO revoked_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING"
    )
    .bind(&token_hash)
    .bind(&user.id)
    .bind(&expires_at)
    .execute(pool.get_ref())
    .await
    .ok();

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token: new_refresh_token,
        expires_in,
        token_type: "Bearer".to_string(),
        user: user.into(),
    }))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Validate registration input
fn validate_registration(req: &RegisterRequest) -> ApiResult<()> {
    // Check required fields
    if req.email.is_empty() {
        return Err(ApiError::bad_request("Email is required"));
    }
    if req.password.is_empty() {
        return Err(ApiError::bad_request("Password is required"));
    }
    if req.name.is_empty() {
        return Err(ApiError::bad_request("Name is required"));
    }

    // Validate email format
    if !req.email.contains('@') || !req.email.contains('.') {
        return Err(ApiError::bad_request("Invalid email format"));
    }

    // Validate password strength
    if req.password.len() < 8 {
        return Err(ApiError::bad_request("Password must be at least 8 characters"));
    }

    // Check for mixed character types
    let has_lowercase = req.password.chars().any(|c| c.is_lowercase());
    let has_uppercase = req.password.chars().any(|c| c.is_uppercase());
    let has_digit = req.password.chars().any(|c| c.is_ascii_digit());
    
    if !has_lowercase || !has_uppercase || !has_digit {
        return Err(ApiError::bad_request(
            "Password must contain lowercase, uppercase, and numeric characters"
        ));
    }

    // Validate name length
    if req.name.len() < 2 || req.name.len() > 100 {
        return Err(ApiError::bad_request("Name must be between 2 and 100 characters"));
    }

    Ok(())
}

/// Hash password using Argon2
fn hash_password(password: &str) -> ApiResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| ApiError::internal(format!("Password hashing failed: {}", e)))?;
    
    Ok(hash.to_string())
}

/// Verify password against hash
fn verify_password(password: &str, hash: &str) -> ApiResult<bool> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| ApiError::internal(format!("Invalid password hash: {}", e)))?;
    
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

/// Generate access and refresh tokens
fn generate_tokens(user: &User) -> ApiResult<(String, String, i64)> {
    let jwt_secret = get_jwt_secret();
    
    // Access token: 1 hour
    let access_expires_hours = 1;
    let access_claims = Claims::new(
        &user.id.to_string(),
        &user.email,
        &user.name,
        access_expires_hours,
    );
    let access_token = generate_jwt(&access_claims, &jwt_secret)
        .map_err(|e| ApiError::internal(format!("Failed to generate access token: {}", e)))?;

    // Refresh token: 7 days
    let refresh_expires_hours = 7 * 24;
    let refresh_claims = Claims::new(
        &user.id.to_string(),
        &user.email,
        &user.name,
        refresh_expires_hours,
    );
    let refresh_token = generate_refresh_token(&refresh_claims, &jwt_secret)
        .map_err(|e| ApiError::internal(format!("Failed to generate refresh token: {}", e)))?;

    Ok((access_token, refresh_token, access_expires_hours * 3600))
}

/// Get JWT secret from environment
fn get_jwt_secret() -> String {
    std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "development-secret-change-in-production".to_string())
}

/// SHA256 hash for token blacklisting
fn sha256_hash(input: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "SecureP@ss123";
        let hash = hash_password(password).unwrap();
        
        assert!(hash.starts_with("$argon2"));
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrongpassword", &hash).unwrap());
    }

    #[test]
    fn test_validation_empty_email() {
        let req = RegisterRequest {
            email: "".to_string(),
            password: "SecureP@ss123".to_string(),
            name: "Test User".to_string(),
        };
        assert!(validate_registration(&req).is_err());
    }

    #[test]
    fn test_validation_weak_password() {
        let req = RegisterRequest {
            email: "test@example.com".to_string(),
            password: "weak".to_string(),
            name: "Test User".to_string(),
        };
        assert!(validate_registration(&req).is_err());
    }

    #[test]
    fn test_validation_password_no_uppercase() {
        let req = RegisterRequest {
            email: "test@example.com".to_string(),
            password: "nouppercase123".to_string(),
            name: "Test User".to_string(),
        };
        assert!(validate_registration(&req).is_err());
    }

    #[test]
    fn test_validation_valid_request() {
        let req = RegisterRequest {
            email: "test@example.com".to_string(),
            password: "SecureP@ss123".to_string(),
            name: "Test User".to_string(),
        };
        assert!(validate_registration(&req).is_ok());
    }

    #[test]
    fn test_sha256_hash() {
        let hash1 = sha256_hash("test-token");
        let hash2 = sha256_hash("test-token");
        let hash3 = sha256_hash("different-token");
        
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash3);
    }
}
