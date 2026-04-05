# CollectiQ Deployment Guide

## 🚀 Production Deployment Setup

### Frontend Deployment (Vercel)

1. **Vercel Configuration**
   - Build command: `npm run build:web`
   - Start command: `npm start` (not needed for static site)
   - Framework: Vite

2. **Environment Variables (Vercel Dashboard)**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   VITE_API_URL=                          # Leave empty - vercel.json rewrites proxy to Railway
   ```

3. **How It Works**
   - Vercel's `vercel.json` rewrites `/api/*` requests to the Railway backend
   - Frontend makes requests to `/api/...` (relative URLs)
   - Vercel rewrite rule sends them to `https://collectiq-api-production.up.railway.app/api/$1`
   - No need to hardcode API URL

---

### Backend Deployment (Railway)

1. **Railway Configuration**
   - GitHub repo: Connect directly
   - Build command: Leave empty (auto-detected from package.json)
   - Start command: `npm run start` (from root package.json workspace)
   - Or for API only: `npm --workspace=apps/api start`

2. **Environment Variables (Railway Dashboard)**

   **Critical - Set these or deployment will FAIL:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://collecti-q-web.vercel.app
   ```

3. **Validation**
   - Server will fail to start if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing in production
   - Check Railway logs: `railway logs` or via Railway dashboard
   - Health check: `GET https://collectiq-api-production.up.railway.app/api/health`

---

## 🔧 Development Setup

### Local Development
```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm run dev

# Or run individually:
npm run dev:web    # on http://localhost:5173
npm run dev:api    # on http://localhost:3001
```

### Environment File (.env)
```
# Backend (apps/api reads from root .env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (Vite env vars)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# API settings
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Issue: "Missing SUPABASE_URL" error on Railway
**Solution:** Set environment variables in Railway dashboard under "Variables"

### Issue: Frontend can't connect to backend
1. Check that `/api/health` returns `{"status":"ok"}`
2. Verify CORS is working: Check browser console for CORS errors
3. Check that Vercel rewrite rule is correct in `vercel.json`
4. Ensure Railway API is running and accessible

### Issue: "Invalid or expired token" errors
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Try logging out and logging back in
3. Check token expiration in browser dev tools

### Issue: Database operations failing
1. Verify Supabase credentials are correct
2. Check that RPC functions exist in Supabase database
3. Check Supabase logs for SQL errors
4. Ensure Row Level Security (RLS) policies are configured correctly

---

## 📊 Deployed URLs

- **Frontend:** https://collecti-q-web.vercel.app
- **Backend API:** https://collectiq-api-production.up.railway.app
- **Health Check:** https://collectiq-api-production.up.railway.app/api/health
- **Supabase Dashboard:** https://app.supabase.com

---

## 🔐 Security Notes

1. **Never commit `.env` file** (it's in .gitignore)
2. **SERVICE_ROLE_KEY is sensitive** - only for backend
3. **ANON_KEY is safe** - can be public (it's in Supabase)
4. **CORS is restricted** - only allows Vercel frontend + Railway API
5. **In production, NODE_ENV must be set to "production"** - otherwise auth middleware uses mock user

---

## 📝 Deployment Checklist

- [ ] Supabase credentials are correct
- [ ] NODE_ENV set to "production" on Railway
- [ ] CORS origins include both Vercel and Railway domains
- [ ] Health check passes: `curl https://collectiq-api-production.up.railway.app/api/health`
- [ ] Frontend can login (check browser console for errors)
- [ ] Database seeding succeeds on first deployment
- [ ] Monitor Railway logs for any errors
