// Common test utilities and helpers
pub mod fixtures;

use actix_web::test;
use serde_json::Value;

/// Test configuration for integration tests
pub struct TestConfig {
    pub database_url: String,
    pub redis_url: String,
}

impl Default for TestConfig {
    fn default() -> Self {
        Self {
            database_url: std::env::var("TEST_DATABASE_URL")
                .unwrap_or_else(|_| "postgres://test:test@localhost:5432/pilotba_test".to_string()),
            redis_url: std::env::var("TEST_REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
        }
    }
}

/// Initialize test environment
pub async fn setup_test_env() -> TestConfig {
    dotenv::dotenv().ok();
    env_logger::builder()
        .is_test(true)
        .filter_level(log::LevelFilter::Debug)
        .try_init()
        .ok();
    
    TestConfig::default()
}

/// Clean up test data
pub async fn teardown_test_env(_config: &TestConfig) {
    // Cleanup logic here
}

/// Helper to make test requests
pub async fn make_request(
    app: &mut test::TestService,
    method: &str,
    path: &str,
    body: Option<Value>,
) -> test::TestResponse {
    let req = match method {
        "GET" => test::TestRequest::get().uri(path),
        "POST" => {
            let mut req = test::TestRequest::post().uri(path);
            if let Some(b) = body {
                req = req.set_json(b);
            }
            req
        }
        "PUT" => {
            let mut req = test::TestRequest::put().uri(path);
            if let Some(b) = body {
                req = req.set_json(b);
            }
            req
        }
        "DELETE" => test::TestRequest::delete().uri(path),
        _ => panic!("Unsupported HTTP method: {}", method),
    };
    
    app.call(req.to_request()).await.unwrap()
}

/// Assert JSON response contains expected fields
pub fn assert_json_contains(response: &Value, expected: &Value) {
    match (response, expected) {
        (Value::Object(resp_map), Value::Object(exp_map)) => {
            for (key, exp_value) in exp_map {
                let resp_value = resp_map
                    .get(key)
                    .unwrap_or_else(|| panic!("Expected key '{}' not found in response", key));
                assert_json_contains(resp_value, exp_value);
            }
        }
        (Value::Array(resp_arr), Value::Array(exp_arr)) => {
            assert_eq!(
                resp_arr.len(),
                exp_arr.len(),
                "Array lengths don't match"
            );
            for (resp_item, exp_item) in resp_arr.iter().zip(exp_arr.iter()) {
                assert_json_contains(resp_item, exp_item);
            }
        }
        _ => assert_eq!(response, expected, "Values don't match"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_setup_config() {
        let config = setup_test_env().await;
        assert!(!config.database_url.is_empty());
        assert!(!config.redis_url.is_empty());
    }

    #[test]
    fn test_assert_json_contains() {
        let response = serde_json::json!({
            "status": "ok",
            "data": {
                "id": 1,
                "name": "test"
            }
        });
        
        let expected = serde_json::json!({
            "status": "ok"
        });
        
        assert_json_contains(&response, &expected);
    }
}

