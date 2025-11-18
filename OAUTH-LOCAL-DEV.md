# OAuth Configuration for Local Development

## Problem

When running Limitless Chat locally, you get this error:

```
[internal] authorization failed: invalid redirect_uri: redirect_uri domain 'localhost' not allowed for this project
```

This happens because the OAuth application is configured to only allow specific redirect URIs (domains), and `localhost` is not in the allowed list.

## Solution

You need to add `localhost` redirect URIs to your Manus OAuth application configuration.

## Step-by-Step Guide

### 1. Access Manus Platform Dashboard

1. Go to https://manus.im
2. Log in with your account
3. Navigate to **Projects** or **Applications**
4. Find your project (e.g., "Limitless Chat")

### 2. Find OAuth Configuration

1. Click on your project to open settings
2. Look for **OAuth Settings**, **Authentication**, or **App Configuration**
3. Find the **Redirect URIs** section

### 3. Add Localhost Redirect URIs

Add the following redirect URIs for local development:

```
http://localhost:5173/api/oauth/callback
http://localhost:3000/api/oauth/callback
http://127.0.0.1:5173/api/oauth/callback
http://127.0.0.1:3000/api/oauth/callback
```

**Explanation:**
- `localhost:5173` - Vite dev server (frontend)
- `localhost:3000` - Backend server (for testing)
- `127.0.0.1:5173` - Alternative localhost address
- `127.0.0.1:3000` - Alternative localhost address

### 4. Save Configuration

1. Click **Save** or **Update**
2. Wait for changes to propagate (usually instant)
3. Clear your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

### 5. Test Login

1. Start your development server: `docker-compose -f docker-compose.dev.yml up -d`
2. Open http://localhost:5173
3. Click **Login**
4. You should now be able to log in without the redirect URI error

## How OAuth Redirect URIs Work

### What is a Redirect URI?

A redirect URI is the URL where the OAuth provider sends the user **after** they successfully authenticate. It must be:
- **Exact match** - The domain must match exactly
- **HTTPS in production** - For security
- **HTTP allowed in development** - For local testing
- **Pre-registered** - Added to the OAuth app before use

### How Limitless Chat Uses Redirect URIs

```
User clicks "Login"
    ↓
Frontend generates login URL with redirect URI:
    https://manus.im/app-auth?appId=...&redirectUri=http://localhost:5173/api/oauth/callback
    ↓
User logs in on Manus OAuth portal
    ↓
OAuth server redirects to: http://localhost:5173/api/oauth/callback?code=...&state=...
    ↓
Backend exchanges code for token
    ↓
User is logged in!
```

### Why It Fails

If `localhost` is not in the allowed list, the OAuth server rejects the redirect:

```
User logs in successfully
    ↓
OAuth server tries to redirect to: http://localhost:5173/api/oauth/callback
    ↓
ERROR: "localhost" not in allowed redirect URIs
    ↓
Login fails
```

## Development vs Production

### Development (Local)

**Allowed URIs:**
```
http://localhost:5173/api/oauth/callback
http://localhost:3000/api/oauth/callback
http://127.0.0.1:5173/api/oauth/callback
```

**Why HTTP:**
- Local development doesn't require HTTPS
- Easier to test without SSL certificates

### Production (Deployed)

**Allowed URIs:**
```
https://limitless-chat.com/api/oauth/callback
https://www.limitless-chat.com/api/oauth/callback
```

**Why HTTPS:**
- Required for security
- OAuth tokens transmitted over HTTPS only
- Production standard

## Troubleshooting

### Issue: Still Getting Redirect URI Error After Adding Localhost

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear cookies for localhost
3. Close and reopen browser
4. Try incognito/private window
5. Verify the exact URL matches (case-sensitive)

### Issue: Login Works on localhost:5173 but Not localhost:3000

**Solution:**
- Add both `localhost:5173` and `localhost:3000` to redirect URIs
- Different ports are treated as different domains

### Issue: Login Works on localhost but Not on 127.0.0.1

**Solution:**
- Add both `localhost` and `127.0.0.1` to redirect URIs
- They are treated as different domains by OAuth

