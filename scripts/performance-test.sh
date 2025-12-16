#!/bin/bash
# Performance testing script for PilotBA

set -e

echo "⚡ Running Performance Tests for PilotBA"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
DURATION="${DURATION:-60}"
VUS="${VUS:-50}"

# Function to check if service is running
check_service() {
    local url=$1
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    return 1
}

# 1. Backend Benchmarks
echo -e "\n${YELLOW}[1/4] Running Backend Benchmarks (Rust Criterion)...${NC}"
if [ -d "backend" ]; then
    cd backend
    cargo bench --bench query_benchmarks
    cd ..
    echo -e "${GREEN}✓ Backend benchmarks complete${NC}"
else
    echo "Backend directory not found"
fi

# 2. API Load Testing
echo -e "\n${YELLOW}[2/4] Running API Load Tests...${NC}"

# Check if backend is running
echo "Checking if backend is running at $BACKEND_URL..."
if check_service "$BACKEND_URL/api/health"; then
    echo -e "${GREEN}Backend is running${NC}"
    
    # Use k6 if available
    if command -v k6 >/dev/null 2>&1; then
        cat > /tmp/k6-load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  const baseURL = __ENV.BACKEND_URL || 'http://localhost:8080';
  
  // Test health endpoint
  let res = http.get(`${baseURL}/api/health`);
  const result = check(res, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!result);
  
  sleep(1);
  
  // Test status endpoint
  res = http.get(`${baseURL}/api/status`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
EOF
        
        BACKEND_URL=$BACKEND_URL k6 run /tmp/k6-load-test.js
        rm /tmp/k6-load-test.js
        echo -e "${GREEN}✓ Load tests complete${NC}"
    else
        echo -e "${YELLOW}k6 not installed. Using curl for basic testing...${NC}"
        
        # Basic performance test with curl
        echo "Running 100 requests to health endpoint..."
        time for i in {1..100}; do
            curl -s "$BACKEND_URL/api/health" > /dev/null
        done
        echo -e "${GREEN}✓ Basic load test complete${NC}"
    fi
else
    echo -e "${YELLOW}Backend not running at $BACKEND_URL. Skipping load tests.${NC}"
    echo "Start the backend with: cd backend && cargo run"
fi

# 3. Frontend Bundle Analysis
echo -e "\n${YELLOW}[3/4] Analyzing Frontend Bundle Size...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    
    # Build the frontend
    echo "Building frontend..."
    npm run build
    
    # Analyze bundle size
    echo -e "\n${BLUE}Bundle sizes:${NC}"
    du -sh dist/* | sort -rh
    
    # Check if bundle is reasonable size (< 5MB)
    total_size=$(du -sb dist | cut -f1)
    size_mb=$((total_size / 1024 / 1024))
    
    echo -e "\nTotal bundle size: ${size_mb}MB"
    
    if [ $size_mb -lt 5 ]; then
        echo -e "${GREEN}✓ Bundle size is acceptable${NC}"
    else
        echo -e "${YELLOW}⚠ Bundle size is large. Consider optimization.${NC}"
    fi
    
    cd ..
else
    echo "Frontend directory not found"
fi

# 4. Lighthouse Performance Audit
echo -e "\n${YELLOW}[4/4] Running Lighthouse Performance Audit...${NC}"

if check_service "$FRONTEND_URL"; then
    echo -e "${GREEN}Frontend is running${NC}"
    
    if command -v lighthouse >/dev/null 2>&1; then
        lighthouse "$FRONTEND_URL" \
            --output=html \
            --output=json \
            --output-path=./lighthouse-report \
            --chrome-flags="--headless" \
            --only-categories=performance,accessibility,best-practices
        
        echo -e "${GREEN}✓ Lighthouse report generated: ./lighthouse-report.html${NC}"
    else
        echo -e "${YELLOW}Lighthouse not installed. Install with: npm install -g lighthouse${NC}"
    fi
else
    echo -e "${YELLOW}Frontend not running at $FRONTEND_URL. Skipping Lighthouse audit.${NC}"
    echo "Start the frontend with: cd frontend && npm run dev"
fi

echo -e "\n${GREEN}✅ Performance testing complete!${NC}"
echo ""
echo "Performance Tips:"
echo "1. Review Lighthouse report for optimization suggestions"
echo "2. Monitor bundle size and use code splitting"
echo "3. Optimize database queries for < 100ms response time"
echo "4. Use Redis caching for frequently accessed data"
echo "5. Consider implementing pagination for large datasets"

