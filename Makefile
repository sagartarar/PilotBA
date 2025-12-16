.PHONY: help install dev-frontend dev-backend build test docker-up docker-down clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm install
	cd frontend && npm install
	@echo "✓ Dependencies installed"

dev-frontend: ## Start frontend development server
	cd frontend && npm run dev

dev-backend: ## Start backend development server
	cd backend && cargo run

build-frontend: ## Build frontend for production
	cd frontend && npm run build

build-backend: ## Build backend for production
	cd backend && cargo build --release

docker-up: ## Start all Docker services
	docker-compose up -d
	@echo "✓ Services started:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo "  - MinIO: localhost:9000 (console: localhost:9001)"

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker service logs
	docker-compose logs -f

test-frontend: ## Run frontend tests
	cd frontend && npm test

test-backend: ## Run backend tests
	cd backend && cargo test

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

clean: ## Clean build artifacts
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/target
	rm -rf node_modules
	@echo "✓ Cleaned build artifacts"

setup: install docker-up ## Complete setup (install + start services)
	@echo "✓ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Terminal 1: make dev-backend"
	@echo "  2. Terminal 2: make dev-frontend"
	@echo "  3. Visit http://localhost:3000"

