//! File Management Routes
//!
//! Provides file upload, download, list, and delete endpoints.

use actix_web::{web, HttpRequest, HttpResponse};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::PathBuf;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

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

/// File metadata response
#[derive(Debug, Serialize, Clone)]
pub struct FileMetadata {
    pub id: String,
    pub name: String,
    pub original_name: String,
    pub size: u64,
    pub content_type: String,
    pub created_at: String,
    pub owner_id: String,
}

/// Upload file
///
/// POST /api/files
async fn upload_file(
    req: HttpRequest,
    mut payload: actix_web::web::Payload,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

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
    let file_id = Uuid::new_v4().to_string();
    let file_name = format!("{}.{}", file_id, extension);
    let file_path = upload_dir.join(&file_name);

    // Write file
    let mut file = fs::File::create(&file_path).await?;
    file.write_all(&body).await?;
    file.sync_all().await?;

    // Create metadata
    let metadata = FileMetadata {
        id: file_id.clone(),
        name: file_name,
        original_name: sanitize_filename(&original_name),
        size: body.len() as u64,
        content_type: get_content_type(&extension),
        created_at: chrono::Utc::now().to_rfc3339(),
        owner_id: claims.sub,
    };

    // TODO: Store metadata in database

    log::info!("File uploaded: {} ({} bytes)", metadata.id, metadata.size);

    Ok(HttpResponse::Created().json(metadata))
}

/// List files for current user
///
/// GET /api/files
async fn list_files(req: HttpRequest) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let upload_dir = get_upload_dir()?;

    // TODO: Replace with database query filtered by owner
    let mut files = Vec::new();

    if let Ok(mut entries) = fs::read_dir(&upload_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            if let Ok(metadata) = entry.metadata().await {
                if metadata.is_file() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    let id = name.split('.').next().unwrap_or(&name).to_string();
                    
                    files.push(FileMetadata {
                        id: id.clone(),
                        name: name.clone(),
                        original_name: name,
                        size: metadata.len(),
                        content_type: "application/octet-stream".to_string(),
                        created_at: metadata
                            .created()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
                            .flatten()
                            .map(|dt| dt.to_rfc3339())
                            .unwrap_or_default(),
                        owner_id: claims.sub.clone(),
                    });
                }
            }
        }
    }

    Ok(HttpResponse::Ok().json(json!({
        "files": files,
        "total": files.len()
    })))
}

/// Get file by ID
///
/// GET /api/files/{id}
async fn get_file(
    req: HttpRequest,
    path: web::Path<String>,
) -> ApiResult<HttpResponse> {
    let _claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let file_id = path.into_inner();
    
    // Validate UUID format to prevent path traversal
    if Uuid::parse_str(&file_id).is_err() {
        return Err(ApiError::bad_request("Invalid file ID format"));
    }

    let upload_dir = get_upload_dir()?;

    // Find file with matching ID
    let file_path = find_file_by_id(&upload_dir, &file_id).await?;

    // Read file
    let contents = fs::read(&file_path).await?;

    // Get content type from extension
    let extension = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin");
    let content_type = get_content_type(extension);

    Ok(HttpResponse::Ok()
        .content_type(content_type)
        .body(contents))
}

/// Delete file by ID
///
/// DELETE /api/files/{id}
async fn delete_file(
    req: HttpRequest,
    path: web::Path<String>,
) -> ApiResult<HttpResponse> {
    let _claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let file_id = path.into_inner();
    
    // Validate UUID format
    if Uuid::parse_str(&file_id).is_err() {
        return Err(ApiError::bad_request("Invalid file ID format"));
    }

    let upload_dir = get_upload_dir()?;
    let file_path = find_file_by_id(&upload_dir, &file_id).await?;

    // Delete file
    fs::remove_file(&file_path).await?;

    log::info!("File deleted: {}", file_id);

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
    path: web::Path<String>,
) -> ApiResult<HttpResponse> {
    let claims = get_claims(&req)
        .ok_or_else(|| ApiError::unauthorized("Not authenticated"))?;

    let file_id = path.into_inner();
    
    // Validate UUID format
    if Uuid::parse_str(&file_id).is_err() {
        return Err(ApiError::bad_request("Invalid file ID format"));
    }

    let upload_dir = get_upload_dir()?;
    let file_path = find_file_by_id(&upload_dir, &file_id).await?;

    let metadata = fs::metadata(&file_path).await?;
    let name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let extension = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin");

    Ok(HttpResponse::Ok().json(FileMetadata {
        id: file_id,
        name: name.clone(),
        original_name: name,
        size: metadata.len(),
        content_type: get_content_type(extension),
        created_at: metadata
            .created()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
            .flatten()
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
        owner_id: claims.sub,
    }))
}

// Helper functions

fn get_upload_dir() -> ApiResult<PathBuf> {
    let dir = std::env::var("UPLOAD_DIR")
        .unwrap_or_else(|_| "./uploads".to_string());
    Ok(PathBuf::from(dir))
}

async fn find_file_by_id(upload_dir: &PathBuf, file_id: &str) -> ApiResult<PathBuf> {
    let mut entries = fs::read_dir(upload_dir).await?;
    
    while let Ok(Some(entry)) = entries.next_entry().await {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with(file_id) {
            return Ok(entry.path());
        }
    }
    
    Err(ApiError::not_found(format!("File not found: {}", file_id)))
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
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '_' || *c == '-')
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("test.csv"), "test.csv");
        // Path traversal attempts result in underscores for .. sequences
        assert_eq!(sanitize_filename("../../../etc/passwd"), "___etcpasswd");
        assert_eq!(sanitize_filename("test file.csv"), "testfile.csv");
        assert_eq!(sanitize_filename("test..csv"), "test_csv");
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
}

