# 🗺️ PilotBA Complete Roadmap: Local → Cloud → Enterprise

**Document Owner:** Lead Architect  
**Created:** December 23, 2025  
**Last Updated:** December 23, 2025  
**Status:** Strategic Planning Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 1: Local Hosting](#phase-1-local-hosting)
3. [Phase 2: Cloud Migration Strategy](#phase-2-cloud-migration-strategy)
4. [Phase 3: User Management System](#phase-3-user-management-system)
5. [Phase 4: Identity Provider Integration](#phase-4-identity-provider-integration)
6. [Competitive Analysis: BI Tools](#competitive-analysis-bi-tools)
7. [Feature Roadmap](#feature-roadmap)
8. [Timeline & Milestones](#timeline--milestones)

---

## Executive Summary

This document outlines the complete roadmap for PilotBA from a locally-hosted MVP to a fully enterprise-ready, cloud-native business intelligence platform capable of competing with Tableau, Power BI, and Looker.

### Vision

**PilotBA** will become a high-performance, cost-effective alternative to commercial BI tools, offering:
- **10M+ data points** at 60 FPS (competitors max at 10K-100K)
- **Zero licensing costs** (vs. $70-150/user/month for competitors)
- **Self-hosted option** with full data privacy
- **Cloud-native architecture** that scales horizontally
- **Enterprise-grade security** with SSO, RBAC, and MFA

---

## Phase 1: Local Hosting

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL DEPLOYMENT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Nginx     │    │  Frontend   │    │   Backend   │        │
│   │   Reverse   │───▶│   React     │───▶│    Rust     │        │
│   │   Proxy     │    │  :3000      │    │   :8080     │        │
│   └─────────────┘    └─────────────┘    └──────┬──────┘        │
│                                                 │                │
│         ┌───────────────────────────────────────┼────────┐      │
│         │                                       │        │      │
│   ┌─────▼─────┐    ┌─────────────┐    ┌───────▼──────┐  │      │
│   │PostgreSQL │    │    Redis    │    │    MinIO     │  │      │
│   │  :5432    │    │   :6379     │    │  :9000/9001  │  │      │
│   └───────────┘    └─────────────┘    └──────────────┘  │      │
│         │                                                │      │
│         └────────────────────────────────────────────────┘      │
│                        Docker Network                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Local Deployment Requirements

#### Hardware Requirements (Minimum)

| Component | Minimum | Recommended | Production |
|-----------|---------|-------------|------------|
| **CPU** | 4 cores | 8 cores | 16+ cores |
| **RAM** | 8 GB | 16 GB | 32+ GB |
| **Storage** | 50 GB SSD | 200 GB SSD | 500+ GB NVMe |
| **Network** | 100 Mbps | 1 Gbps | 10 Gbps |

#### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| **Docker** | 24+ | Container runtime |
| **Docker Compose** | 2.20+ | Multi-container orchestration |
| **Node.js** | 20 LTS | Frontend build |
| **Rust** | 1.75+ | Backend compilation |
| **PostgreSQL** | 16 | Database |
| **Redis** | 7 | Caching |
| **MinIO** | Latest | Object storage |

### 1.3 Complete Local Setup

#### Step 1: Environment Configuration

Create `.env.local`:
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=pilotba
POSTGRES_USER=pilotba
POSTGRES_PASSWORD=<generate-secure-password>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<generate-secure-password>

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=pilotba
MINIO_SECRET_KEY=<generate-secure-password>
MINIO_BUCKET=pilotba-files

# Backend
JWT_SECRET=<generate-256-bit-secret>
JWT_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=604800
API_PORT=8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

#### Step 2: Docker Compose Configuration

`docker-compose.local.yml`:
```yaml
version: '3.8'

services:
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.local.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - pilotba-network
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_URL=http://localhost:8080/api
    networks:
      - pilotba-network
    restart: unless-stopped

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    networks:
      - pilotba-network
    restart: unless-stopped

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pilotba-network
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pilotba-network
    restart: unless-stopped

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pilotba-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  pilotba-network:
    driver: bridge
```

#### Step 3: Nginx Configuration

`infrastructure/nginx/nginx.local.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # Upstream definitions
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8080;
    }

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # File upload size limit
            client_max_body_size 100M;
        }

        # Auth endpoints (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # Health check
        location /health {
            proxy_pass http://backend/api/health;
        }
    }
}
```

#### Step 4: Deployment Scripts

`scripts/local-deploy.sh`:
```bash
#!/bin/bash
set -euo pipefail

echo "🚀 PilotBA Local Deployment"
echo "=========================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# Load environment
if [ -f .env.local ]; then
    export $(cat .env.local | xargs)
else
    echo "❌ .env.local not found. Copy .env.example to .env.local and configure."
    exit 1
fi

# Build images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.local.yml build

# Start services
echo "🔧 Starting services..."
docker-compose -f docker-compose.local.yml up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.local.yml ps

# Run migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.local.yml exec backend ./migrate

echo ""
echo "✅ PilotBA is running!"
echo "   Frontend: http://localhost"
echo "   API:      http://localhost/api"
echo "   MinIO:    http://localhost:9001"
echo ""
```

### 1.4 Local Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups/pilotba/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker-compose exec -T postgres pg_dump -U pilotba pilotba > "$BACKUP_DIR/postgres.sql"

# Redis backup
docker-compose exec -T redis redis-cli -a $REDIS_PASSWORD BGSAVE

# MinIO backup (sync to local)
docker run --rm -v minio_data:/data -v $BACKUP_DIR:/backup alpine \
    tar czf /backup/minio.tar.gz /data

echo "Backup completed: $BACKUP_DIR"
```

---

## Phase 2: Cloud Migration Strategy

### 2.1 Cloud Provider Comparison

| Feature | AWS | Azure | Google Cloud |
|---------|-----|-------|--------------|
| **Kubernetes** | EKS | AKS | GKE |
| **Database** | RDS PostgreSQL | Azure PostgreSQL | Cloud SQL |
| **Cache** | ElastiCache | Azure Cache | Memorystore |
| **Object Storage** | S3 | Blob Storage | Cloud Storage |
| **CDN** | CloudFront | Azure CDN | Cloud CDN |
| **Identity** | Cognito | Azure AD B2C | Identity Platform |
| **Load Balancer** | ALB/NLB | Azure LB | Cloud LB |
| **Pricing** | Pay-as-you-go | Pay-as-you-go | Pay-as-you-go |
| **Free Tier** | 12 months | 12 months | Always free tier |

### 2.2 Migration Phases

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUD MIGRATION ROADMAP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PHASE 1          PHASE 2          PHASE 3          PHASE 4            │
│   Lift & Shift     Optimize         Scale            Full Cloud         │
│                                                                          │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐       │
│   │ Docker  │      │ Managed │      │ K8s     │      │ Serverless│      │
│   │ on VM   │ ───▶ │ Services│ ───▶ │ Cluster │ ───▶ │ + Edge   │      │
│   └─────────┘      └─────────┘      └─────────┘      └─────────┘       │
│                                                                          │
│   Week 1-2         Week 3-4         Week 5-8         Week 9+            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Phase 2A: Lift & Shift (Weeks 1-2)

**Goal:** Get running in cloud with minimal changes

```terraform
# infrastructure/terraform/aws/main.tf

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "pilotba-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "pilotba"
  }
}

# EC2 Instance for Docker
resource "aws_instance" "pilotba" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.xlarge"
  
  subnet_id                   = module.vpc.public_subnets[0]
  vpc_security_group_ids      = [aws_security_group.pilotba.id]
  associate_public_ip_address = true
  
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
  EOF
  
  tags = {
    Name = "pilotba-server"
  }
}

# Security Group
resource "aws_security_group" "pilotba" {
  name        = "pilotba-sg"
  description = "PilotBA security group"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 2.4 Phase 2B: Managed Services (Weeks 3-4)

**Goal:** Replace self-managed with cloud-managed services

```terraform
# RDS PostgreSQL
resource "aws_db_instance" "pilotba" {
  identifier     = "pilotba-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "pilotba"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.pilotba.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  multi_az               = var.environment == "production"
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"
  
  performance_insights_enabled = true
  
  tags = {
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "pilotba" {
  cluster_id           = "pilotba-cache"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  
  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.pilotba.name
  
  snapshot_retention_limit = 7
  snapshot_window         = "05:00-06:00"
}

# S3 Bucket (replaces MinIO)
resource "aws_s3_bucket" "pilotba" {
  bucket = "pilotba-files-${var.environment}"
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "pilotba" {
  bucket = aws_s3_bucket.pilotba.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pilotba" {
  bucket = aws_s3_bucket.pilotba.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}
```

### 2.5 Phase 2C: Kubernetes Cluster (Weeks 5-8)

**Goal:** Container orchestration for auto-scaling

```terraform
# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  
  cluster_name    = "pilotba-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_public_access = true
  
  eks_managed_node_groups = {
    general = {
      desired_size = 2
      min_size     = 1
      max_size     = 10
      
      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
      
      labels = {
        role = "general"
      }
    }
    
    compute = {
      desired_size = 0
      min_size     = 0
      max_size     = 20
      
      instance_types = ["c6i.xlarge"]
      capacity_type  = "SPOT"
      
      labels = {
        role = "compute"
      }
      
      taints = [{
        key    = "compute"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}
```

**Kubernetes Manifests:**

`infrastructure/k8s/backend-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pilotba-backend
  labels:
    app: pilotba
    component: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pilotba
      component: backend
  template:
    metadata:
      labels:
        app: pilotba
        component: backend
    spec:
      containers:
        - name: backend
          image: pilotba/backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: pilotba-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: pilotba-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: pilotba-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pilotba-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pilotba-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Phase 3: User Management System

### 3.1 User Model Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USER MANAGEMENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│   │    Users    │────▶│   Roles     │────▶│ Permissions │              │
│   └─────────────┘     └─────────────┘     └─────────────┘              │
│          │                   │                                          │
│          │                   │                                          │
│          ▼                   ▼                                          │
│   ┌─────────────┐     ┌─────────────┐                                  │
│   │   Teams     │     │   Scopes    │                                  │
│   │ (Workspaces)│     │ (Resources) │                                  │
│   └─────────────┘     └─────────────┘                                  │
│          │                                                              │
│          ▼                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│   │ Dashboards  │     │  Datasets   │     │   Queries   │              │
│   └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Database Schema

```sql
-- User Management Schema

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL for SSO-only users
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',  -- active, suspended, pending
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'pending'))
);

-- Identity Providers (for SSO)
CREATE TABLE identity_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- oauth2, saml, oidc
    config JSONB NOT NULL,  -- Provider-specific configuration
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_type CHECK (type IN ('oauth2', 'saml', 'oidc'))
);

-- User external identities (link users to SSO providers)
CREATE TABLE user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES identity_providers(id),
    external_id VARCHAR(255) NOT NULL,  -- User ID from provider
    profile_data JSONB,  -- Additional data from provider
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (provider_id, external_id)
);

