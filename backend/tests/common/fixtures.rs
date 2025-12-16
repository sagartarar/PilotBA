// Test fixtures and mock data generators
use chrono::Utc;
use fake::{Fake, Faker};
use pilotba_backend::models::*;
use uuid::Uuid;

/// Generate a test user
pub fn create_test_user() -> User {
    User {
        id: Uuid::new_v4(),
        email: format!("test{}@example.com", Uuid::new_v4()),
        name: Faker.fake::<String>(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

/// Generate a test dashboard
pub fn create_test_dashboard(user_id: Uuid) -> Dashboard {
    Dashboard {
        id: Uuid::new_v4(),
        name: format!("Test Dashboard {}", Uuid::new_v4()),
        description: Some("Test dashboard description".to_string()),
        user_id,
        layout: serde_json::json!({
            "widgets": [],
            "columns": 12
        }),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

/// Generate a test dataset
pub fn create_test_dataset(user_id: Uuid) -> Dataset {
    Dataset {
        id: Uuid::new_v4(),
        name: format!("Test Dataset {}", Uuid::new_v4()),
        source_type: "csv".to_string(),
        connection_info: serde_json::json!({
            "path": "/tmp/test.csv"
        }),
        user_id,
        created_at: Utc::now(),
    }
}

/// Generate a test query request
pub fn create_test_query_request(dataset_id: Uuid) -> QueryRequest {
    QueryRequest {
        dataset_id,
        query: "SELECT * FROM test LIMIT 10".to_string(),
        limit: Some(10),
    }
}

/// Generate a test query response
pub fn create_test_query_response() -> QueryResponse {
    QueryResponse {
        columns: vec!["id".to_string(), "name".to_string(), "value".to_string()],
        data: vec![
            serde_json::json!({"id": 1, "name": "test1", "value": 100}),
            serde_json::json!({"id": 2, "name": "test2", "value": 200}),
        ],
        row_count: 2,
        execution_time_ms: 45,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_test_user() {
        let user = create_test_user();
        assert!(!user.email.is_empty());
        assert!(!user.name.is_empty());
    }

    #[test]
    fn test_create_test_dashboard() {
        let user_id = Uuid::new_v4();
        let dashboard = create_test_dashboard(user_id);
        assert_eq!(dashboard.user_id, user_id);
        assert!(!dashboard.name.is_empty());
    }

    #[test]
    fn test_create_test_dataset() {
        let user_id = Uuid::new_v4();
        let dataset = create_test_dataset(user_id);
        assert_eq!(dataset.user_id, user_id);
        assert_eq!(dataset.source_type, "csv");
    }
}

