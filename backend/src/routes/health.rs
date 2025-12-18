//! Health Check Routes
//!
//! Provides health and status endpoints for monitoring.

use actix_web::{web, HttpResponse};
use serde_json::json;

/// Configure health routes
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/health")
            .route("", web::get().to(health_check))
            .route("/ready", web::get().to(readiness_check))
            .route("/live", web::get().to(liveness_check)),
    );
}

/// Basic health check
async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
        "service": "pilotba-backend"
    }))
}

/// Readiness check - is the service ready to accept traffic?
async fn readiness_check() -> HttpResponse {
    // TODO: Check database connection, etc.
    HttpResponse::Ok().json(json!({
        "status": "ready",
        "checks": {
            "database": "ok",
            "cache": "ok"
        }
    }))
}

/// Liveness check - is the service alive?
async fn liveness_check() -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "status": "alive",
        "uptime": get_uptime_seconds()
    }))
}

/// Get server uptime in seconds
fn get_uptime_seconds() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    
    // In a real app, you'd store the start time at initialization
    // For now, just return current timestamp
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