-- Teams/Workspaces
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team membership
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (team_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- Roles (system-wide and team-specific)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- NULL = system role
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (name, team_id)
);

-- User role assignments
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    
    UNIQUE (user_id, role_id, team_id)
);

-- API Keys for programmatic access
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,  -- Hashed API key
    key_prefix VARCHAR(10) NOT NULL,  -- First few chars for identification
    scopes JSONB NOT NULL DEFAULT '[]',  -- Allowed operations
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_identities_user ON user_identities(user_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_team ON audit_log(team_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

### 3.3 Default Roles & Permissions

```rust
// backend/src/auth/permissions.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Permission {
    // Dashboard permissions
    DashboardCreate,
    DashboardRead,
    DashboardUpdate,
    DashboardDelete,
    DashboardShare,
    
    // Dataset permissions
    DatasetUpload,
    DatasetRead,
    DatasetUpdate,
    DatasetDelete,
    DatasetShare,
    
    // Query permissions
    QueryCreate,
    QueryRead,
    QueryExecute,
    QueryDelete,
    
    // Chart permissions
    ChartCreate,
    ChartRead,
    ChartUpdate,
    ChartDelete,
    ChartExport,
    
    // Team permissions
    TeamManageMembers,
    TeamManageSettings,
    TeamManageRoles,
    TeamViewAuditLog,
    
    // Admin permissions
    AdminManageUsers,
    AdminManageTeams,
    AdminManageIdentityProviders,
    AdminViewSystemAuditLog,
    AdminManageApiKeys,
}

// Default role definitions
pub fn get_default_roles() -> Vec<RoleDefinition> {
    vec![
        RoleDefinition {
            name: "Super Admin",
            description: "Full system access",
            permissions: Permission::all(),
            is_system: true,
        },
        RoleDefinition {
            name: "Team Owner",
            description: "Full team access",
            permissions: vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DashboardDelete,
                Permission::DashboardShare,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::DatasetUpdate,
                Permission::DatasetDelete,
                Permission::DatasetShare,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::QueryDelete,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartDelete,
                Permission::ChartExport,
                Permission::TeamManageMembers,
                Permission::TeamManageSettings,
                Permission::TeamManageRoles,
                Permission::TeamViewAuditLog,
            ],
            is_system: true,
        },
        RoleDefinition {
            name: "Admin",
            description: "Team administration",
            permissions: vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DashboardShare,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::DatasetUpdate,
                Permission::DatasetShare,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartExport,
                Permission::TeamManageMembers,
            ],
            is_system: true,
        },
        RoleDefinition {
            name: "Editor",
            description: "Create and edit content",
            permissions: vec![
                Permission::DashboardCreate,
                Permission::DashboardRead,
                Permission::DashboardUpdate,
                Permission::DatasetUpload,
                Permission::DatasetRead,
                Permission::QueryCreate,
                Permission::QueryRead,
                Permission::QueryExecute,
                Permission::ChartCreate,
                Permission::ChartRead,
                Permission::ChartUpdate,
                Permission::ChartExport,
            ],
            is_system: true,
        },
        RoleDefinition {
            name: "Viewer",
            description: "View-only access",
            permissions: vec![
                Permission::DashboardRead,
                Permission::DatasetRead,
                Permission::QueryRead,
                Permission::ChartRead,
                Permission::ChartExport,
            ],
            is_system: true,
        },
    ]
}
```

---

## Phase 4: Identity Provider Integration

### 4.1 Supported Providers

| Provider | Protocol | Enterprise | Status |
|----------|----------|------------|--------|
| **Email/Password** | Native | No | ✅ Implemented |
| **Google** | OAuth 2.0 / OIDC | Google Workspace | 📋 Phase 4A |
| **Microsoft** | OAuth 2.0 / OIDC | Azure AD / Entra | 📋 Phase 4A |
| **GitHub** | OAuth 2.0 | GitHub Enterprise | 📋 Phase 4A |
| **Okta** | OAuth 2.0 / SAML | Yes | 📋 Phase 4B |
| **Auth0** | OAuth 2.0 / SAML | Yes | 📋 Phase 4B |
| **LDAP/AD** | LDAP | Yes | 📋 Phase 4C |
| **SAML 2.0** | SAML | Generic | 📋 Phase 4C |
| **Keycloak** | OAuth 2.0 / SAML | Self-hosted | 📋 Phase 4B |

### 4.2 OAuth 2.0 / OIDC Implementation

```rust
// backend/src/auth/oauth.rs

use oauth2::{
    AuthorizationCode, AuthUrl, ClientId, ClientSecret, CsrfToken,
    PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope, TokenResponse,
    TokenUrl,
};

#[derive(Debug, Clone)]
pub struct OAuthProvider {
    pub id: String,
    pub name: String,
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub userinfo_url: String,
    pub scopes: Vec<String>,
}

impl OAuthProvider {
    /// Google OAuth configuration
    pub fn google(client_id: &str, client_secret: &str) -> Self {
        Self {
            id: "google".to_string(),
            name: "Google".to_string(),
            client_id: client_id.to_string(),
            client_secret: client_secret.to_string(),
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
            token_url: "https://oauth2.googleapis.com/token".to_string(),
            userinfo_url: "https://www.googleapis.com/oauth2/v3/userinfo".to_string(),
            scopes: vec![
                "openid".to_string(),
                "email".to_string(),
                "profile".to_string(),
            ],
        }
    }

    /// Microsoft OAuth configuration
    pub fn microsoft(client_id: &str, client_secret: &str, tenant: &str) -> Self {
        Self {
            id: "microsoft".to_string(),
            name: "Microsoft".to_string(),
            client_id: client_id.to_string(),
            client_secret: client_secret.to_string(),
            auth_url: format!("https://login.microsoftonline.com/{}/oauth2/v2.0/authorize", tenant),
            token_url: format!("https://login.microsoftonline.com/{}/oauth2/v2.0/token", tenant),
            userinfo_url: "https://graph.microsoft.com/v1.0/me".to_string(),
            scopes: vec![
                "openid".to_string(),
                "email".to_string(),
                "profile".to_string(),
                "User.Read".to_string(),
            ],
        }
    }

    /// GitHub OAuth configuration
    pub fn github(client_id: &str, client_secret: &str) -> Self {
        Self {
            id: "github".to_string(),
            name: "GitHub".to_string(),
            client_id: client_id.to_string(),
            client_secret: client_secret.to_string(),
            auth_url: "https://github.com/login/oauth/authorize".to_string(),
            token_url: "https://github.com/login/oauth/access_token".to_string(),
            userinfo_url: "https://api.github.com/user".to_string(),
            scopes: vec!["user:email".to_string()],
        }
    }

    /// Generate authorization URL with PKCE
    pub fn get_auth_url(&self, redirect_uri: &str, state: &str) -> (String, PkceCodeVerifier) {
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        
        let client = BasicClient::new(
            ClientId::new(self.client_id.clone()),
            Some(ClientSecret::new(self.client_secret.clone())),
            AuthUrl::new(self.auth_url.clone()).unwrap(),
            Some(TokenUrl::new(self.token_url.clone()).unwrap()),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_uri.to_string()).unwrap());

        let mut auth_request = client
            .authorize_url(|| CsrfToken::new(state.to_string()))
            .set_pkce_challenge(pkce_challenge);

        for scope in &self.scopes {
            auth_request = auth_request.add_scope(Scope::new(scope.clone()));
        }

        let (auth_url, _) = auth_request.url();
        
        (auth_url.to_string(), pkce_verifier)
    }

    /// Exchange authorization code for tokens
    pub async fn exchange_code(
        &self,
        code: &str,
        redirect_uri: &str,
        pkce_verifier: PkceCodeVerifier,
    ) -> Result<TokenResponse, OAuthError> {
        let client = BasicClient::new(
            ClientId::new(self.client_id.clone()),
            Some(ClientSecret::new(self.client_secret.clone())),
            AuthUrl::new(self.auth_url.clone()).unwrap(),
            Some(TokenUrl::new(self.token_url.clone()).unwrap()),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_uri.to_string()).unwrap());

        let token_result = client
            .exchange_code(AuthorizationCode::new(code.to_string()))
            .set_pkce_verifier(pkce_verifier)
            .request_async(async_http_client)
            .await?;

        Ok(token_result)
    }

    /// Fetch user info from provider
    pub async fn get_user_info(&self, access_token: &str) -> Result<OAuthUserInfo, OAuthError> {
        let client = reqwest::Client::new();
        let response = client
            .get(&self.userinfo_url)
            .bearer_auth(access_token)
            .send()
            .await?;

        let user_info: OAuthUserInfo = response.json().await?;
        Ok(user_info)
    }
}

#[derive(Debug, Deserialize)]
pub struct OAuthUserInfo {
    pub id: Option<String>,
    pub sub: Option<String>,  // OIDC subject
    pub email: Option<String>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub email_verified: Option<bool>,
}
```

### 4.3 SAML 2.0 Implementation

```rust
// backend/src/auth/saml.rs

use samael::service_provider::ServiceProvider;
use samael::idp::IdentityProvider;

#[derive(Debug, Clone)]
pub struct SAMLProvider {
    pub id: String,
    pub name: String,
    pub idp_metadata_url: Option<String>,
    pub idp_metadata_xml: Option<String>,
    pub sp_entity_id: String,
    pub sp_acs_url: String,
    pub sp_certificate: String,
    pub sp_private_key: String,
    pub attribute_mapping: AttributeMapping,
}

#[derive(Debug, Clone)]
pub struct AttributeMapping {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub groups: Option<String>,
}

impl SAMLProvider {
    pub fn new(config: SAMLConfig) -> Result<Self, SAMLError> {
        // Validate and parse IDP metadata
        let idp = if let Some(url) = &config.idp_metadata_url {
            IdentityProvider::from_metadata_url(url)?
        } else if let Some(xml) = &config.idp_metadata_xml {
            IdentityProvider::from_metadata_xml(xml)?
        } else {
            return Err(SAMLError::MissingMetadata);
        };

        Ok(Self {
            id: config.id,
            name: config.name,
            idp_metadata_url: config.idp_metadata_url,
            idp_metadata_xml: config.idp_metadata_xml,
            sp_entity_id: config.sp_entity_id,
            sp_acs_url: config.sp_acs_url,
            sp_certificate: config.sp_certificate,
            sp_private_key: config.sp_private_key,
            attribute_mapping: config.attribute_mapping,
        })
    }

    /// Generate SAML AuthnRequest
    pub fn create_authn_request(&self, relay_state: &str) -> Result<String, SAMLError> {
        let sp = self.build_service_provider()?;
        let (url, _) = sp.create_authn_request_redirect_binding(relay_state)?;
        Ok(url)
    }

    /// Process SAML Response
    pub fn process_response(&self, saml_response: &str) -> Result<SAMLAssertion, SAMLError> {
        let sp = self.build_service_provider()?;
        let assertion = sp.parse_response(saml_response)?;
        
        // Extract user attributes
        let attributes = assertion.get_attributes();
        
        Ok(SAMLAssertion {
            subject: assertion.subject.clone(),
            email: attributes.get(&self.attribute_mapping.email).cloned(),
            first_name: attributes.get(&self.attribute_mapping.first_name).cloned(),
            last_name: attributes.get(&self.attribute_mapping.last_name).cloned(),
            groups: self.attribute_mapping.groups.as_ref()
                .and_then(|g| attributes.get(g))
                .map(|v| v.split(',').map(String::from).collect()),
            session_index: assertion.session_index.clone(),
        })
    }

    /// Generate SP metadata XML
    pub fn get_sp_metadata(&self) -> Result<String, SAMLError> {
        let sp = self.build_service_provider()?;
        Ok(sp.metadata_xml()?)
    }

    fn build_service_provider(&self) -> Result<ServiceProvider, SAMLError> {
        ServiceProvider::builder()
            .entity_id(&self.sp_entity_id)
            .acs_url(&self.sp_acs_url)
            .certificate(&self.sp_certificate)
            .private_key(&self.sp_private_key)
            .build()
    }
}

#[derive(Debug)]
pub struct SAMLAssertion {
    pub subject: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub groups: Option<Vec<String>>,
    pub session_index: Option<String>,
}
```

### 4.4 Auth Routes

```rust
// backend/src/routes/auth.rs

use actix_web::{web, HttpResponse, get, post};

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            // Native auth
            .route("/register", web::post().to(register))
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout))
            .route("/refresh", web::post().to(refresh_token))
            .route("/me", web::get().to(get_current_user))
            .route("/password/forgot", web::post().to(forgot_password))
            .route("/password/reset", web::post().to(reset_password))
            // MFA
            .route("/mfa/enable", web::post().to(enable_mfa))
            .route("/mfa/verify", web::post().to(verify_mfa))
            .route("/mfa/disable", web::post().to(disable_mfa))
            // OAuth
            .route("/oauth/{provider}/authorize", web::get().to(oauth_authorize))
            .route("/oauth/{provider}/callback", web::get().to(oauth_callback))
            // SAML
            .route("/saml/{provider}/login", web::get().to(saml_login))
            .route("/saml/{provider}/acs", web::post().to(saml_acs))
            .route("/saml/{provider}/metadata", web::get().to(saml_metadata))
            // API Keys
            .route("/api-keys", web::get().to(list_api_keys))
            .route("/api-keys", web::post().to(create_api_key))
            .route("/api-keys/{id}", web::delete().to(revoke_api_key))
    );
}

#[get("/oauth/{provider}/authorize")]
async fn oauth_authorize(
    provider: web::Path<String>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let provider_config = state.identity_providers.get_oauth(&provider)
        .ok_or(AppError::NotFound("Provider not found"))?;
    
    // Generate state token
    let state_token = generate_secure_token();
    
    // Get auth URL
    let (auth_url, pkce_verifier) = provider_config.get_auth_url(
        &format!("{}/api/auth/oauth/{}/callback", state.base_url, provider),
        &state_token,
    );
    
    // Store state and PKCE verifier in session
    state.session_store.set(
        &format!("oauth_state:{}", state_token),
        &OAuthSession { pkce_verifier, provider: provider.clone() },
        Duration::from_secs(600),
    ).await?;
    
    Ok(HttpResponse::Found()
        .append_header(("Location", auth_url))
        .finish())
}

#[get("/oauth/{provider}/callback")]
async fn oauth_callback(
    provider: web::Path<String>,
    query: web::Query<OAuthCallbackQuery>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    // Verify state
    let oauth_session: OAuthSession = state.session_store
        .get(&format!("oauth_state:{}", query.state))
        .await?
        .ok_or(AppError::InvalidState)?;
    
    // Get provider
    let provider_config = state.identity_providers.get_oauth(&provider)
        .ok_or(AppError::NotFound("Provider not found"))?;
    
    // Exchange code for tokens
    let tokens = provider_config.exchange_code(
        &query.code,
        &format!("{}/api/auth/oauth/{}/callback", state.base_url, provider),
        oauth_session.pkce_verifier,
    ).await?;
    
    // Get user info
    let user_info = provider_config.get_user_info(
        tokens.access_token().secret()
    ).await?;
    
    // Find or create user
    let user = find_or_create_user_from_oauth(&state.db, &provider, &user_info).await?;
    
    // Generate JWT tokens
    let jwt_tokens = generate_jwt_tokens(&user, &state.jwt_config)?;
    
    // Redirect to frontend with tokens
    Ok(HttpResponse::Found()
        .append_header((
            "Location",
            format!(
                "{}?access_token={}&refresh_token={}",
                state.frontend_url,
                jwt_tokens.access_token,
                jwt_tokens.refresh_token
            )
        ))
        .finish())
}
```

---

## Competitive Analysis: BI Tools

### Feature Comparison Matrix

| Feature | Tableau | Power BI | Looker | **PilotBA** |
|---------|---------|----------|--------|-------------|
| **Pricing** | $70-150/user/mo | $10-20/user/mo | Custom (high) | **$0 (open source)** |
| **Self-hosted** | Complex | No | No | **Yes (Docker/K8s)** |
| **Data Point Limit** | ~100K | ~100K | ~100K | **10M+** |
| **Rendering FPS** | ~30 FPS | ~30 FPS | ~30 FPS | **60 FPS** |
| **Client-side Processing** | Limited | Limited | No | **Yes (Arrow)** |
| **WebGL Rendering** | No | No | No | **Yes** |
| **SSO/SAML** | ✅ | ✅ | ✅ | ✅ (Phase 4) |
| **Embedded Analytics** | ✅ | ✅ | ✅ | ✅ (Phase 5) |
| **Natural Language Query** | Einstein | Q&A | No | 📋 (Phase 6) |
| **Real-time Data** | ✅ | ✅ | ✅ | ✅ (WebSocket) |
| **Mobile App** | ✅ | ✅ | ✅ | 📋 (Phase 7) |
| **Export Formats** | PDF, PNG, CSV | PDF, PNG, CSV, PPTX | PDF, PNG, CSV | PDF, PNG, CSV, SVG, Arrow |

### Detailed Feature Analysis

#### 1. Data Connectivity

| Connector | Tableau | Power BI | Looker | PilotBA (Planned) |
|-----------|---------|----------|--------|-------------------|
| **PostgreSQL** | ✅ | ✅ | ✅ | ✅ |
| **MySQL** | ✅ | ✅ | ✅ | ✅ |
| **SQL Server** | ✅ | ✅ | ✅ | 📋 |
| **BigQuery** | ✅ | ✅ | ✅ | 📋 |
| **Snowflake** | ✅ | ✅ | ✅ | 📋 |
| **Redshift** | ✅ | ✅ | ✅ | 📋 |
| **MongoDB** | ✅ | ✅ | Limited | 📋 |
| **Elasticsearch** | ✅ | ✅ | ✅ | 📋 |
| **REST API** | ✅ | ✅ | ✅ | ✅ |
| **GraphQL** | ❌ | ❌ | ❌ | ✅ |
| **CSV/Excel** | ✅ | ✅ | ✅ | ✅ |
| **Parquet** | ✅ | ✅ | ✅ | ✅ |
| **Arrow IPC** | ❌ | ❌ | ❌ | ✅ |

#### 2. Visualization Types

| Chart Type | Tableau | Power BI | Looker | PilotBA |
|------------|---------|----------|--------|---------|
| **Bar Chart** | ✅ | ✅ | ✅ | ✅ |
| **Line Chart** | ✅ | ✅ | ✅ | ✅ |
| **Scatter Plot** | ✅ | ✅ | ✅ | ✅ |
| **Heatmap** | ✅ | ✅ | ✅ | ✅ |
| **Pie/Donut** | ✅ | ✅ | ✅ | 📋 |
| **Area Chart** | ✅ | ✅ | ✅ | 📋 |
| **Treemap** | ✅ | ✅ | ✅ | 📋 |
| **Geographic Map** | ✅ | ✅ | ✅ | 📋 |
| **Sankey** | ✅ | ✅ | ✅ | 📋 |
| **Funnel** | ✅ | ✅ | ✅ | 📋 |
| **Waterfall** | ✅ | ✅ | ✅ | 📋 |
| **Box Plot** | ✅ | ✅ | Limited | 📋 |
| **Radar** | ✅ | ✅ | Limited | 📋 |
| **Custom WebGL** | ❌ | ❌ | ❌ | ✅ |

#### 3. Analytics Features

| Feature | Tableau | Power BI | Looker | PilotBA |
|---------|---------|----------|--------|---------|
| **Filter** | ✅ | ✅ | ✅ | ✅ |
| **Sort** | ✅ | ✅ | ✅ | ✅ |
| **Aggregate** | ✅ | ✅ | ✅ | ✅ |
| **Join** | ✅ | ✅ | ✅ | ✅ |
| **Window Functions** | ✅ | ✅ (DAX) | ✅ (LookML) | 📋 |
| **Calculated Fields** | ✅ | ✅ | ✅ | 📋 |
| **Parameters** | ✅ | ✅ | ✅ | 📋 |
| **Drill Down** | ✅ | ✅ | ✅ | 📋 |
| **Cross-filter** | ✅ | ✅ | ✅ | 📋 |
| **Trend Lines** | ✅ | ✅ | Limited | 📋 |
| **Forecasting** | ✅ | ✅ | BigQuery ML | 📋 |
| **Clustering** | ✅ | ✅ | BigQuery ML | 📋 |

#### 4. Collaboration Features

| Feature | Tableau | Power BI | Looker | PilotBA |
|---------|---------|----------|--------|---------|
| **Dashboard Sharing** | ✅ | ✅ | ✅ | 📋 |
| **Comments** | ✅ | ✅ | ✅ | 📋 |
| **Annotations** | ✅ | ✅ | ✅ | 📋 |
| **Scheduled Reports** | ✅ | ✅ | ✅ | 📋 |
| **Alerts** | ✅ | ✅ | ✅ | 📋 |
| **Subscriptions** | ✅ | ✅ | ✅ | 📋 |
| **Version History** | ✅ | Limited | ✅ | 📋 |
| **Teams/Workspaces** | ✅ | ✅ | ✅ | ✅ |

---

## Feature Roadmap

### Phase Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PILOTBA FEATURE ROADMAP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 2         PHASE 3         PHASE 4         PHASE 5                │
│  Core MVP        User Mgmt       Identity        Advanced               │
│  (Current)       & Teams         Providers       Features               │
│                                                                          │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐           │
│  │ Charts  │     │ RBAC    │     │ OAuth   │     │ Embed   │           │
│  │ Query   │     │ Teams   │     │ SAML    │     │ Alerts  │           │
│  │ Upload  │     │ Audit   │     │ MFA     │     │ Schedule│           │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘           │
│       │               │               │               │                 │
│       ▼               ▼               ▼               ▼                 │
│   Jan 2026        Feb 2026        Mar 2026        Apr 2026              │
│                                                                          │
│  PHASE 6         PHASE 7         PHASE 8         PHASE 9                │
│  AI/ML           Mobile          Data             Enterprise            │
│                                  Connectors                             │
│                                                                          │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐           │
│  │ NL Query│     │ iOS App │     │ BigQuery│     │ SLA     │           │
│  │ AutoML  │     │ Android │     │ Snowflake│    │ Support │           │
│  │ Predict │     │ PWA     │     │ Redshift│     │ Premium │           │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘           │
│       │               │               │               │                 │
│       ▼               ▼               ▼               ▼                 │
│   May 2026        Jun 2026        Jul 2026        Aug 2026              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detailed Feature List by Phase

#### Phase 2: Core MVP (Current - Jan 2026)
- [x] File upload (CSV, JSON, Arrow, Parquet)
- [x] Data table with virtual scrolling
- [x] 4 chart types (Bar, Line, Scatter, Heatmap)
- [x] Query builder (Filter, Sort, Aggregate)
- [x] Dashboard view
- [ ] Error handling system
- [ ] Backend auth (JWT)
- [ ] Backend file API
- [ ] Frontend-backend integration

#### Phase 3: User Management (Feb 2026)
- [ ] User registration & login
- [ ] Password reset flow
- [ ] Email verification
- [ ] Teams/Workspaces
- [ ] Role-based access control (RBAC)
- [ ] Permission management
- [ ] Audit logging
- [ ] User profiles
- [ ] API key management

#### Phase 4: Identity Providers (Mar 2026)
- [ ] Google OAuth
- [ ] Microsoft OAuth (Azure AD)
- [ ] GitHub OAuth
- [ ] SAML 2.0 support
- [ ] Okta integration
- [ ] Auth0 integration
- [ ] LDAP/Active Directory
- [ ] Multi-factor authentication (MFA)
- [ ] Session management

#### Phase 5: Advanced Features (Apr 2026)
- [ ] Embedded analytics SDK
- [ ] Scheduled reports
- [ ] Email alerts
- [ ] Dashboard sharing (public links)
- [ ] Comments & annotations
- [ ] Calculated fields
- [ ] Parameters
- [ ] Cross-filtering
- [ ] Drill-down navigation

#### Phase 6: AI/ML Integration (May 2026)
- [ ] Natural language queries
- [ ] Auto-generated insights
- [ ] Trend detection
- [ ] Anomaly detection
- [ ] Forecasting
- [ ] Smart recommendations
- [ ] Auto-visualization suggestions

#### Phase 7: Mobile Experience (Jun 2026)
- [ ] Progressive Web App (PWA)
- [ ] iOS native app
- [ ] Android native app
- [ ] Offline mode
- [ ] Push notifications
- [ ] Touch-optimized interactions

#### Phase 8: Data Connectors (Jul 2026)
- [ ] Google BigQuery
- [ ] Snowflake
- [ ] Amazon Redshift
- [ ] Azure Synapse
- [ ] Databricks
- [ ] MongoDB
- [ ] Elasticsearch
- [ ] Real-time streaming (Kafka)

#### Phase 9: Enterprise Features (Aug 2026)
- [ ] Multi-tenancy
- [ ] White-labeling
- [ ] Custom domains
- [ ] SLA guarantees
- [ ] Premium support
- [ ] On-premise deployment
- [ ] Data governance
- [ ] Compliance certifications (SOC 2, HIPAA)

---

## Timeline & Milestones

### 2026 Roadmap

| Quarter | Phase | Key Deliverables |
|---------|-------|------------------|
| **Q1** | Phase 2-3 | MVP launch, User management, Local hosting |
| **Q1** | Phase 4 | Identity providers, SSO |
| **Q2** | Phase 5-6 | Advanced features, AI/ML |
| **Q2** | Phase 7 | Mobile apps |
| **Q3** | Phase 8 | Data connectors |
| **Q3** | Phase 9 | Enterprise features |
| **Q4** | - | Production hardening, Scale testing |

### Key Milestones

| Date | Milestone | Success Criteria |
|------|-----------|------------------|
| **Jan 31, 2026** | MVP Launch | Core features working, 95% tests pass |
| **Feb 28, 2026** | User Management | Teams, RBAC, audit logging |
| **Mar 31, 2026** | SSO Launch | Google, Microsoft, SAML working |
| **Apr 30, 2026** | Cloud Deployment | Running on AWS/GCP/Azure |
| **May 31, 2026** | AI Features | Natural language queries |
| **Jun 30, 2026** | Mobile Launch | iOS and Android apps |
| **Jul 31, 2026** | Enterprise Connectors | BigQuery, Snowflake working |
| **Aug 31, 2026** | Enterprise Ready | SOC 2 compliance, SLA |

---

## Conclusion

This roadmap positions PilotBA as a serious competitor to commercial BI tools by focusing on:

1. **Performance Leadership** - 10M+ points at 60 FPS (10-100x better than competitors)
2. **Cost Advantage** - $0 licensing vs. $70-150/user/month
3. **Data Privacy** - Self-hosted option with full control
4. **Modern Architecture** - Cloud-native, WebGL, Apache Arrow
5. **Enterprise Features** - SSO, RBAC, audit logging, compliance

The phased approach ensures we deliver value incrementally while building toward a complete enterprise platform.

---

**Document Owner:** Lead Architect  
**Review Schedule:** Monthly  
**Next Review:** January 23, 2026