### Issue: Getting "Invalid State" Error

**Solution:**
1. Clear browser cookies
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Try incognito window
4. Check that `VITE_OAUTH_PORTAL_URL` is correct in `.env`

## Environment Variables

Make sure these are set correctly in your `.env`:

```bash
# OAuth Configuration
VITE_APP_ID=2o6a4NB7y9QQbVLpTiGe6g
VITE_OAUTH_PORTAL_URL=https://manus.im
OAUTH_SERVER_URL=https://api.manus.im
```

## Testing Locally

### Using Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Frontend will be at http://localhost:5173
# Backend will be at http://localhost:3000
```

### Using Local Development Server

```bash
# Terminal 1: Start backend
pnpm dev

# Terminal 2: Start frontend (in another terminal)
cd client
pnpm dev

# Frontend will be at http://localhost:5173
# Backend will be at http://localhost:3000
```

### Manual Testing

```bash
# 1. Generate login URL manually
# Open browser console and run:
const redirectUri = 'http://localhost:5173/api/oauth/callback';
const state = btoa(redirectUri);
const url = new URL('https://manus.im/app-auth');
url.searchParams.set('appId', '2o6a4NB7y9QQbVLpTiGe6g');
url.searchParams.set('redirectUri', redirectUri);
url.searchParams.set('state', state);
url.searchParams.set('type', 'signIn');
console.log(url.toString());

# 2. Copy the URL and open in browser
# 3. Log in and verify redirect works
```

## How the App Generates Redirect URIs

The redirect URI is generated dynamically based on the current origin:

**File: `client/src/const.ts`**
```typescript
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
```

**How it works:**
- `window.location.origin` = `http://localhost:5173` (in dev)
- `redirectUri` = `http://localhost:5173/api/oauth/callback`
- This is sent to the OAuth server
- The OAuth server checks if this URI is in the allowed list

## OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OAUTH LOGIN FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Login" on frontend
   ↓
2. Frontend generates login URL with redirect URI
   const redirectUri = 'http://localhost:5173/api/oauth/callback'
   ↓
3. Frontend redirects to OAuth portal
   https://manus.im/app-auth?appId=...&redirectUri=...
   ↓
4. User logs in on OAuth portal
   ↓
5. OAuth server validates redirect URI
   ✓ Is 'http://localhost:5173/api/oauth/callback' in allowed list?
   ✗ NO → Error: "invalid redirect_uri"
   ✓ YES → Continue
   ↓
6. OAuth server redirects to redirect URI with auth code
   http://localhost:5173/api/oauth/callback?code=...&state=...
   ↓
7. Frontend receives auth code
   ↓
8. Frontend sends code to backend
   POST /api/oauth/callback?code=...&state=...
   ↓
9. Backend exchanges code for token
   POST https://api.manus.im/webdev.v1.WebDevAuthPublicService/ExchangeToken
   ↓
10. Backend receives access token
    ↓
11. Backend creates session token (JWT)
    ↓
12. Backend sets session cookie
    ↓
13. User is logged in!
```

## Quick Reference

| Environment | Redirect URI | HTTPS | Notes |
|-------------|--------------|-------|-------|
| Local Dev | http://localhost:5173/api/oauth/callback | ❌ | Development only |
| Local Dev | http://127.0.0.1:5173/api/oauth/callback | ❌ | Alternative localhost |
| Production | https://limitless-chat.com/api/oauth/callback | ✅ | Must be HTTPS |
| Production | https://www.limitless-chat.com/api/oauth/callback | ✅ | With www prefix |

## Summary

To enable OAuth login on your local development machine:

1. **Add these redirect URIs** to your Manus OAuth app:
   - `http://localhost:5173/api/oauth/callback`
   - `http://localhost:3000/api/oauth/callback`
   - `http://127.0.0.1:5173/api/oauth/callback`

2. **Clear browser cache and cookies**

3. **Restart your development server**

4. **Test login** - You should now be able to log in without errors

If you still have issues, check:
- Exact URL match (case-sensitive)
- Browser cache cleared
- Correct environment variables set
- OAuth app settings saved
