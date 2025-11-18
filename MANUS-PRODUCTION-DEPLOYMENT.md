# Deploying Limitless Chat to Manus Production

## Overview

Yes! You can deploy Limitless Chat to Manus as a production application. Manus provides a complete managed platform that handles:

- **Frontend hosting** - Automatic builds and CDN distribution
- **Backend server** - Managed Node.js runtime
- **Database** - TiDB Cloud integration (MySQL-compatible)
- **SSL/TLS** - Automatic HTTPS with Let's Encrypt
- **Custom domains** - Bind your own domain
- **Environment management** - Secure secrets and configuration
- **Monitoring & logs** - Built-in analytics and error tracking
- **Auto-scaling** - Handles traffic spikes automatically

## Architecture on Manus

```
┌─────────────────────────────────────────────────────────────┐
│                    MANUS PLATFORM                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (React Static Files)                       │   │
│  │  - Vite build output (dist/)                         │   │
│  │  - Served via CDN                                    │   │
│  │  - Auto-deployed on git push                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend (Node.js/Express)                           │   │
│  │  - tRPC API endpoints                                │   │
│  │  - OAuth callback handler                            │   │
│  │  - Credit system                                     │   │
│  │  - Image generation integration                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (TiDB Cloud)                               │   │
│  │  - MySQL-compatible                                  │   │
│  │  - Automatic backups                                 │   │
│  │  - Replication & failover                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  External Services (via API)                         │   │
│  │  - OpenRouter (LLM models)                           │   │
│  │  - Manus Forge (Image generation)                    │   │
│  │  - Stripe (Payments)                                 │   │
│  │  - S3 (File storage)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### Step 1: Prepare Your Project

Ensure your project is ready for production:

```bash
# 1. Make sure all changes are committed
git status

# 2. Push to main branch (or your production branch)
git push origin main

# 3. Verify all environment variables are set
# Check Settings → Secrets in Manus dashboard
```

### Step 2: Configure Production Environment

In the Manus Management UI:

1. **Go to Settings → General**
   - Set `VITE_APP_TITLE` to your production name
   - Set `VITE_APP_LOGO` to your production logo

2. **Go to Settings → Secrets**
   - Verify all API keys are set:
     - `OPENROUTER_API_KEY`
     - `BUILT_IN_FORGE_API_KEY`
     - `STRIPE_SECRET_KEY` (if using payments)
     - `FAL_AI_API_KEY` (if using image generation)

3. **Go to Settings → Domains**
   - Bind your custom domain (e.g., `limitless-chat.com`)
   - Or use the auto-generated Manus domain

### Step 3: Configure OAuth for Production

Update your Manus OAuth application:

1. **Go to Manus Dashboard** → Your Project
2. **Find OAuth Settings**
3. **Add production redirect URIs:**
   ```
   https://limitless-chat.com/api/oauth/callback
   https://www.limitless-chat.com/api/oauth/callback
   https://your-manus-domain.manus.space/api/oauth/callback
   ```
4. **Save settings**

### Step 4: Deploy to Production

#### Option A: Automatic Deployment (Recommended)

Manus automatically deploys when you push to your production branch:

```bash
# 1. Make sure everything is committed
git add .
git commit -m "Production release v1.0.0"

# 2. Push to main branch
git push origin main

# 3. Manus automatically:
#    - Detects the push
#    - Builds the project
#    - Runs tests
#    - Deploys to production
#    - Updates the live site

# 4. Monitor deployment in Manus Dashboard
# Go to Dashboard → Deployments
```

#### Option B: Manual Deployment via Dashboard

1. **Go to Manus Management UI**
2. **Click "Publish" button** (top right)
3. **Select the checkpoint** to deploy
4. **Confirm deployment**
5. **Wait for build to complete**

### Step 5: Verify Production Deployment

```bash
# 1. Check if site is live
curl https://limitless-chat.com

