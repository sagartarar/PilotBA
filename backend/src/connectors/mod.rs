// Data connectors for various sources
pub mod csv;
pub mod database;
pub mod parquet;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataSource {
    Csv { path: String },
    Parquet { path: String },
    Postgres { connection_string: String },
    MySQL { connection_string: String },
}


