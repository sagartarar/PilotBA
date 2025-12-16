// Performance benchmarks for query engine
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use serde_json::json;

fn bench_json_serialization(c: &mut Criterion) {
    let data = json!({
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "columns": ["id", "name", "value"],
        "data": vec![
            json!({"id": 1, "name": "test1", "value": 100}),
            json!({"id": 2, "name": "test2", "value": 200}),
        ],
        "row_count": 2
    });

    c.bench_function("json_serialization", |b| {
        b.iter(|| {
            let serialized = serde_json::to_string(black_box(&data)).unwrap();
            black_box(serialized);
        })
    });
}

fn bench_json_deserialization(c: &mut Criterion) {
    let json_str = r#"{
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "columns": ["id", "name", "value"],
        "data": [
            {"id": 1, "name": "test1", "value": 100},
            {"id": 2, "name": "test2", "value": 200}
        ],
        "row_count": 2
    }"#;

    c.bench_function("json_deserialization", |b| {
        b.iter(|| {
            let deserialized: serde_json::Value =
                serde_json::from_str(black_box(json_str)).unwrap();
            black_box(deserialized);
        })
    });
}

fn bench_query_parsing(c: &mut Criterion) {
    let queries = vec![
        "SELECT * FROM users",
        "SELECT id, name FROM users WHERE age > 18",
        "SELECT COUNT(*) FROM orders GROUP BY user_id",
        "SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id",
    ];

    let mut group = c.benchmark_group("query_parsing");

    for (i, query) in queries.iter().enumerate() {
        group.bench_with_input(BenchmarkId::from_parameter(i), query, |b, q| {
            b.iter(|| {
                // Simulate query parsing
                let tokens: Vec<&str> = black_box(q).split_whitespace().collect();
                black_box(tokens);
            });
        });
    }

    group.finish();
}

fn bench_data_transformation(c: &mut Criterion) {
    let input_data: Vec<serde_json::Value> = (0..1000)
        .map(|i| json!({"id": i, "name": format!("test{}", i), "value": i * 10}))
        .collect();

    c.bench_function("data_transformation_1000_rows", |b| {
        b.iter(|| {
            let transformed: Vec<serde_json::Value> = black_box(&input_data)
                .iter()
                .map(|row| {
                    json!({
                        "id": row["id"],
                        "display": format!("{} - {}", row["name"], row["value"])
                    })
                })
                .collect();
            black_box(transformed);
        })
    });
}

fn bench_large_dataset_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("large_dataset");

    for size in [100, 1000, 10000].iter() {
        let data: Vec<i32> = (0..*size).collect();

        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, _| {
            b.iter(|| {
                let sum: i32 = black_box(&data).iter().sum();
                black_box(sum);
            });
        });
    }

    group.finish();
}

criterion_group!(
    benches,
    bench_json_serialization,
    bench_json_deserialization,
    bench_query_parsing,
    bench_data_transformation,
    bench_large_dataset_operations
);

criterion_main!(benches);