# 2. Test login flow
# Visit https://limitless-chat.com
# Click Login
# Verify OAuth redirect works

# 3. Test API endpoints
curl https://limitless-chat.com/api/trpc/auth.me

# 4. Check logs
# Go to Manus Dashboard → Logs
# Look for any errors
```

## Production Checklist

Before deploying to production:

- [ ] All code committed to git
- [ ] All environment variables configured in Manus Secrets
- [ ] OAuth redirect URIs updated for production domain
- [ ] Database migrations run successfully
- [ ] All API keys are valid and active
- [ ] SSL certificate configured (automatic on Manus)
- [ ] Custom domain configured (if using custom domain)
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured
- [ ] Error tracking enabled (Sentry, etc.)

## Environment Variables for Production

Make sure these are set in Manus Settings → Secrets:

```bash
# Authentication
JWT_SECRET=your-production-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# APIs
OPENROUTER_API_KEY=your-production-key
BUILT_IN_FORGE_API_KEY=your-production-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
STRIPE_SECRET_KEY=sk_live_your-production-key

# Database (Manus manages this)
DATABASE_URL=mysql://user:pass@host/db

# Branding
VITE_APP_TITLE=Limitless Chat
VITE_APP_LOGO=https://your-cdn.com/logo.png
```

## Scaling on Manus

Manus automatically handles scaling:

### Automatic Scaling
- **Frontend:** CDN automatically scales with traffic
- **Backend:** Auto-scales based on CPU/memory usage
- **Database:** TiDB Cloud handles scaling automatically

### Manual Scaling
If you need more resources:

1. **Go to Settings → Resources**
2. **Increase backend instances** (if available)
3. **Increase database tier** (if needed)
4. **Save changes**

## Monitoring & Logs

### View Application Logs

```bash
# In Manus Dashboard:
# 1. Go to Dashboard → Logs
# 2. Filter by:
#    - Service (Frontend/Backend)
#    - Time range
#    - Log level (Error, Warning, Info)
```

### Monitor Performance

```bash
# In Manus Dashboard:
# 1. Go to Dashboard → Analytics
# 2. View:
#    - Request count
#    - Response time
#    - Error rate
#    - CPU/Memory usage
```

### Set Up Alerts

```bash
# In Manus Dashboard:
# 1. Go to Settings → Notifications
# 2. Configure alerts for:
#    - High error rate
#    - High latency
#    - Database issues
#    - Deployment failures
```

## Rollback Strategy

If something goes wrong in production:

### Option 1: Rollback to Previous Checkpoint

```bash
# In Manus Dashboard:
# 1. Go to Dashboard → Deployments
# 2. Find previous successful deployment
# 3. Click "Rollback"
# 4. Confirm rollback
# 5. Site reverts to previous version
```

### Option 2: Revert Git Commit

```bash
# 1. Revert the problematic commit
git revert <commit-hash>

# 2. Push to main
git push origin main

# 3. Manus automatically deploys the reverted code
```

## Backup & Disaster Recovery

### Database Backups

Manus automatically backs up your database:

```bash
# In Manus Dashboard:
# 1. Go to Database → Backups
# 2. View automatic daily backups
# 3. Download backup if needed
# 4. Restore from backup (if disaster occurs)
```

### Code Backups

Your code is backed up via git:

```bash
# Your GitHub repository is the backup
# All commits are preserved
# You can always revert to any previous commit
```

## Cost Estimation

Typical production costs on Manus:

| Component | Cost | Notes |
|-----------|------|-------|
| Frontend | $10-20/month | CDN + static hosting |
| Backend | $30-100/month | Auto-scaling instances |
| Database | $100-300/month | TiDB Cloud tier |
| Storage | $5-50/month | S3 for files |
| **Total** | **$150-500/month** | Varies with usage |

## Troubleshooting Production Issues

### Issue: Site Returns 500 Error

```bash
# 1. Check backend logs
# Dashboard → Logs → Filter by "error"

