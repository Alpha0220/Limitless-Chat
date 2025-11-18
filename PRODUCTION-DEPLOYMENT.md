# Limitless Chat - Production Deployment Guide

## Production Services Overview

When deploying Limitless Chat to production, you need to run **3 core services** plus several **external integrations**. Here's the complete breakdown:

### Core Services (Must Run)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SERVICES                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. FRONTEND SERVICE                                         │
│     ├── Static file server (Nginx/Apache)                   │
│     ├── React SPA (dist/ folder)                            │
│     ├── Port: 80/443 (HTTP/HTTPS)                           │
│     └── CDN recommended for assets                          │
│                                                               │
│  2. BACKEND SERVICE                                          │
│     ├── Node.js/Express server                              │
│     ├── tRPC API endpoints                                  │
│     ├── Port: 3000 (internal) → 443 (HTTPS)                │
│     ├── Multiple instances (load balanced)                  │
│     └── Environment: NODE_ENV=production                    │
│                                                               │
│  3. DATABASE SERVICE                                         │
│     ├── TiDB (MySQL compatible)                             │
│     ├── Port: 3306 (internal only)                          │
│     ├── Replicas for high availability                      │
│     ├── Automated backups                                   │
│     └── Connection pooling                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Service Breakdown

### 1. Frontend Service

**What it does:**
- Serves the compiled React application (static files)
- Handles routing redirects
- Serves assets (CSS, JavaScript, images)
- Implements caching headers

**Technology Options:**
- **Nginx** (recommended) - Lightweight, fast, reverse proxy
- **Apache** - Full-featured web server
- **Vercel/Netlify** - Managed frontend hosting
- **AWS S3 + CloudFront** - Serverless option

**Configuration Example (Nginx):**
```nginx
server {
    listen 80;
    server_name limitless-chat.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name limitless-chat.com;
    
    # SSL certificates
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    # Serve React app
    root /var/www/limitless-chat/dist;
    
    # SPA routing - redirect 404s to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Deployment:**
```bash
# Build React app
pnpm build

# Output: dist/ folder with compiled files
# Deploy dist/ to web server
# Restart Nginx
sudo systemctl restart nginx
```

### 2. Backend Service

**What it does:**
- Handles all API requests (tRPC procedures)
- Manages user authentication
- Processes chat requests
- Handles credit deductions
- Integrates with external APIs
- Streams responses to clients

**Technology:**
- Node.js 22.13.0+
- Express 4 framework
- tRPC 11 for RPC procedures
- Drizzle ORM for database access

**Configuration Example:**
```bash
# Environment variables (production)
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@tidb-host:3306/limitless_chat
JWT_SECRET=your-production-secret-key
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
OPENROUTER_API_KEY=your-openrouter-key
BUILT_IN_FORGE_API_KEY=your-forge-key
STRIPE_SECRET_KEY=your-stripe-secret
# ... other env vars
```

**Deployment (Docker recommended):**
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build if needed
RUN pnpm build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "dist/server/index.js"]
```

**Running Multiple Instances:**
```bash
# Instance 1
PORT=3001 node dist/server/index.js

# Instance 2
PORT=3002 node dist/server/index.js

# Instance 3
PORT=3003 node dist/server/index.js

# Load balancer routes to all three
# Nginx upstream configuration:
upstream backend {
    server backend1:3001;
    server backend2:3002;
    server backend3:3003;
    keepalive 32;
}
```

### 3. Database Service (TiDB)

**What it does:**
- Stores all application data
- Manages user accounts and sessions
- Stores chat history
- Tracks credit transactions
- Maintains project and template data

**Technology:**
- TiDB (MySQL-compatible distributed database)
- MySQL 5.7+ compatible
- ACID transactions
- High availability and scalability

**Setup Options:**

**Option A: Managed TiDB Cloud (Recommended)**
```
- Fully managed service
- Automatic backups
- Built-in replication
- Automatic scaling
- No infrastructure management
- Cost: ~$100-500/month depending on usage
```

**Option B: Self-hosted TiDB**
```
- Full control
- Lower cost for high volume
- Requires DevOps expertise
- Manual backups and maintenance
- Kubernetes deployment recommended
```

