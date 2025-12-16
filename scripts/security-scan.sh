#!/bin/bash
# Security scanning script for PilotBA

set -e

echo "🔒 Running Security Scans for PilotBA"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Rust Security Audit
echo -e "\n${YELLOW}[1/6] Running Rust Security Audit...${NC}"
if command_exists cargo; then
    cd backend
    if ! command_exists cargo-audit; then
        echo "Installing cargo-audit..."
        cargo install cargo-audit
    fi
    cargo audit || echo -e "${RED}Found vulnerabilities in Rust dependencies${NC}"
    cd ..
else
    echo -e "${RED}Cargo not found, skipping Rust audit${NC}"
fi

# 2. Frontend Dependency Audit
echo -e "\n${YELLOW}[2/6] Running Frontend Dependency Audit...${NC}"
if command_exists npm; then
    cd frontend
    npm audit --audit-level=moderate || echo -e "${RED}Found vulnerabilities in npm dependencies${NC}"
    cd ..
else
    echo -e "${RED}npm not found, skipping frontend audit${NC}"
fi

# 3. Secret Scanning
echo -e "\n${YELLOW}[3/6] Scanning for Secrets...${NC}"
if command_exists git; then
    # Check for common secret patterns
    echo "Checking for potential secrets in codebase..."
    
    # Common patterns
    patterns=(
        "password\s*=\s*['\"].*['\"]"
        "api[_-]?key\s*=\s*['\"].*['\"]"
        "secret\s*=\s*['\"].*['\"]"
        "token\s*=\s*['\"].*['\"]"
        "aws[_-]?access[_-]?key"
        "private[_-]?key"
    )
    
    found_secrets=0
    for pattern in "${patterns[@]}"; do
        if git grep -i -E "$pattern" -- ':!*.md' ':!scripts/' 2>/dev/null; then
            found_secrets=1
        fi
    done
    
    if [ $found_secrets -eq 0 ]; then
        echo -e "${GREEN}No obvious secrets found${NC}"
    else
        echo -e "${RED}Potential secrets detected! Please review.${NC}"
    fi
else
    echo -e "${RED}git not found, skipping secret scan${NC}"
fi

# 4. OWASP Dependency Check
echo -e "\n${YELLOW}[4/6] OWASP Dependency Check...${NC}"
if command_exists dependency-check; then
    dependency-check --project "PilotBA" --scan . --format HTML --out ./security-reports
    echo -e "${GREEN}OWASP report generated in ./security-reports${NC}"
else
    echo -e "${YELLOW}OWASP Dependency-Check not installed. Install from: https://owasp.org/www-project-dependency-check/${NC}"
fi

# 5. Container Security (if Docker is used)
echo -e "\n${YELLOW}[5/6] Container Security Scan...${NC}"
if command_exists docker && [ -f "docker-compose.yml" ]; then
    if command_exists trivy; then
        echo "Scanning Docker images with Trivy..."
        trivy image --severity HIGH,CRITICAL pilotba-backend:latest || true
        trivy image --severity HIGH,CRITICAL pilotba-frontend:latest || true
    else
        echo -e "${YELLOW}Trivy not installed. Install from: https://github.com/aquasecurity/trivy${NC}"
    fi
else
    echo "Docker not available or no docker-compose.yml found"
fi

# 6. Code Quality & Security Linting
echo -e "\n${YELLOW}[6/6] Code Quality & Security Linting...${NC}"

# Rust Clippy (with security lints)
if command_exists cargo; then
    cd backend
    echo "Running Clippy with security lints..."
    cargo clippy -- -W clippy::suspicious -W clippy::complexity -W clippy::perf || true
    cd ..
fi

# ESLint (frontend)
if command_exists npm; then
    cd frontend
    echo "Running ESLint..."
    npm run lint || true
    cd ..
fi

echo -e "\n${GREEN}✅ Security scan complete!${NC}"
echo "Review the output above for any security issues."
echo ""
echo "Recommended actions:"
echo "1. Fix all HIGH and CRITICAL vulnerabilities"
echo "2. Update dependencies regularly"
echo "3. Review and rotate any exposed secrets"
echo "4. Run this script before each release"

