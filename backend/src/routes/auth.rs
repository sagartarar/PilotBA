//! Authentication Routes
//!
//! Provides login, logout, and user info endpoints.

use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::errors::{ApiError, ApiResult};
use crate::middleware::auth::{generate_jwt, get_claims, Claims};

/// Configure auth routes
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout))
            .route("/me", web::get().to(me))
            .route("/refresh", web::post().to(refresh_token)),
    );
}

/// Login request body
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub expires_in: i64,
    pub token_type: String,
    pub user: UserInfo,
}

/// User info response
#[derive(Debug, Serialize, Clone)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Login endpoint
///
/// POST /api/auth/login
async fn login(body: web::Json<LoginRequest>) -> ApiResult<HttpResponse> {
    // Validate input
    if body.email.is_empty() || body.password.is_empty() {
        return Err(ApiError::bad_request("Email and password are required"));
    }

    // Validate email format (basic check)
    if !body.email.contains('@') {
        return Err(ApiError::bad_request("Invalid email format"));
    }

    // TODO: Replace with actual database lookup
    // For now, use a demo user for development
    let demo_users = vec![
        ("demo@pilotba.com", "demo123", "demo-user-1", "Demo User"),
        ("admin@pilotba.com", "admin123", "admin-user-1", "Admin User"),
    ];

    let user = demo_users
        .iter()
        .find(|(email, password, _, _)| *email == body.email && *password == body.password);

    match user {
        Some((email, _, id, name)) => {
            let jwt_secret = std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "development-secret-change-in-production".to_string());

            let expires_in_hours = 24;
            let claims = Claims::new(id, email, name, expires_in_hours);
            
            let token = generate_jwt(&claims, &jwt_secret)
                .map_err(|e| ApiError::internal(format!("Failed to generate token: {}", e)))?;

            Ok(HttpResponse::Ok().json(LoginResponse {
                token,
                expires_in: expires_in_hours * 3600,
                token_type: "Bearer".to_string(),
                user: UserInfo {
                    id: id.to_string(),
                    email: email.to_string(),
                    name: name.to_string(),
                },
            }))
        }
        None => Err(ApiError::unauthorized("Invalid email or password")),
    }
}

/// Logout endpoint
///
/// POST /api/auth/logout
async fn logout(req: HttpRequest) -> ApiResult<HttpResponse> {
    // In a stateless JWT setup, logout is handled client-side
    // by removing the token. Here we just acknowledge the request.
    
    // If using token blacklist, add token to blacklist here
    let _claims = get_claims(&req);
    
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}

/// Get current user info
///
/// GET /api/auth/me
async fn me(req: HttpRequest) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    Ok(HttpResponse::Ok().json(UserInfo {
        id: claims.sub,
        email: claims.email,
        name: claims.name,
    }))
}

/// Refresh token endpoint
///
/// POST /api/auth/refresh
async fn refresh_token(req: HttpRequest) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "development-secret-change-in-production".to_string());

    let expires_in_hours = 24;
    let new_claims = Claims::new(&claims.sub, &claims.email, &claims.name, expires_in_hours);
    
    let token = generate_jwt(&new_claims, &jwt_secret)
        .map_err(|e| ApiError::internal(format!("Failed to generate token: {}", e)))?;

    Ok(HttpResponse::Ok().json(json!({
        "token": token,
        "expires_in": expires_in_hours * 3600,
        "token_type": "Bearer"
    })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_login_request_validation() {
        let req = LoginRequest {
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
        };
        
        assert!(!req.email.is_empty());
        assert!(!req.password.is_empty());
        assert!(req.email.contains('@'));
    }
}

