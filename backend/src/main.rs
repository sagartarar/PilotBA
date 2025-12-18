//! PilotBA Backend Server
//!
//! A high-performance data visualization backend built with Actix-web.

use actix_web::{web, App, HttpServer, middleware as actix_middleware};
use actix_cors::Cors;
use std::io;

mod connectors;
mod errors;
mod middleware;
mod models;
mod routes;
mod services;
mod utils;

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Load environment variables
    dotenv::dotenv().ok();
    
    log::info!("Starting PilotBA Backend Server v{}...", env!("CARGO_PKG_VERSION"));
    
    // Get configuration from environment
    let bind_address = std::env::var("BIND_ADDRESS")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| {
            log::warn!("JWT_SECRET not set, using development default. DO NOT USE IN PRODUCTION!");
            "development-secret-change-in-production".to_string()
        });

    // Create upload directory
    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
    std::fs::create_dir_all(&upload_dir).ok();
    log::info!("Upload directory: {}", upload_dir);
    
    log::info!("Server binding to: {}", bind_address);
    
    HttpServer::new(move || {
        // Configure CORS
        let cors = Cors::default()
            .allow_any_origin() // TODO: Configure for production
            .allow_any_method()
            .allow_any_header()
            .expose_headers(vec!["Content-Disposition"])
            .max_age(3600);
        
        App::new()
            // Middleware
            .wrap(actix_middleware::Logger::default())
            .wrap(actix_middleware::Compress::default())
            .wrap(cors)
            // Public API routes
            .service(
                web::scope("/api")
                    // Health check (public)
                    .configure(routes::health::config)
                    // Auth routes (public login, protected others)
                    .configure(routes::auth::config)
                    // Protected routes
                    .service(
                        web::scope("")
                            .wrap(middleware::AuthMiddleware)
                            .configure(routes::files::config)
                    )
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}