**Connection Configuration:**
```javascript
// server/db.ts
const DATABASE_URL = 'mysql://user:password@tidb-host:3306/limitless_chat';

// Connection pooling
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

**Backup Strategy:**
```bash
# Daily automated backups
0 2 * * * mysqldump -u user -p password limitless_chat > /backups/limitless_chat_$(date +\%Y\%m\%d).sql

# Backup retention: Keep 30 days
find /backups -name "limitless_chat_*.sql" -mtime +30 -delete

# Store backups off-site (S3)
aws s3 sync /backups s3://backup-bucket/limitless-chat/
```

## External Services (Third-party Integrations)

These services are **not hosted by you** but are essential for the application:

### 1. Manus OAuth (Authentication)
- **Purpose:** User login and authentication
- **Cost:** Included with Manus platform
- **Configuration:** Environment variables
- **Reliability:** Manus-managed (99.9% SLA)

### 2. OpenRouter API (LLM Models)
- **Purpose:** AI model access (GPT, Claude, Gemini, etc.)
- **Cost:** Pay-per-token ($0.001-$0.01 per 1K tokens)
- **Configuration:** API key in environment
- **Reliability:** OpenRouter-managed

### 3. Manus Forge API (Image Generation & Storage)
- **Purpose:** Image generation and S3 file storage
- **Cost:** Included with Manus platform
- **Configuration:** API keys in environment
- **Reliability:** Manus-managed

### 4. Stripe (Payment Processing)
- **Purpose:** Credit purchase and billing
- **Cost:** 2.9% + $0.30 per transaction
- **Configuration:** API keys and webhook secret
- **Reliability:** Stripe-managed (99.99% SLA)

### 5. S3 Storage (File Storage)
- **Purpose:** Store user-generated images and exports
- **Cost:** $0.023 per GB per month
- **Configuration:** AWS credentials
- **Reliability:** AWS-managed (99.99% SLA)

## Complete Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                                 │
│              (Nginx/AWS ALB/CloudFlare)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                ↓            ↓            ↓
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  FRONTEND    │ │  BACKEND     │ │  BACKEND     │
        │  (Nginx)     │ │  (Node.js)   │ │  (Node.js)   │
        │  Port: 443   │ │  Port: 3001  │ │  Port: 3002  │
        └──────────────┘ └──────┬───────┘ └──────┬───────┘
                                │                │
                                └────────┬───────┘
                                         │
                                         ↓
                        ┌────────────────────────────┐
                        │   DATABASE (TiDB)          │
                        │   Port: 3306 (internal)    │
                        │   - Primary                │
                        │   - Replica 1              │
                        │   - Replica 2              │
                        └────────────────────────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                ↓                        ↓                        ↓
        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
        │ OpenRouter   │        │ Manus OAuth  │        │ Stripe       │
        │ (LLM Models) │        │ (Auth)       │        │ (Payments)   │
        └──────────────┘        └──────────────┘        └──────────────┘
                ↓                        ↓                        ↓
        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
        │ Manus Forge  │        │ S3 Storage   │        │ Webhooks     │
        │ (Images)     │        │ (Files)      │        │ (Payments)   │
        └──────────────┘        └──────────────┘        └──────────────┘
```

## Deployment Checklist

### Pre-deployment
- [ ] All environment variables configured
- [ ] SSL/TLS certificates obtained
- [ ] Database backups configured
- [ ] API keys and secrets secured
- [ ] Load balancer configured
- [ ] DNS records updated
- [ ] Monitoring and logging set up

### Deployment Steps
- [ ] Build frontend: `pnpm build`
- [ ] Deploy frontend to web server
- [ ] Build backend: `pnpm build`
- [ ] Deploy backend Docker image
- [ ] Run database migrations: `pnpm db:push`
- [ ] Configure environment variables
- [ ] Start backend services
- [ ] Verify all services are running
- [ ] Run health checks
- [ ] Monitor logs for errors

### Post-deployment
- [ ] Test user login flow
- [ ] Test chat functionality
- [ ] Test credit system
- [ ] Test payment processing
- [ ] Monitor server performance
- [ ] Set up alerts for failures
- [ ] Configure auto-scaling rules

## Scaling Considerations