# 2. Check database connection
# Dashboard → Database → Connection status

# 3. Verify environment variables
# Settings → Secrets → Verify all keys are set

# 4. Restart backend
# Dashboard → Services → Restart Backend
```

### Issue: Login Not Working

```bash
# 1. Verify OAuth redirect URIs
# Manus OAuth Settings → Check production domain is added

# 2. Check OAuth logs
# Dashboard → Logs → Filter by "oauth"

# 3. Verify environment variables
# Settings → Secrets → Check VITE_APP_ID, OAUTH_SERVER_URL

# 4. Clear browser cache and cookies
# Try incognito window
```

### Issue: Database Connection Timeout

```bash
# 1. Check database status
# Dashboard → Database → Status

# 2. Check connection string
# Settings → Secrets → DATABASE_URL

# 3. Restart database
# Dashboard → Database → Restart

# 4. Check firewall rules
# Database → Network → Verify IP whitelist
```

### Issue: High Latency or Timeouts

```bash
# 1. Check backend performance
# Dashboard → Analytics → Response time

# 2. Check database performance
# Dashboard → Database → Query performance

# 3. Scale up resources
# Settings → Resources → Increase instances

# 4. Optimize queries
# Review slow query logs
# Add database indexes
```

## CI/CD Pipeline

Manus provides built-in CI/CD:

```
Git Push to main
    ↓
Manus detects push
    ↓
Build project
    ├─ Install dependencies
    ├─ Run tests
    ├─ Build frontend
    └─ Build backend
    ↓
Run migrations
    ↓
Deploy to production
    ├─ Update frontend
    ├─ Restart backend
    └─ Update database
    ↓
Run smoke tests
    ↓
Production live!
```

## Security Best Practices

### 1. Secrets Management

- Never commit `.env` files
- Use Manus Settings → Secrets for all sensitive data
- Rotate API keys regularly

### 2. Database Security

- Use strong passwords
- Enable SSL for database connections
- Restrict database access to backend only
- Regular backups

### 3. API Security

- Validate all inputs
- Use HTTPS only (automatic on Manus)
- Implement rate limiting
- Monitor for suspicious activity

### 4. OAuth Security

- Keep OAuth secrets secure
- Use HTTPS for redirect URIs
- Validate state parameter
- Implement CSRF protection

## Comparison: Manus vs Self-Hosted

| Feature | Manus | Self-Hosted |
|---------|-------|-------------|
| Setup time | 5 minutes | 1-2 days |
| Maintenance | Managed | Your responsibility |
| Scaling | Automatic | Manual |
| Backups | Automatic | Manual |
| SSL/TLS | Automatic | Manual |
| Monitoring | Built-in | Third-party tools |
| Cost | Predictable | Variable |
| Uptime SLA | 99.9% | Depends on you |

## Next Steps

1. **Prepare your project** - Ensure all code is committed
2. **Configure production environment** - Set secrets and variables
3. **Update OAuth settings** - Add production redirect URIs
4. **Deploy to Manus** - Push to main or use Publish button
5. **Test production** - Verify all features work
6. **Monitor** - Set up alerts and monitoring
7. **Iterate** - Make improvements based on user feedback

## Support & Documentation

- **Manus Documentation:** https://docs.manus.im
- **GitHub Repository:** https://github.com/techaploog/limitless-chat
- **Issues & Support:** https://help.manus.im

## Summary

**Yes, you can absolutely use Manus to serve this project as production!**

Manus provides:
- ✅ Automatic deployment from git
- ✅ Managed database (TiDB Cloud)
- ✅ Automatic SSL/HTTPS
- ✅ Custom domain support
- ✅ Auto-scaling
- ✅ Monitoring & logs
- ✅ Backup & disaster recovery
- ✅ Production-ready infrastructure

Simply push your code to the main branch, and Manus will automatically build and deploy your application to production!
