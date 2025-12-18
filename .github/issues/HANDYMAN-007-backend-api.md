# 🔧 HANDYMAN-007: Backend API MVP

**Priority:** P0 (Critical)
**Time Estimate:** 3 days
**Depends On:** HANDYMAN-004 (Error Handling)

---

## 📋 Objective

Build minimal Rust/Actix backend with auth and file storage.

---

## 📁 File Structure

```
backend/src/
├── main.rs
├── config.rs
├── lib.rs
├── routes/
│   ├── mod.rs
│   ├── auth.rs
│   ├── files.rs
│   └── health.rs
├── models/
│   ├── mod.rs
│   ├── user.rs
│   └── file.rs
├── middleware/
│   ├── mod.rs
│   └── auth.rs
├── services/
│   ├── mod.rs
│   ├── auth_service.rs
│   └── file_service.rs
└── errors.rs
```

---

## 🔌 API Endpoints

### Health Check
```
GET /api/health
Response: { "status": "ok", "version": "0.1.0" }
```

### Authentication
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "..." }
Response: { "token": "jwt...", "expiresIn": 86400 }

POST /api/auth/logout
Header: Authorization: Bearer <token>
Response: { "success": true }

GET /api/auth/me
Header: Authorization: Bearer <token>
Response: { "id": "...", "email": "...", "name": "..." }
```

### Files
```
POST /api/files
Header: Authorization: Bearer <token>
Body: multipart/form-data (file)
Response: { "id": "...", "name": "...", "size": 1234, "createdAt": "..." }

GET /api/files
Header: Authorization: Bearer <token>
Response: { "files": [...] }

GET /api/files/:id
Header: Authorization: Bearer <token>
Response: file binary

DELETE /api/files/:id
Header: Authorization: Bearer <token>
Response: { "success": true }
```

---

## 🔧 Implementation Steps

### Step 1: Update Dependencies (`Cargo.toml`)

```toml
[dependencies]
actix-web = "4"
actix-rt = "2"
actix-multipart = "0.6"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
jsonwebtoken = "9"
bcrypt = "0.15"
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
dotenv = "0.15"
thiserror = "1"
tracing = "0.1"
tracing-subscriber = "0.3"

[dev-dependencies]
actix-rt = "2"
```

### Step 2: Create Error Types (`errors.rs`)

```rust
use actix_web::{HttpResponse, ResponseError};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Authentication failed")]
    Unauthorized,
    
    #[error("Resource not found")]
    NotFound,
    
    #[error("Invalid input: {0}")]
    BadRequest(String),
    
    #[error("File too large")]
    FileTooLarge,
    
    #[error("Internal error")]
    Internal(#[from] anyhow::Error),
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::Unauthorized => HttpResponse::Unauthorized().json(json!({
                "error": "unauthorized",
                "message": self.to_string()
            })),
            ApiError::NotFound => HttpResponse::NotFound().json(json!({
                "error": "not_found",
                "message": self.to_string()
            })),
            ApiError::BadRequest(msg) => HttpResponse::BadRequest().json(json!({
                "error": "bad_request",
                "message": msg
            })),
            ApiError::FileTooLarge => HttpResponse::PayloadTooLarge().json(json!({
                "error": "file_too_large",
                "message": "File exceeds 100MB limit"
            })),
            ApiError::Internal(_) => HttpResponse::InternalServerError().json(json!({
                "error": "internal_error",
                "message": "An unexpected error occurred"
            })),
        }
    }
}
```

### Step 3: Create Auth Middleware (`middleware/auth.rs`)

```rust
use actix_web::{dev::ServiceRequest, Error, HttpMessage};
use jsonwebtoken::{decode, DecodingKey, Validation};

pub async fn validate_token(req: ServiceRequest) -> Result<ServiceRequest, Error> {
    let auth_header = req.headers().get("Authorization");
    
    match auth_header {
        Some(header) => {
            let token = header.to_str()?.strip_prefix("Bearer ")?;
            let claims = decode::<Claims>(
                token,
                &DecodingKey::from_secret(JWT_SECRET),
                &Validation::default()
            )?;
            req.extensions_mut().insert(claims.claims);
            Ok(req)
        }
        None => Err(ApiError::Unauthorized.into())
    }
}
```

### Step 4: Create File Routes (`routes/files.rs`)

```rust
use actix_multipart::Multipart;
use actix_web::{web, HttpResponse};
use futures_util::StreamExt;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/files")
            .route("", web::post().to(upload_file))
            .route("", web::get().to(list_files))
            .route("/{id}", web::get().to(get_file))
            .route("/{id}", web::delete().to(delete_file))
    );
}

async fn upload_file(mut payload: Multipart) -> Result<HttpResponse, ApiError> {
    while let Some(field) = payload.next().await {
        let mut field = field?;
        
        // Check file size
        let content_length = field.content_disposition()
            .get_filename()
            .map(|_| field.size());
            
        if content_length > Some(100 * 1024 * 1024) {
            return Err(ApiError::FileTooLarge);
        }
        
        // Save file
        let file_id = uuid::Uuid::new_v4();
        let path = format!("./uploads/{}", file_id);
        
        let mut file = tokio::fs::File::create(&path).await?;
        while let Some(chunk) = field.next().await {
            file.write_all(&chunk?).await?;
        }
        
        return Ok(HttpResponse::Ok().json(json!({
            "id": file_id,
            "name": field.content_disposition().get_filename(),
            "size": content_length,
        })));
    }
    
    Err(ApiError::BadRequest("No file provided".into()))
}
```

### Step 5: Create Main Entry (`main.rs`)

```rust
use actix_web::{web, App, HttpServer, middleware};
use tracing_subscriber;

mod config;
mod errors;
mod routes;
mod middleware as mw;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt::init();
    
    HttpServer::new(|| {
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(middleware::Cors::permissive()) // Configure properly for prod
            .service(
                web::scope("/api")
                    .configure(routes::health::config)
                    .configure(routes::auth::config)
                    .service(
                        web::scope("")
                            .wrap(mw::auth::AuthMiddleware)
                            .configure(routes::files::config)
                    )
            )
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

### Step 6: Add Environment Config (`.env.example`)

```env
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL=postgres://user:pass@localhost/pilotba
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
PORT=8080
```

---

## ✅ Acceptance Criteria

- [ ] `cargo build --release` succeeds
- [ ] `cargo test` passes
- [ ] `/api/health` returns 200
- [ ] Login returns valid JWT
- [ ] Protected routes return 401 without token
- [ ] File upload works for 100MB file
- [ ] File download returns correct file
- [ ] Errors return consistent JSON format

---

## 🧪 Test Cases for Toaster

```rust
#[cfg(test)]
mod tests {
    #[actix_rt::test]
    async fn test_health_check() {
        // GET /api/health returns 200
    }
    
    #[actix_rt::test]
    async fn test_login_success() {
        // POST /api/auth/login with valid creds returns token
    }
    
    #[actix_rt::test]
    async fn test_login_failure() {
        // POST /api/auth/login with invalid creds returns 401
    }
    
    #[actix_rt::test]
    async fn test_protected_route_without_token() {
        // GET /api/files without token returns 401
    }
    
    #[actix_rt::test]
    async fn test_file_upload() {
        // POST /api/files with file returns file metadata
    }
}
```

---

## 🏷️ Labels

`handyman` `priority-p0` `backend` `rust`

