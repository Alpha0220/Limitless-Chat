# Nginx Setup Guide for Limitless Chat Frontend

## Frontend Architecture

You're absolutely correct! Limitless Chat frontend is a **React Static SPA (Single Page Application)**, not a server-side rendered framework like Next.js.

### Frontend Build Process

```
React Source Code (TypeScript + Tailwind)
    ↓
Vite Build Process
    ↓
Static Files (dist/ folder)
├── index.html
├── assets/
│   ├── js/ (bundled JavaScript)
│   ├── css/ (bundled CSS)
│   └── images/ (static assets)
└── favicon.ico
    ↓
Served by Nginx (Static File Server)
    ↓
Browser (Client-side routing with Wouter)
```

### Why Nginx?

- **Lightweight** - Minimal resource usage
- **Fast** - Optimized for static file serving
- **Reverse Proxy** - Can proxy API requests to backend
- **Caching** - Built-in caching headers support
- **SSL/TLS** - Native HTTPS support
- **Load Balancing** - Can distribute traffic
- **Production-Ready** - Used by major companies

## Build and Deployment Process

### Step 1: Build React Application

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Output: dist/ folder with compiled static files
# Size: ~500KB-1MB (gzipped)
```

### Step 2: Deploy to Server

```bash
# Copy dist folder to server
scp -r dist/ user@server:/var/www/limitless-chat/

# Or using rsync
rsync -avz dist/ user@server:/var/www/limitless-chat/
```

### Step 3: Configure Nginx

See detailed configuration below.

## Nginx Configuration

### Basic Configuration

**File: `/etc/nginx/sites-available/limitless-chat`**

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name limitless-chat.com www.limitless-chat.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name limitless-chat.com www.limitless-chat.com;
    
    # ===== SSL Configuration =====
    ssl_certificate /etc/ssl/certs/limitless-chat.com.crt;
    ssl_certificate_key /etc/ssl/private/limitless-chat.com.key;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # ===== Security Headers =====
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # ===== Root Directory =====
    root /var/www/limitless-chat;
    index index.html;
    
    # ===== Gzip Compression =====
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_vary on;
    
    # ===== Static Assets Caching =====
    # Cache assets with content hash for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # ===== SPA Routing =====
    # All requests go to index.html for client-side routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Don't cache index.html
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # ===== API Proxy =====
    # Proxy /api requests to backend server
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # ===== Health Check Endpoint =====
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # ===== Deny Access to Sensitive Files =====
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Enable Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/limitless-chat /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Verify Nginx is running
sudo systemctl status nginx
```

## SSL/TLS Certificate Setup

### Option 1: Let's Encrypt (Free, Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d limitless-chat.com -d www.limitless-chat.com

# Auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal
sudo certbot renew --dry-run
```

### Option 2: Commercial Certificate

```bash
# Purchase from provider (GoDaddy, Namecheap, etc.)
# Place certificate files:
# - /etc/ssl/certs/limitless-chat.com.crt
# - /etc/ssl/private/limitless-chat.com.key

# Verify certificate
openssl x509 -in /etc/ssl/certs/limitless-chat.com.crt -text -noout
```

## Docker Deployment

### Dockerfile for Nginx

**File: `Dockerfile.nginx`**

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build React app
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY limitless-chat.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /var/www/limitless-chat

# Create non-root user
RUN addgroup -g 101 -S nginx && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Expose port
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

**File: `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl:ro  # SSL certificates
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - NGINX_HOST=limitless-chat.com
      - NGINX_PORT=80
    restart: unless-stopped
    networks:
      - limitless-chat

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      # ... other env vars
    restart: unless-stopped
    networks:
      - limitless-chat
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=limitless_chat
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - limitless-chat

networks:
  limitless-chat:
    driver: bridge

volumes:
  db_data:
```

### Build and Run

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f frontend

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Performance Optimization

### 1. Asset Optimization

**Vite Configuration (client/vite.config.ts):**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'trpc': ['@trpc/client', '@trpc/react-query'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    },
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    },
    // Source maps (optional)
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  }
})
```

### 2. Nginx Caching

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header ETag "\"$file_mtime\"";
}

# Cache busting with content hash
# Vite automatically adds hash to filenames:
# - app.abc123def456.js (cached for 1 year)
# - index.html (not cached, always fresh)
```

### 3. CDN Integration (Optional)

```nginx
# Serve assets from CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    # Redirect to CDN
    rewrite ^/assets/(.*)$ https://cdn.limitless-chat.com/assets/$1 permanent;
}
```

### 4. Monitoring Performance

```bash
# Check Nginx performance
ab -n 1000 -c 100 https://limitless-chat.com/

# Monitor with curl
curl -I https://limitless-chat.com/

# Check gzip compression
curl -I -H "Accept-Encoding: gzip" https://limitless-chat.com/
```

## Troubleshooting

### Issue: CORS Errors

**Solution: Add CORS headers to Nginx**

```nginx
location /api {
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    proxy_pass http://backend:3000;
}
```

### Issue: 404 on Page Refresh

**Solution: Redirect to index.html (already in config)**

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Issue: Slow Page Loads

**Solution: Check gzip compression**

```bash
# Verify gzip is working
curl -I -H "Accept-Encoding: gzip" https://limitless-chat.com/

# Should see: Content-Encoding: gzip
```

### Issue: SSL Certificate Errors

**Solution: Check certificate validity**

```bash
# Check certificate
openssl x509 -in /etc/ssl/certs/limitless-chat.com.crt -text -noout

# Check key
openssl rsa -in /etc/ssl/private/limitless-chat.com.key -check

# Verify certificate matches key
openssl x509 -noout -modulus -in /etc/ssl/certs/limitless-chat.com.crt | openssl md5
openssl rsa -noout -modulus -in /etc/ssl/private/limitless-chat.com.key | openssl md5
```

## Deployment Checklist

- [ ] React app built: `pnpm build`
- [ ] dist/ folder created with all assets
- [ ] Nginx installed on server
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Nginx configuration created
- [ ] dist/ folder copied to `/var/www/limitless-chat`
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Test HTTPS: `curl https://limitless-chat.com`
- [ ] Test SPA routing: Visit `/` and refresh
- [ ] Test API proxy: Check `/api` requests work
- [ ] Check gzip compression
- [ ] Verify caching headers
- [ ] Monitor logs: `sudo tail -f /var/log/nginx/access.log`

## File Structure on Server

```
/var/www/limitless-chat/
├── index.html                    # Main entry point
├── favicon.ico
└── assets/
    ├── js/
    │   ├── index.abc123.js       # Main bundle (hashed)
    │   ├── vendor.def456.js      # Vendor bundle
    │   └── ui.ghi789.js          # UI bundle
    ├── css/
    │   └── style.jkl012.css      # Styles (hashed)
    └── images/
        ├── logo.png
        └── ...
```

## Summary

**Your Frontend Architecture:**

```
React Source Code (TypeScript + Tailwind)
    ↓
Vite Build → dist/ (Static Files)
    ↓
Nginx Server (Reverse Proxy + Static File Server)
    ├── Serves static files (index.html, JS, CSS, images)
    ├── Handles SPA routing (all requests → index.html)
    ├── Proxies /api requests to backend
    └── Manages SSL/TLS, caching, compression
    ↓
Browser (Client-side routing with Wouter)
```

This is the correct and efficient approach for a React SPA application!
