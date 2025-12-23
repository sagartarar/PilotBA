//! JWT Authentication Middleware
//!
//! Provides JWT token validation and user extraction for protected routes.

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures_util::future::{ok, LocalBoxFuture, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use std::rc::Rc;

use crate::errors::ApiError;

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// User ID
    pub sub: String,
    /// User email
    pub email: String,
    /// User name
    pub name: String,
    /// Expiration timestamp
    pub exp: usize,
    /// Issued at timestamp
    pub iat: usize,
}

impl Claims {
    /// Create new claims for a user
    pub fn new(user_id: &str, email: &str, name: &str, exp_hours: i64) -> Self {
        let now = chrono::Utc::now();
        let exp = (now + chrono::Duration::hours(exp_hours)).timestamp() as usize;

        Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            name: name.to_string(),
            exp,
            iat: now.timestamp() as usize,
        }
    }
}

/// Authentication middleware
pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddlewareService {
            service: Rc::new(service),
        })
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            // Extract Authorization header
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok());

            match auth_header {
                Some(header) if header.starts_with("Bearer ") => {
                    let token = &header[7..]; // Skip "Bearer "

                    // Get JWT secret from environment
                    let jwt_secret = std::env::var("JWT_SECRET")
                        .unwrap_or_else(|_| "development-secret-change-in-production".to_string());

                    // Validate token
                    match validate_jwt(token, &jwt_secret) {
                        Ok(claims) => {
                            // Store claims in request extensions
                            req.extensions_mut().insert(claims);
                            service.call(req).await
                        }
                        Err(e) => {
                            log::warn!("JWT validation failed: {:?}", e);
                            Err(ApiError::unauthorized("Invalid or expired token").into())
                        }
                    }
                }
                _ => {
                    Err(ApiError::unauthorized("Missing or invalid Authorization header").into())
                }
            }
        })
    }
}

/// Validate JWT token and extract claims
fn validate_jwt(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let validation = Validation::new(Algorithm::HS256);
    let key = DecodingKey::from_secret(secret.as_bytes());

    let token_data = decode::<Claims>(token, &key, &validation)?;
    Ok(token_data.claims)
}

/// Generate a new JWT access token
pub fn generate_jwt(claims: &Claims, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    use jsonwebtoken::{encode, EncodingKey, Header};

    let key = EncodingKey::from_secret(secret.as_bytes());
    encode(&Header::default(), claims, &key)
}

/// Generate a refresh token (uses same JWT format but different purpose)
pub fn generate_refresh_token(claims: &Claims, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    use jsonwebtoken::{encode, EncodingKey, Header};

    // Use a different secret suffix for refresh tokens for additional security
    let refresh_secret = format!("{}-refresh", secret);
    let key = EncodingKey::from_secret(refresh_secret.as_bytes());
    encode(&Header::default(), claims, &key)
}

/// Validate a refresh token
pub fn validate_refresh_token(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let refresh_secret = format!("{}-refresh", secret);
    let validation = Validation::new(Algorithm::HS256);
    let key = DecodingKey::from_secret(refresh_secret.as_bytes());

    let token_data = decode::<Claims>(token, &key, &validation)?;
    Ok(token_data.claims)
}

/// Extract claims from request extensions
pub fn get_claims(req: &actix_web::HttpRequest) -> Option<Claims> {
    req.extensions().get::<Claims>().cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_claims_creation() {
        let claims = Claims::new("user123", "test@example.com", "Test User", 24);

        assert_eq!(claims.sub, "user123");
        assert_eq!(claims.email, "test@example.com");
        assert_eq!(claims.name, "Test User");
        assert!(claims.exp > claims.iat);
    }

    #[test]
    fn test_jwt_roundtrip() {
        let claims = Claims::new("user123", "test@example.com", "Test User", 24);
        let secret = "test-secret";

        let token = generate_jwt(&claims, secret).unwrap();
        let decoded = validate_jwt(&token, secret).unwrap();

        assert_eq!(decoded.sub, claims.sub);
        assert_eq!(decoded.email, claims.email);
    }

    #[test]
    fn test_invalid_token() {
        let result = validate_jwt("invalid-token", "secret");
        assert!(result.is_err());
    }
}

