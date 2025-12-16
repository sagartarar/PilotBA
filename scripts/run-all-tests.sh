#!/bin/bash
# Master test runner script

set -e

echo "🧪 PilotBA - Complete Test Suite"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track failures
FAILED_TESTS=()

# Function to run test and track failure
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Running: $test_name${NC}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        FAILED_TESTS+=("$test_name")
    fi
}

# 1. Backend Tests
run_test "Backend Format Check" "cd backend && cargo fmt -- --check && cd .."
run_test "Backend Clippy" "cd backend && cargo clippy --all-targets -- -D warnings && cd .."
run_test "Backend Unit Tests" "cd backend && cargo test --lib && cd .."
run_test "Backend Integration Tests" "cd backend && cargo test --test '*' -- --test-threads=1 && cd .."

# 2. Frontend Tests
run_test "Frontend Type Check" "cd frontend && npm run type-check && cd .."
run_test "Frontend Lint" "cd frontend && npm run lint && cd .."
run_test "Frontend Unit Tests" "cd frontend && npm test -- --run && cd .."
run_test "Frontend Coverage" "cd frontend && npm run test:coverage -- --run && cd .."

# 3. E2E Tests (only if services are running)
if curl -s http://localhost:8080/api/health > /dev/null 2>&1 && \
   curl -s http://localhost:3000 > /dev/null 2>&1; then
    run_test "E2E Tests" "npx playwright test"
else
    echo -e "\n${YELLOW}Skipping E2E tests - services not running${NC}"
    echo "To run E2E tests, start backend and frontend first"
fi

# 4. Security Scans (optional, comment out if not needed)
# run_test "Security Scan" "bash scripts/security-scan.sh"

# Summary
echo ""
echo "======================================="
echo "Test Suite Summary"
echo "======================================="

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    exit 1
fi

