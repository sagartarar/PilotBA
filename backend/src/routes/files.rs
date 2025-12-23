//! File Management Routes
//!
//! Provides file upload, download, list, and delete endpoints.
//! Files are stored on local filesystem with metadata in PostgreSQL.

use actix_web::{web, HttpRequest, HttpResponse};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::path::PathBuf;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::errors::{ApiError, ApiResult};
use crate::middleware::auth::get_claims;

/// Maximum file size (100MB)
const MAX_FILE_SIZE: usize = 100 * 1024 * 1024;

/// Allowed file extensions
const ALLOWED_EXTENSIONS: &[&str] = &["csv", "json", "parquet", "arrow"];

/// Configure file routes
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/files")
            .route("", web::post().to(upload_file))
            .route("", web::get().to(list_files))
            .route("/{id}", web::get().to(get_file))
            .route("/{id}", web::delete().to(delete_file))
            .route("/{id}/metadata", web::get().to(get_file_metadata)),
    );
}

// ============================================================================
// MODELS
// ============================================================================

/// File record from database
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct FileRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub original_name: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub row_count: Option<i32>,
    pub column_count: Option<i32>,
    pub storage_path: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// File metadata response (for API)
#[derive(Debug, Serialize, Clone)]
pub struct FileMetadata {
    pub id: Uuid,
    pub name: String,
    pub original_name: String,
    pub size: i64,
    pub content_type: String,
    pub row_count: Option<i32>,
    pub column_count: Option<i32>,
    pub created_at: DateTime<Utc>,
}

impl From<FileRecord> for FileMetadata {
    fn from(record: FileRecord) -> Self {
        FileMetadata {
            id: record.id,
            name: record.name,
            original_name: record.original_name,
            size: record.size_bytes,
            content_type: record.mime_type,
            row_count: record.row_count,
            column_count: record.column_count,
            created_at: record.created_at,
        }
    }
}

/// Query parameters for listing files
#[derive(Debug, Deserialize)]
pub struct ListFilesQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub search: Option<String>,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// Upload file
///
/// POST /api/files
async fn upload_file(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    mut payload: actix_web::web::Payload,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID"))?;

    // Get upload directory
    let upload_dir = get_upload_dir()?;
    fs::create_dir_all(&upload_dir).await?;

    // Read the entire payload
    let mut body = Vec::new();
    while let Some(chunk) = payload.next().await {
        let chunk = chunk.map_err(|e| ApiError::bad_request(format!("Failed to read payload: {}", e)))?;
        
        // Check size limit
        if body.len() + chunk.len() > MAX_FILE_SIZE {
            return Err(ApiError::FileTooLarge(MAX_FILE_SIZE as u64));
        }
        
        body.extend_from_slice(&chunk);
    }

    if body.is_empty() {
        return Err(ApiError::bad_request("No file data received"));
    }

    // Get filename from Content-Disposition header or generate one
    let content_disposition = req
        .headers()
        .get("Content-Disposition")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    let original_name = extract_filename(content_disposition)
        .unwrap_or_else(|| format!("upload_{}.bin", Uuid::new_v4()));

    // Validate file extension
    let extension = original_name
        .rsplit('.')
        .next()
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

    if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
        return Err(ApiError::UnsupportedMediaType(format!(
            "File type '{}' not allowed. Allowed types: {:?}",
            extension, ALLOWED_EXTENSIONS
        )));
    }

    // Generate unique file ID and path
    let file_id = Uuid::new_v4();
    let file_name = format!("{}.{}", file_id, extension);
    let file_path = upload_dir.join(&file_name);
    let storage_path = file_path.to_string_lossy().to_string();

    // Write file to disk
    let mut file = fs::File::create(&file_path).await?;
    file.write_all(&body).await?;
    file.sync_all().await?;

    // Get content type
    let mime_type = get_content_type(&extension);

    // Analyze file to get row/column counts (basic implementation)
    let (row_count, column_count) = analyze_file(&body, &extension).await;

    // Store metadata in database
    let record: FileRecord = sqlx::query_as(
        r#"
        INSERT INTO files (id, user_id, name, original_name, mime_type, size_bytes, row_count, column_count, storage_path)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(&file_id)
    .bind(&user_id)
    .bind(&file_name)
    .bind(sanitize_filename(&original_name))
    .bind(&mime_type)
    .bind(body.len() as i64)
    .bind(row_count)
    .bind(column_count)
    .bind(&storage_path)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        // Clean up file if database insert fails
        let _ = std::fs::remove_file(&file_path);
        ApiError::internal(format!("Failed to save file metadata: {}", e))
    })?;

    log::info!("File uploaded: {} ({} bytes) by user {}", record.id, record.size_bytes, user_id);

    Ok(HttpResponse::Created().json(FileMetadata::from(record)))
}