### Horizontal Scaling (Add more servers)

**Frontend:**
- Deploy to multiple regions
- Use CDN for global distribution
- Cache static assets

**Backend:**
- Run 3-5 instances behind load balancer
- Use connection pooling
- Implement caching layer (Redis)

**Database:**
- Primary + 2 replicas minimum
- Read replicas for scaling reads
- Sharding if needed (future)

### Vertical Scaling (Bigger servers)

**Recommended Specs:**

**Frontend Server:**
- CPU: 2 cores
- RAM: 2 GB
- Storage: 10 GB

**Backend Server (per instance):**
- CPU: 4 cores
- RAM: 4 GB
- Storage: 20 GB

**Database Server:**
- CPU: 8+ cores
- RAM: 16+ GB
- Storage: 100+ GB (SSD)

## Cost Estimation

### Monthly Production Costs

| Service | Cost | Notes |
|---------|------|-------|
| Frontend (Nginx) | $10-20 | Small VPS |
| Backend (3 instances) | $30-60 | Small VPS × 3 |
| Database (TiDB Cloud) | $100-300 | Managed service |
| S3 Storage | $5-50 | Depends on usage |
| Stripe Fees | 2.9% + $0.30 | Per transaction |
| OpenRouter API | Variable | Pay-per-token |
| SSL Certificate | $0-100 | Annual |
| **Total** | **$150-600+** | Varies with usage |

## Monitoring & Maintenance

### Key Metrics to Monitor

```bash
# Backend health
- CPU usage < 70%
- Memory usage < 80%
- Response time < 500ms
- Error rate < 0.1%

# Database health
- Query response time < 100ms
- Connection pool usage < 80%
- Replication lag < 1 second
- Disk usage < 80%

# Application metrics
- Active users
- Chat messages per hour
- Credits purchased
- API errors
- Payment success rate
```

### Monitoring Tools

- **Application Monitoring:** New Relic, Datadog, Sentry
- **Database Monitoring:** TiDB Cloud console, Prometheus
- **Log Aggregation:** ELK Stack, Splunk, CloudWatch
- **Uptime Monitoring:** Pingdom, UptimeRobot, Datadog

### Maintenance Tasks

```bash
# Daily
- Check server logs for errors
- Monitor database performance
- Verify backups completed

# Weekly
- Review performance metrics
- Check for security updates
- Test backup restoration

# Monthly
- Update dependencies
- Review cost optimization
- Capacity planning
- Security audit
```

## Disaster Recovery

### Backup Strategy

```bash
# Database backups
- Frequency: Daily
- Retention: 30 days
- Location: Off-site (S3)
- Test restoration: Weekly

# Code backups
- Git repository (GitHub)
- Automated daily snapshots
- Off-site storage

# Configuration backups
- Environment variables
- SSL certificates
- Database credentials
```

### Recovery Procedures

**Database Failure:**
1. Failover to replica (automatic)
2. Promote replica to primary
3. Restore from backup if needed
4. Verify data integrity
5. Resume operations

**Backend Failure:**
1. Restart service
2. Check logs for errors
3. Failover to healthy instance
4. Scale up if needed

**Complete Outage:**
1. Restore database from backup
2. Deploy latest code
3. Verify all services
4. Restore user sessions if needed

## Security Checklist

- [ ] HTTPS/TLS enabled
- [ ] Firewall configured
- [ ] Database access restricted to backend
- [ ] API keys rotated regularly
- [ ] Secrets not in code
- [ ] SQL injection prevention (ORM)
- [ ] XSS protection (React)
- [ ] CSRF protection
- [ ] Rate limiting enabled
- [ ] Logging and monitoring active
- [ ] Regular security updates
- [ ] Penetration testing scheduled

## Conclusion

For production deployment of Limitless Chat, you need to manage **3 core services:**

1. **Frontend** - Static file server (Nginx/Vercel)
2. **Backend** - Node.js/Express application (3+ instances)
3. **Database** - TiDB (managed or self-hosted)

Plus integration with **5 external services** (Manus OAuth, OpenRouter, Manus Forge, Stripe, S3).

The total infrastructure is relatively simple but requires proper configuration, monitoring, and maintenance for production reliability.
