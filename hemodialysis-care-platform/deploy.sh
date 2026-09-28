#!/usr/bin/env bash
# ==========================================
# Hemodialysis Care Platform - Deployment Script
# ==========================================
# Usage: ./deploy.sh [production|staging]
# This script deploys the entire stack to port 8090

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-production}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
ENV_FILE="${PROJECT_DIR}/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    log "Prerequisites satisfied"
}

# Setup environment file
setup_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log "Creating .env file from .env.example..."
        if [ -f "${PROJECT_DIR}/.env.example" ]; then
            cp "${PROJECT_DIR}/.env.example" "$ENV_FILE"
        else
            warn "No .env.example found, creating default .env"
            cat > "$ENV_FILE" << EOF
# Application
APP_NAME="سیستم پایش همودیالیز"
APP_VERSION="1.0.0"
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=please-change-this-to-a-random-32-char-min-secret-key

# Database
POSTGRES_USER=hemo_user
POSTGRES_PASSWORD=hemo_password
POSTGRES_DB=hemodialysis_db
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://hemo_user:hemo_password@db:5432/hemodialysis_db

# JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis & Celery
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# CORS
ALLOWED_ORIGINS=http://localhost:8090,http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
LOGIN_RATE_LIMIT=5

# Frontend API URL (used during build)
API_URL=http://localhost:8090/api/v1
EOF
        fi
        warn "Please review and update the .env file with your production values"
    fi
}

# Stop existing containers
stop_existing() {
    log "Stopping existing containers..."
    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
}

# Build and start services
deploy() {
    log "Building and starting services..."
    cd "$PROJECT_DIR"
    
    # Build images
    log "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    
    # Start services
    log "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    log "Waiting for services to become healthy..."
    sleep 10
    
    # Check status
    check_status
}

# Check service status
check_status() {
    log "Checking service status..."
    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" ps
    
    log "Testing application health..."
    if curl -sf http://localhost:8090/health > /dev/null 2>&1; then
        log "Application is healthy at http://localhost:8090"
    else
        warn "Health check failed, check logs with: docker compose logs"
    fi
}

# Show logs
show_logs() {
    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" logs -f
}

# Main execution
main() {
    log "Starting deployment (environment: $ENVIRONMENT)"
    check_prerequisites
    setup_env
    stop_existing
    deploy
    
    log "Deployment complete!"
    log "Access your application at: http://localhost:8090"
    log "Backend API docs (dev only): http://localhost:8090/docs"
    
    echo ""
    echo "Useful commands:"
    echo "  View logs:  docker compose logs -f"
    echo "  Stop:       docker compose down"
    echo "  Restart:    docker compose restart"
}

# Parse command
case "${2:-}" in
    logs)
        show_logs
        ;;
    *)
        main
        ;;
esac