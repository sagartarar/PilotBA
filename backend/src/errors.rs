//! API Error Types for PilotBA Backend
//!
//! Provides structured error handling with consistent JSON responses
//! and proper HTTP status codes.

use actix_web::{HttpResponse, ResponseError};
use serde_json::json;
use std::fmt;
use thiserror::Error;

/// API Error types with associated HTTP status codes
#[derive(Error, Debug)]
pub enum ApiError {
    /// Authentication failed (401)
    #[error("Authentication failed: {0}")]
    Unauthorized(String),

    /// Access denied (403)
    #[error("Access denied: {0}")]
    Forbidden(String),

    /// Resource not found (404)
    #[error("Resource not found: {0}")]
    NotFound(String),

    /// Invalid request (400)
    #[error("Invalid request: {0}")]
    BadRequest(String),

    /// Validation error (422)
    #[error("Validation error: {0}")]
    ValidationError(String),

    /// File too large (413)
    #[error("File too large: maximum size is {0} bytes")]
    FileTooLarge(u64),

    /// Unsupported file type (415)
    #[error("Unsupported file type: {0}")]
    UnsupportedMediaType(String),

    /// Rate limit exceeded (429)
    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    /// Internal server error (500)
    #[error("Internal error: {0}")]
    Internal(String),

    /// Database error
    #[error("Database error")]
    DatabaseError(#[from] sqlx::Error),

    /// IO error
    #[error("IO error")]
    IoError(#[from] std::io::Error),
}

impl ApiError {
    /// Create a new unauthorized error
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        ApiError::Unauthorized(msg.into())
    }

    /// Create a new not found error
    pub fn not_found(msg: impl Into<String>) -> Self {
        ApiError::NotFound(msg.into())
    }

    /// Create a new bad request error
    pub fn bad_request(msg: impl Into<String>) -> Self {
        ApiError::BadRequest(msg.into())
    }

    /// Create a new internal error
    pub fn internal(msg: impl Into<String>) -> Self {
        ApiError::Internal(msg.into())
    }

    /// Get error code for client
    fn error_code(&self) -> &'static str {
        match self {
            ApiError::Unauthorized(_) => "unauthorized",
            ApiError::Forbidden(_) => "forbidden",
            ApiError::NotFound(_) => "not_found",
            ApiError::BadRequest(_) => "bad_request",
            ApiError::ValidationError(_) => "validation_error",
            ApiError::FileTooLarge(_) => "file_too_large",
            ApiError::UnsupportedMediaType(_) => "unsupported_media_type",
            ApiError::RateLimitExceeded => "rate_limit_exceeded",
            ApiError::Internal(_) => "internal_error",
            ApiError::DatabaseError(_) => "database_error",
            ApiError::IoError(_) => "io_error",
        }
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        let (status, message) = match self {
            ApiError::Unauthorized(msg) => {
                (actix_web::http::StatusCode::UNAUTHORIZED, msg.clone())
            }
            ApiError::Forbidden(msg) => {
                (actix_web::http::StatusCode::FORBIDDEN, msg.clone())
            }
            ApiError::NotFound(msg) => {
                (actix_web::http::StatusCode::NOT_FOUND, msg.clone())
            }
            ApiError::BadRequest(msg) => {
                (actix_web::http::StatusCode::BAD_REQUEST, msg.clone())
            }
            ApiError::ValidationError(msg) => {
                (actix_web::http::StatusCode::UNPROCESSABLE_ENTITY, msg.clone())
            }
            ApiError::FileTooLarge(max_size) => (
                actix_web::http::StatusCode::PAYLOAD_TOO_LARGE,
                format!("File exceeds maximum size of {} bytes", max_size),
            ),
            ApiError::UnsupportedMediaType(msg) => {
                (actix_web::http::StatusCode::UNSUPPORTED_MEDIA_TYPE, msg.clone())
            }
            ApiError::RateLimitExceeded => (
                actix_web::http::StatusCode::TOO_MANY_REQUESTS,
                "Rate limit exceeded. Please try again later.".to_string(),
            ),
            ApiError::Internal(msg) => {
                // Log internal errors but don't expose details to client
                log::error!("Internal error: {}", msg);
                (
                    actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                    "An unexpected error occurred".to_string(),
                )
            }
            ApiError::DatabaseError(e) => {
                log::error!("Database error: {:?}", e);
                (
                    actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                    "A database error occurred".to_string(),
                )
            }
            ApiError::IoError(e) => {
                log::error!("IO error: {:?}", e);
                (
                    actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                    "A file system error occurred".to_string(),
                )
            }
        };

        HttpResponse::build(status).json(json!({
            "error": self.error_code(),
            "message": message,
            "status": status.as_u16()
        }))
    }
}

/// Result type for API operations
pub type ApiResult<T> = Result<T, ApiError>;

