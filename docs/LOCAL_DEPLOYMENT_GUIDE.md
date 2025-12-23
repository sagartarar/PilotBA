# 🚀 PilotBA Local Deployment Guide

**Quick Reference for Self-Hosted Deployment**

---

## Prerequisites

### Required Software

| Software | Minimum Version | Check Command |
|----------|----------------|---------------|
| Docker | 24.0+ | `docker --version` |
| Docker Compose | 2.20+ | `docker-compose --version` |
| Git | 2.40+ | `git --version` |

### Hardware Requirements

| Tier | CPU | RAM | Storage | Users |
|------|-----|-----|---------|-------|
| **Small** | 4 cores | 8 GB | 50 GB | 1-10 |
| **Medium** | 8 cores | 16 GB | 200 GB | 10-50 |
| **Large** | 16+ cores | 32+ GB | 500+ GB | 50+ |

---

## Quick Start (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/your-org/pilotba.git
cd pilotba

# 2. Copy environment file
cp .env.example .env.local

# 3. Generate secure passwords (run in terminal)
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env.local
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env.local
echo "MINIO_SECRET_KEY=$(openssl rand -base64 32)" >> .env.local
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env.local

# 4. Start services
docker-compose -f docker-compose.local.yml up -d

# 5. Wait for services (check health)
docker-compose -f docker-compose.local.yml ps

# 6. Access application
open http://localhost
```

---

## Configuration

### Environment Variables

Edit `.env.local`:

```bash
# ===================
# Database (PostgreSQL)
# ===================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=pilotba
POSTGRES_USER=pilotba
POSTGRES_PASSWORD=<your-secure-password>

# ===================
# Cache (Redis)
# ===================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<your-secure-password>

# ===================
# Storage (MinIO)
# ===================
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=pilotba
MINIO_SECRET_KEY=<your-secure-password>
MINIO_BUCKET=pilotba-files

# ===================
# Authentication
# ===================
JWT_SECRET=<your-64-byte-secret>
JWT_EXPIRY=3600              # 1 hour
REFRESH_TOKEN_EXPIRY=604800  # 7 days

# ===================
# Application
# ===================
API_PORT=8080
RUST_LOG=info
NODE_ENV=production

# ===================
# URLs
# ===================
BASE_URL=http://localhost
FRONTEND_URL=http://localhost
API_URL=http://localhost/api
```

### Port Configuration

| Service | Default Port | Environment Variable |
|---------|-------------|---------------------|
| Frontend (Nginx) | 80 | `HTTP_PORT` |
| Frontend (HTTPS) | 443 | `HTTPS_PORT` |
| Backend API | 8080 | `API_PORT` |
| PostgreSQL | 5432 | `POSTGRES_PORT` |
| Redis | 6379 | `REDIS_PORT` |
| MinIO API | 9000 | `MINIO_PORT` |
| MinIO Console | 9001 | `MINIO_CONSOLE_PORT` |

---

## Service Management

### Start Services

```bash
# Start all services
docker-compose -f docker-compose.local.yml up -d

# Start specific service
docker-compose -f docker-compose.local.yml up -d backend

# View logs
docker-compose -f docker-compose.local.yml logs -f

# View specific service logs
docker-compose -f docker-compose.local.yml logs -f backend
```

### Stop Services

```bash
# Stop all services (keep data)
docker-compose -f docker-compose.local.yml stop

# Stop and remove containers (keep data volumes)
docker-compose -f docker-compose.local.yml down

# Stop and remove everything (including data!)
docker-compose -f docker-compose.local.yml down -v
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.local.yml restart

# Restart specific service
docker-compose -f docker-compose.local.yml restart backend
```

### Health Check

```bash
# Check service status
docker-compose -f docker-compose.local.yml ps

# Check individual service health
docker-compose -f docker-compose.local.yml exec backend curl http://localhost:8080/api/health
docker-compose -f docker-compose.local.yml exec postgres pg_isready -U pilotba
docker-compose -f docker-compose.local.yml exec redis redis-cli -a $REDIS_PASSWORD ping
```

---

## HTTPS Setup (Production)

### Option 1: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
mkdir -p infrastructure/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/nginx/ssl/server.key \
  -out infrastructure/nginx/ssl/server.crt \
  -subj "/CN=localhost"
```

### Option 2: Let's Encrypt (Production)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem infrastructure/nginx/ssl/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem infrastructure/nginx/ssl/server.key
```

### Nginx HTTPS Configuration

Update `infrastructure/nginx/nginx.local.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # ... rest of config
}
```

---

## Backup & Restore

### Automated Backup

Create `scripts/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/pilotba}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

mkdir -p "$BACKUP_PATH"

echo "🔄 Starting backup..."

# PostgreSQL
echo "📊 Backing up PostgreSQL..."
docker-compose -f docker-compose.local.yml exec -T postgres \
  pg_dump -U pilotba pilotba > "$BACKUP_PATH/postgres.sql"

# Redis
echo "💾 Backing up Redis..."
docker-compose -f docker-compose.local.yml exec -T redis \
  redis-cli -a "$REDIS_PASSWORD" BGSAVE
