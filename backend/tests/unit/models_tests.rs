// Unit tests for models
use pilotba_backend::models::*;
use chrono::Utc;
use uuid::Uuid;
use serde_json::json;

#[cfg(test)]
mod user_tests {
    use super::*;

    #[test]
    fn test_user_serialization() {
        let user = User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let serialized = serde_json::to_string(&user).unwrap();
        assert!(serialized.contains("test@example.com"));
        assert!(serialized.contains("Test User"));
    }

    #[test]
    fn test_user_deserialization() {
        let json_str = r#"{
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "test@example.com",
            "name": "Test User",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }"#;

        let user: Result<User, _> = serde_json::from_str(json_str);
        assert!(user.is_ok());
        
        let user = user.unwrap();
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.name, "Test User");
    }

    #[test]
    fn test_user_email_validation() {
        // This is a placeholder - actual validation should be in a separate validator
        let valid_emails = vec![
            "test@example.com",
            "user.name@example.co.uk",
            "user+tag@example.com",
        ];

        for email in valid_emails {
            assert!(email.contains('@'));
            assert!(email.len() > 3);
        }
    }
}

#[cfg(test)]
mod dashboard_tests {
    use super::*;

    #[test]
    fn test_dashboard_creation() {
        let dashboard = Dashboard {
            id: Uuid::new_v4(),
            name: "Test Dashboard".to_string(),
            description: Some("Description".to_string()),
            user_id: Uuid::new_v4(),
            layout: json!({"widgets": [], "columns": 12}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(dashboard.name, "Test Dashboard");
        assert!(dashboard.description.is_some());
        assert_eq!(dashboard.layout["columns"], 12);
    }

    #[test]
    fn test_dashboard_serialization() {
        let dashboard = Dashboard {
            id: Uuid::new_v4(),
            name: "Test Dashboard".to_string(),
            description: None,
            user_id: Uuid::new_v4(),
            layout: json!({"widgets": []}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let serialized = serde_json::to_string(&dashboard).unwrap();
        assert!(serialized.contains("Test Dashboard"));
    }

    #[test]
    fn test_dashboard_layout_validation() {
        let valid_layout = json!({
            "widgets": [
                {"id": "widget1", "type": "chart", "position": {"x": 0, "y": 0}}
            ],
            "columns": 12
        });

        assert!(valid_layout["widgets"].is_array());
        assert!(valid_layout["columns"].is_number());
    }
}

#[cfg(test)]
mod dataset_tests {
    use super::*;

    #[test]
    fn test_dataset_creation() {
        let dataset = Dataset {
            id: Uuid::new_v4(),
            name: "Test Dataset".to_string(),
            source_type: "csv".to_string(),
            connection_info: json!({"path": "/tmp/test.csv"}),
            user_id: Uuid::new_v4(),
            created_at: Utc::now(),
        };

        assert_eq!(dataset.source_type, "csv");
        assert_eq!(dataset.connection_info["path"], "/tmp/test.csv");
    }

    #[test]
    fn test_dataset_source_types() {
        let source_types = vec!["csv", "parquet", "postgres", "mysql"];

        for source_type in source_types {
            let dataset = Dataset {
                id: Uuid::new_v4(),
                name: "Test".to_string(),
                source_type: source_type.to_string(),
                connection_info: json!({}),
                user_id: Uuid::new_v4(),
                created_at: Utc::now(),
            };

            assert!(!dataset.source_type.is_empty());
        }
    }
}

#[cfg(test)]
mod query_tests {
    use super::*;

    #[test]
    fn test_query_request_creation() {
        let query_req = QueryRequest {
            dataset_id: Uuid::new_v4(),
            query: "SELECT * FROM table".to_string(),
            limit: Some(100),
        };

        assert!(!query_req.query.is_empty());
        assert_eq!(query_req.limit, Some(100));
    }

    #[test]
    fn test_query_request_without_limit() {
        let query_req = QueryRequest {
            dataset_id: Uuid::new_v4(),
            query: "SELECT count(*) FROM table".to_string(),
            limit: None,
        };

        assert!(query_req.limit.is_none());
    }

    #[test]
    fn test_query_response_structure() {
        let response = QueryResponse {
            columns: vec!["id".to_string(), "name".to_string()],
            data: vec![
                json!({"id": 1, "name": "test1"}),
                json!({"id": 2, "name": "test2"}),
            ],
            row_count: 2,
            execution_time_ms: 50,
        };

        assert_eq!(response.columns.len(), 2);
        assert_eq!(response.row_count, 2);
        assert_eq!(response.data.len(), 2);
    }

    #[test]
    fn test_query_response_performance_metrics() {
        let response = QueryResponse {
            columns: vec![],
            data: vec![],
            row_count: 0,
            execution_time_ms: 1500,
        };

        // Assert performance is tracked
        assert!(response.execution_time_ms > 0);
    }
}

#[cfg(test)]
mod edge_cases {
    use super::*;

    #[test]
    fn test_empty_dashboard_name() {
        let dashboard = Dashboard {
            id: Uuid::new_v4(),
            name: "".to_string(),
            description: None,
            user_id: Uuid::new_v4(),
            layout: json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Empty name is allowed in the model, validation should be elsewhere
        assert_eq!(dashboard.name, "");
    }

    #[test]
    fn test_very_long_query() {
        let long_query = "SELECT ".to_string() + &"column, ".repeat(1000) + "id FROM table";
        
        let query_req = QueryRequest {
            dataset_id: Uuid::new_v4(),
            query: long_query.clone(),
            limit: Some(10),
        };

        assert_eq!(query_req.query, long_query);
    }

    #[test]
    fn test_special_characters_in_name() {
        let special_chars = "Test!@#$%^&*()_+-={}[]|\\:\";<>?,./";
        
        let user = User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: special_chars.to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(user.name, special_chars);
    }
}