/// List files for current user
///
/// GET /api/files
async fn list_files(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    query: web::Query<ListFilesQuery>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID"))?;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * limit;

    // Get total count
    let (total,): (i64,) = if let Some(ref search) = query.search {
        sqlx::query_as(
            "SELECT COUNT(*) FROM files WHERE user_id = $1 AND (original_name ILIKE $2 OR name ILIKE $2)"
        )
        .bind(&user_id)
        .bind(format!("%{}%", search))
        .fetch_one(pool.get_ref())
        .await
    } else {
        sqlx::query_as("SELECT COUNT(*) FROM files WHERE user_id = $1")
            .bind(&user_id)
            .fetch_one(pool.get_ref())
            .await
    }
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    // Get files
    let files: Vec<FileRecord> = if let Some(ref search) = query.search {
        sqlx::query_as(
            r#"
            SELECT * FROM files 
            WHERE user_id = $1 AND (original_name ILIKE $2 OR name ILIKE $2)
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            "#
        )
        .bind(&user_id)
        .bind(format!("%{}%", search))
        .bind(limit)
        .bind(offset)
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query_as(
            r#"
            SELECT * FROM files 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(&user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool.get_ref())
        .await
    }
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let file_metadata: Vec<FileMetadata> = files.into_iter().map(FileMetadata::from).collect();

    Ok(HttpResponse::Ok().json(json!({
        "files": file_metadata,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total as f64 / limit as f64).ceil() as i64
    })))
}

/// Get file by ID (download)
///
/// GET /api/files/{id}
async fn get_file(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID"))?;

    let file_id = path.into_inner();

    // Get file record and verify ownership
    let record: Option<FileRecord> = sqlx::query_as(
        "SELECT * FROM files WHERE id = $1 AND user_id = $2"
    )
    .bind(&file_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let record = record.ok_or_else(|| ApiError::not_found("File not found"))?;

    // Read file from disk
    let contents = fs::read(&record.storage_path).await
        .map_err(|_| ApiError::not_found("File data not found"))?;

    Ok(HttpResponse::Ok()
        .content_type(record.mime_type)
        .insert_header(("Content-Disposition", format!("attachment; filename=\"{}\"", record.original_name)))
        .body(contents))
}

/// Delete file by ID
///
/// DELETE /api/files/{id}
async fn delete_file(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID"))?;

    let file_id = path.into_inner();

    // Get file record and verify ownership
    let record: Option<FileRecord> = sqlx::query_as(
        "SELECT * FROM files WHERE id = $1 AND user_id = $2"
    )
    .bind(&file_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let record = record.ok_or_else(|| ApiError::not_found("File not found"))?;

    // Delete from database first
    sqlx::query("DELETE FROM files WHERE id = $1")
        .bind(&file_id)
        .execute(pool.get_ref())
        .await
        .map_err(|e| ApiError::internal(format!("Failed to delete file record: {}", e)))?;

    // Delete file from disk (don't fail if file doesn't exist)
    let _ = fs::remove_file(&record.storage_path).await;

    log::info!("File deleted: {} by user {}", file_id, user_id);

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "File deleted successfully"
    })))
}

/// Get file metadata by ID
///
/// GET /api/files/{id}/metadata
async fn get_file_metadata(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::unauthorized("Invalid user ID"))?;

    let file_id = path.into_inner();

    // Get file record and verify ownership
    let record: Option<FileRecord> = sqlx::query_as(
        "SELECT * FROM files WHERE id = $1 AND user_id = $2"
    )
    .bind(&file_id)
    .bind(&user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::internal(format!("Database error: {}", e)))?;

    let record = record.ok_or_else(|| ApiError::not_found("File not found"))?;

    Ok(HttpResponse::Ok().json(FileMetadata::from(record)))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn get_upload_dir() -> ApiResult<PathBuf> {
    let dir = std::env::var("UPLOAD_DIR")
        .unwrap_or_else(|_| "./uploads".to_string());
    Ok(PathBuf::from(dir))
}

