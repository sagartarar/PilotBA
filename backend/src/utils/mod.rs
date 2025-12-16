use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized")]
    Unauthorized,
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Internal server error: {0}")]
    InternalError(String),
}

impl actix_web::ResponseError for AppError {
    fn error_response(&self) -> actix_web::HttpResponse {
        match self {
            AppError::NotFound(_) => actix_web::HttpResponse::NotFound().json(
                serde_json::json!({"error": self.to_string()})
            ),
            AppError::Unauthorized => actix_web::HttpResponse::Unauthorized().json(
                serde_json::json!({"error": self.to_string()})
            ),
            AppError::BadRequest(_) => actix_web::HttpResponse::BadRequest().json(
                serde_json::json!({"error": self.to_string()})
            ),
            _ => actix_web::HttpResponse::InternalServerError().json(
                serde_json::json!({"error": self.to_string()})
            ),
        }
    }
}


