# Docker Development Setup Guide

## Quick Start

### Prerequisites

- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- Docker Compose v2.0+
- Git

### Setup Steps

#### 1. Clone Repository

```bash
git clone https://github.com/techaploog/limitless-chat.git
cd limitless-chat
```

#### 2. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables:**
- `VITE_APP_ID` - From Manus platform
- `OPENROUTER_API_KEY` - From OpenRouter
- `BUILT_IN_FORGE_API_KEY` - From Manus platform
- `STRIPE_SECRET_KEY` - From Stripe dashboard (optional for testing)

#### 3. Start Development Stack

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### 4. Access Application

- **Frontend (Vite Dev Server):** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Database:** localhost:3306

#### 5. Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec backend pnpm db:push

# Seed database (optional)
docker-compose -f docker-compose.dev.yml exec backend pnpm db:seed
```

## Services Overview

### Database Service (MySQL 8.0)

```yaml
Service: db
Port: 3306
Username: limitless_user
Password: limitless_password_dev
Database: limitless_chat
```

**Access database:**
```bash
# Using mysql client
docker-compose -f docker-compose.dev.yml exec db mysql -u limitless_user -p limitless_chat

# Using Docker
docker exec -it limitless-chat-db mysql -u limitless_user -p limitless_chat
```

**Backup database:**
```bash
docker-compose -f docker-compose.dev.yml exec db mysqldump -u limitless_user -p limitless_chat > backup.sql
```

**Restore database:**
```bash
docker-compose -f docker-compose.dev.yml exec -T db mysql -u limitless_user -p limitless_chat < backup.sql
```

### Backend Service (Node.js)

```yaml
Service: backend
Port: 3000
Environment: development
```

**Access backend logs:**
```bash
docker-compose -f docker-compose.dev.yml logs -f backend
```

**Run backend commands:**
```bash
# Install dependencies
docker-compose -f docker-compose.dev.yml exec backend pnpm install

# Build
docker-compose -f docker-compose.dev.yml exec backend pnpm build

# Run migrations
docker-compose -f docker-compose.dev.yml exec backend pnpm db:push

# Run tests
docker-compose -f docker-compose.dev.yml exec backend pnpm test
```

**Rebuild backend image:**
```bash
docker-compose -f docker-compose.dev.yml build backend
```

### Frontend Service (Nginx - Optional)

```yaml
Service: frontend
Port: 80, 443
Purpose: Testing production build
```

**Note:** For development, use Vite dev server directly (http://localhost:5173).

To test production build:
```bash
# Build frontend
pnpm build

# Start frontend service
docker-compose -f docker-compose.dev.yml up frontend

# Access at http://localhost
```

## Common Commands

### View Service Status

```bash
# List all running containers
docker-compose -f docker-compose.dev.yml ps

# View detailed service info
docker-compose -f docker-compose.dev.yml ps -a
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f db

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100
```

### Stop/Start Services

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml stop

# Start all services
docker-compose -f docker-compose.dev.yml start

# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend
```

### Remove Services

```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Remove containers, networks, and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove images too
docker-compose -f docker-compose.dev.yml down -v --rmi all
```

### Execute Commands in Container

```bash
# Run command in backend
docker-compose -f docker-compose.dev.yml exec backend pnpm lint

# Run command in database
docker-compose -f docker-compose.dev.yml exec db mysqldump -u limitless_user -p limitless_chat

# Interactive shell
docker-compose -f docker-compose.dev.yml exec backend sh
docker-compose -f docker-compose.dev.yml exec db bash
```

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Find process using port 3306
lsof -i :3306

# Kill process
kill -9 <PID>

# Or change port in docker-compose.dev.yml
ports:
  - "3001:3000"  # Change 3000 to 3001
```

### Issue: Database Connection Failed

```bash
# Check database service status
docker-compose -f docker-compose.dev.yml ps db

# Check database logs
docker-compose -f docker-compose.dev.yml logs db

# Restart database
docker-compose -f docker-compose.dev.yml restart db

# Wait for database to be ready
docker-compose -f docker-compose.dev.yml exec db mysqladmin ping -h localhost
```

### Issue: Backend Can't Connect to Database

```bash
# Verify DATABASE_URL in .env
DATABASE_URL=mysql://limitless_user:limitless_password_dev@db:3306/limitless_chat

# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend

# Verify database is running
docker-compose -f docker-compose.dev.yml ps db
```

### Issue: Node Modules Not Installed

```bash
# Rebuild backend image
docker-compose -f docker-compose.dev.yml build --no-cache backend

# Reinstall dependencies
docker-compose -f docker-compose.dev.yml exec backend pnpm install
```

### Issue: Hot Reload Not Working

```bash
# Ensure volume is mounted correctly in docker-compose.dev.yml
volumes:
  - .:/app
  - /app/node_modules

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend

# Check file permissions
ls -la
```

### Issue: Out of Disk Space

```bash
# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a
```

## Development Workflow

### 1. Start Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Make Code Changes

- Frontend: Edit `client/src/` - Hot reload via Vite
- Backend: Edit `server/` - Hot reload via tsx watch
- Database: Edit `drizzle/schema.ts` - Run migrations

### 3. Run Migrations (if schema changed)

```bash
docker-compose -f docker-compose.dev.yml exec backend pnpm db:push
```

### 4. Test Changes

```bash
# Frontend
http://localhost:5173

# Backend API
curl http://localhost:3000/api/trpc/auth.me

# Database
docker-compose -f docker-compose.dev.yml exec db mysql -u limitless_user -p limitless_chat
```

### 5. Commit Changes

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Performance Tips

### 1. Use Named Volumes for Database

```yaml
volumes:
  db_data:
    driver: local
```

This improves database performance on Docker Desktop.

### 2. Limit Docker Memory

Edit `docker-compose.dev.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 3. Use .dockerignore

Create `.dockerignore`:
```
node_modules
.git
.gitignore
README.md
dist
.env
.DS_Store
```

### 4. Build Images Locally

```bash
# Build backend image
docker build -t limitless-chat-backend:latest -f Dockerfile --target development .

# Build frontend image
docker build -t limitless-chat-frontend:latest -f Dockerfile.nginx .
```

## Production Build Testing

### Test Production Build Locally

```bash
# Build frontend
pnpm build

# Start production services
docker-compose -f docker-compose.dev.yml up frontend

# Access at http://localhost
```

### Test Production Backend

```bash
# Build production image
docker build -t limitless-chat-backend:prod -f Dockerfile --target production .

# Run production container
docker run -d \
  --name limitless-chat-prod \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e NODE_ENV=production \
  limitless-chat-backend:prod

# Test
curl http://localhost:3000/health

# Stop
docker stop limitless-chat-prod
docker rm limitless-chat-prod
```

## File Structure

```
limitless-chat/
├── docker-compose.dev.yml      # Development compose file
├── Dockerfile                   # Multi-stage build
├── nginx.dev.conf              # Nginx development config
├── .env.example                # Environment template
├── .dockerignore                # Docker build ignore
├── client/                      # React frontend
├── server/                      # Node.js backend
├── drizzle/                     # Database schema
└── scripts/
    └── init.sql                # Database initialization
```

## Next Steps

1. **Set up Git hooks** - Add pre-commit linting
2. **Add tests** - Jest for backend, Vitest for frontend
3. **Configure CI/CD** - GitHub Actions for automated testing
4. **Set up monitoring** - Docker stats, logs aggregation
5. **Production deployment** - Use docker-compose.prod.yml

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MySQL Docker Documentation](https://hub.docker.com/_/mysql)