fn extract_filename(content_disposition: &str) -> Option<String> {
    // Parse Content-Disposition header for filename
    // Format: attachment; filename="example.csv"
    content_disposition
        .split(';')
        .find_map(|part| {
            let part = part.trim();
            if part.starts_with("filename=") {
                let name = part.trim_start_matches("filename=");
                Some(name.trim_matches('"').to_string())
            } else {
                None
            }
        })
}

fn sanitize_filename(name: &str) -> String {
    // Remove path traversal attempts and invalid characters
    name.chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '_' || *c == '-' || *c == ' ')
        .collect::<String>()
        .replace("..", "_")
}

fn get_content_type(extension: &str) -> String {
    match extension.to_lowercase().as_str() {
        "csv" => "text/csv".to_string(),
        "json" => "application/json".to_string(),
        "parquet" => "application/vnd.apache.parquet".to_string(),
        "arrow" => "application/vnd.apache.arrow.file".to_string(),
        _ => "application/octet-stream".to_string(),
    }
}

/// Analyze file to extract row and column counts
async fn analyze_file(data: &[u8], extension: &str) -> (Option<i32>, Option<i32>) {
    match extension {
        "csv" => analyze_csv(data),
        "json" => analyze_json(data),
        _ => (None, None),
    }
}

fn analyze_csv(data: &[u8]) -> (Option<i32>, Option<i32>) {
    let content = match std::str::from_utf8(data) {
        Ok(s) => s,
        Err(_) => return (None, None),
    };

    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return (None, None);
    }

    // Count columns from header
    let column_count = lines[0].split(',').count() as i32;
    
    // Row count (excluding header)
    let row_count = (lines.len().saturating_sub(1)) as i32;

    (Some(row_count), Some(column_count))
}

fn analyze_json(data: &[u8]) -> (Option<i32>, Option<i32>) {
    let content = match std::str::from_utf8(data) {
        Ok(s) => s,
        Err(_) => return (None, None),
    };

    let json: serde_json::Value = match serde_json::from_str(content) {
        Ok(v) => v,
        Err(_) => return (None, None),
    };

    if let Some(array) = json.as_array() {
        let row_count = array.len() as i32;
        let column_count = array
            .first()
            .and_then(|obj| obj.as_object())
            .map(|obj| obj.len() as i32);
        
        (Some(row_count), column_count)
    } else {
        (None, None)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("test.csv"), "test.csv");
        assert_eq!(sanitize_filename("test file.csv"), "test file.csv");
        assert_eq!(sanitize_filename("test..csv"), "test_csv");
        assert_eq!(sanitize_filename("../etc/passwd"), "_etcpasswd");
    }

    #[test]
    fn test_extract_filename() {
        assert_eq!(
            extract_filename("attachment; filename=\"test.csv\""),
            Some("test.csv".to_string())
        );
        assert_eq!(
            extract_filename("attachment; filename=test.csv"),
            Some("test.csv".to_string())
        );
        assert_eq!(extract_filename("attachment"), None);
    }

    #[test]
    fn test_get_content_type() {
        assert_eq!(get_content_type("csv"), "text/csv");
        assert_eq!(get_content_type("json"), "application/json");
        assert_eq!(get_content_type("parquet"), "application/vnd.apache.parquet");
        assert_eq!(get_content_type("unknown"), "application/octet-stream");
    }

    #[test]
    fn test_analyze_csv() {
        let csv_data = b"name,age,city\nAlice,30,NYC\nBob,25,LA\n";
        let (rows, cols) = analyze_csv(csv_data);
        assert_eq!(rows, Some(2));
        assert_eq!(cols, Some(3));
    }

    #[test]
    fn test_analyze_json() {
        let json_data = b"[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25}]";
        let (rows, cols) = analyze_json(json_data);
        assert_eq!(rows, Some(2));
        assert_eq!(cols, Some(2));
    }
}
