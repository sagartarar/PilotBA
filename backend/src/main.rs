use actix_web::{web, App, HttpServer, HttpResponse, middleware};
use actix_cors::Cors;
use std::io;

mod services;
mod models;
mod utils;
mod connectors;

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Load environment variables
    dotenv::dotenv().ok();
    
    log::info!("Starting PilotBA Backend Server...");
    
    let bind_address = std::env::var("BIND_ADDRESS")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    
    log::info!("Server binding to: {}", bind_address);
    
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .service(
                web::scope("/api")
                    .route("/health", web::get().to(health_check))
                    .route("/status", web::get().to(status))
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "pilotba-backend"
    }))
}

async fn status() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "running",
        "version": env!("CARGO_PKG_VERSION"),
        "service": "pilotba-backend"
    }))
}