sleep 5
docker cp $(docker-compose -f docker-compose.local.yml ps -q redis):/data/dump.rdb \
  "$BACKUP_PATH/redis.rdb"

# MinIO
echo "📁 Backing up MinIO..."
docker run --rm \
  -v pilotba_minio_data:/data \
  -v "$BACKUP_PATH":/backup \
  alpine tar czf /backup/minio.tar.gz /data

# Compress
echo "🗜️ Compressing backup..."
tar czf "$BACKUP_DIR/pilotba-backup-$DATE.tar.gz" -C "$BACKUP_PATH" .

# Cleanup
rm -rf "$BACKUP_PATH"

echo "✅ Backup complete: $BACKUP_DIR/pilotba-backup-$DATE.tar.gz"
```

### Restore from Backup

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file.tar.gz>"
  exit 1
fi

TEMP_DIR=$(mktemp -d)
tar xzf "$BACKUP_FILE" -C "$TEMP_DIR"

echo "🔄 Restoring..."

# PostgreSQL
echo "📊 Restoring PostgreSQL..."
docker-compose -f docker-compose.local.yml exec -T postgres \
  psql -U pilotba -d pilotba < "$TEMP_DIR/postgres.sql"

# Redis
echo "💾 Restoring Redis..."
docker-compose -f docker-compose.local.yml stop redis
docker cp "$TEMP_DIR/redis.rdb" \
  $(docker-compose -f docker-compose.local.yml ps -q redis):/data/dump.rdb
docker-compose -f docker-compose.local.yml start redis

# MinIO
echo "📁 Restoring MinIO..."
docker-compose -f docker-compose.local.yml stop minio
docker run --rm \
  -v pilotba_minio_data:/data \
  -v "$TEMP_DIR":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/minio.tar.gz -C /"
docker-compose -f docker-compose.local.yml start minio

rm -rf "$TEMP_DIR"

echo "✅ Restore complete!"
```

### Schedule Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 3 AM
0 3 * * * /path/to/pilotba/scripts/backup.sh >> /var/log/pilotba-backup.log 2>&1
```

---

## Monitoring

### Basic Monitoring with Docker Stats

```bash
# Real-time resource usage
docker stats

# Specific services
docker stats pilotba-backend pilotba-postgres pilotba-redis
```

### Log Monitoring

```bash
# Follow all logs
docker-compose -f docker-compose.local.yml logs -f

# Filter by service
docker-compose -f docker-compose.local.yml logs -f backend | grep ERROR

# Save logs to file
docker-compose -f docker-compose.local.yml logs > logs-$(date +%Y%m%d).txt
```

### Health Endpoint

```bash
# Check API health
curl http://localhost/api/health

# Expected response
{
  "status": "healthy",
  "version": "0.1.0",
  "services": {
    "database": "connected",
    "cache": "connected",
    "storage": "connected"
  }
}
```

---

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check what's using the ports
sudo lsof -i :80
sudo lsof -i :5432
sudo lsof -i :6379

# Kill conflicting processes or change ports in .env.local
```

#### Database Connection Failed

```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.local.yml logs postgres

# Verify connection
docker-compose -f docker-compose.local.yml exec postgres \
  psql -U pilotba -d pilotba -c "SELECT 1"
```

#### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes
```

#### Memory Issues

```bash
# Check memory usage
free -h

# Reduce resource limits in docker-compose.local.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Reset Everything

```bash
# Nuclear option - removes ALL data
docker-compose -f docker-compose.local.yml down -v
docker system prune -a --volumes

# Start fresh
docker-compose -f docker-compose.local.yml up -d
```

---

## Updating

### Update to Latest Version

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.local.yml build --no-cache

# Restart services
docker-compose -f docker-compose.local.yml up -d

# Run migrations (if any)
docker-compose -f docker-compose.local.yml exec backend ./migrate
```

### Rollback

```bash
# Checkout previous version
git checkout v0.1.0

# Rebuild and restart
docker-compose -f docker-compose.local.yml build
docker-compose -f docker-compose.local.yml up -d
```

---

## Security Checklist

Before going live:

- [ ] Changed all default passwords in `.env.local`
- [ ] Enabled HTTPS with valid certificate
- [ ] Configured firewall (only ports 80/443 open)
- [ ] Set up automated backups
- [ ] Configured log rotation
- [ ] Tested restore procedure
- [ ] Set up monitoring/alerting
- [ ] Reviewed security headers in Nginx config
- [ ] Disabled debug mode (`RUST_LOG=warn`)

---

## Support

### Logs Location

| Service | Log Location |
|---------|-------------|
| Nginx | `docker logs pilotba-nginx` |
| Backend | `docker logs pilotba-backend` |
| PostgreSQL | `docker logs pilotba-postgres` |
| Redis | `docker logs pilotba-redis` |
| MinIO | `docker logs pilotba-minio` |

### Getting Help

1. Check this guide
2. Review logs for errors
3. Search existing issues on GitHub
4. Create new issue with logs and steps to reproduce

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025


