# Render Deployment Guide

This guide will help you deploy SmartResumeScanner to Render with PostgreSQL database.

## 📋 Prerequisites

- ✅ Render account (https://render.com)
- ✅ GitHub account (to connect your repository)
- ✅ Your repository pushed to GitHub

## 🗄️ Your Render PostgreSQL Database

You already have a Render PostgreSQL database with these details:

```
Host: dpg-d3loi815pdvs73am41sg-a.oregon-postgres.render.com
Database: smartresumescanner_y63p
User: smartresumescanner_y63p_user
Password: QYL5oC7i3BdI14CefgFROo34WmXgb1HV
Port: 5432
```

## 🚀 Quick Start - Test Locally with Render Database

### Option 1: Update Your Local .env

Edit your `.env` file and comment out local database, uncomment Render database:

```env
# === DATABASE CONFIGURATION ===

# LOCAL PostgreSQL (for development) - COMMENTED OUT
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=SmartResumeScanner
# DB_USER=postgres
# DB_PASSWORD=Ayush@7921
# DB_SSL=false

# RENDER PostgreSQL (Production) - ACTIVE
DB_HOST=dpg-d3loi815pdvs73am41sg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=smartresumescanner_y63p
DB_USER=smartresumescanner_y63p_user
DB_PASSWORD=QYL5oC7i3BdI14CefgFROo34WmXgb1HV
DB_SSL=true
```

### Option 2: Use the .env.render File

Copy the pre-configured `.env.render` file:

```bash
# Windows PowerShell
Copy-Item .env.render .env

# Or manually copy the file
```

### Test Connection

1. **Test database connection:**
```bash
npm run db:status
```

You should see:
```
✅ Database connection successful
PostgreSQL version: PostgreSQL 15.x
```

2. **Run migration to create tables:**
```bash
npm run db:migrate
```

3. **Verify tables were created:**
```bash
npm run db:status
```

You should see all 5 tables with 0 rows.

4. **Start your application:**
```bash
npm run dev
```

Your app is now connected to Render PostgreSQL! 🎉

## 📊 View Your Data in Render Dashboard

1. Go to https://dashboard.render.com
2. Navigate to your PostgreSQL database
3. Click "Connect" → "External Connection"
4. You can use pgAdmin or any PostgreSQL client to connect using the credentials

## 🔧 Connecting from pgAdmin 4

1. Open pgAdmin 4
2. Right-click "Servers" → "Register" → "Server"
3. **General tab:**
   - Name: `Render - SmartResumeScanner`
4. **Connection tab:**
   - Host: `dpg-d3loi815pdvs73am41sg-a.oregon-postgres.render.com`
   - Port: `5432`
   - Maintenance database: `smartresumescanner_y63p`
   - Username: `smartresumescanner_y63p_user`
   - Password: `QYL5oC7i3BdI14CefgFROo34WmXgb1HV`
5. **SSL tab:**
   - SSL mode: `Require`
6. Click "Save"

Now you can view and manage your Render database from pgAdmin!

## 🌐 Deploying to Render (Web Service)

### Step 1: Push Your Code to GitHub

```bash
git add .
git commit -m "Add database support"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- Name: `smart-resume-scanner`
- Region: `Oregon (US West)` (same as your database)
- Branch: `main`
- Runtime: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Environment Variables:**
Click "Add Environment Variable" and add each of these:

```
NODE_ENV=production
PORT=3000

GEMINI_API_KEY=AIzaSyDDjmp3MB_flvVFtorRAMMeHKJC8XzEpLI
GEMINI_MODEL=gemini-2.5-flash

DB_HOST=dpg-d3loi815pdvs73am41sg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=smartresumescanner_y63p
DB_USER=smartresumescanner_y63p_user
DB_PASSWORD=QYL5oC7i3BdI14CefgFROo34WmXgb1HV
DB_SSL=true

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Step 3: Add Build Hook (Optional)

In your `package.json`, ensure you have:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "postbuild": "npm run db:migrate"
  }
}
```

This will automatically run migrations after each deployment.

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be available at: `https://smart-resume-scanner.onrender.com`

## 🔄 Run Migrations on Render

### Option 1: Automatic (Recommended)

Add to `package.json`:

```json
"scripts": {
  "postbuild": "npm run db:migrate"
}
```

This runs migrations automatically after each build.

### Option 2: Manual via Shell

1. Go to your Render web service dashboard
2. Click "Shell" tab
3. Run:
```bash
npm run db:migrate
```

### Option 3: From Your Local Machine

Your database is accessible from anywhere:

```bash
npm run db:migrate
```

(Make sure your `.env` is configured for Render)

## 🔍 Troubleshooting

### Connection Timeout

**Problem:** `Connection timeout`

**Solution:**
1. Check DB_SSL is set to `true`
2. Verify all credentials are correct
3. Ensure Render database is active (not paused)

### SSL/TLS Error

**Problem:** `SSL connection error`

**Solution:**
The database config now includes SSL support:
```typescript
ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false } 
  : undefined
```

Make sure `DB_SSL=true` is set in your environment.

### Tables Not Created

**Problem:** Tables don't exist

**Solution:**
Run migration manually:
```bash
npm run db:migrate
```

Or add to package.json as postbuild script.

### Cannot Connect from Local Machine

**Problem:** Connection refused from local development

**Solution:**
1. Render PostgreSQL allows external connections
2. Make sure your local machine isn't blocking outbound connections on port 5432
3. Try from a different network if firewall issues persist

## 📝 Environment Switching

### For Local Development (Local PostgreSQL)

`.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SmartResumeScanner
DB_USER=postgres
DB_PASSWORD=Ayush@7921
DB_SSL=false
```

### For Testing with Render Database

`.env`:
```env
DB_HOST=dpg-d3loi815pdvs73am41sg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=smartresumescanner_y63p
DB_USER=smartresumescanner_y63p_user
DB_PASSWORD=QYL5oC7i3BdI14CefgFROo34WmXgb1HV
DB_SSL=true
```

### For Production (Render Web Service)

Set environment variables in Render dashboard (no .env file needed).

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use Render's Environment Variables** - More secure than .env in production
3. **Rotate credentials** - Change database password periodically
4. **Use secrets management** - Consider Render's secret management features

## 💡 Tips

1. **Same Region:** Your database and web service should be in the same region (Oregon) for best performance
2. **Connection Pooling:** The app uses connection pooling (20 max connections by default)
3. **Free Tier Limits:** Render free PostgreSQL includes:
   - 256 MB RAM
   - 1 GB Storage
   - Expires after 90 days (upgrade to persist)
4. **Database Backups:** Paid plans include automatic backups

## 📊 Monitoring

### View Database Activity

Render Dashboard → Your Database → Metrics

Shows:
- Connections
- CPU usage
- Memory usage
- Storage

### View Application Logs

Render Dashboard → Your Web Service → Logs

Shows:
- Database connection status
- Query execution logs
- Errors and warnings

## 🎯 Testing Your Deployment

Once deployed, test these endpoints:

1. **Health Check:**
```bash
curl https://your-app.onrender.com/health
```

2. **Parse Resume:**
```bash
curl -X POST https://your-app.onrender.com/api/parse-resume \
  -F "resume=@sample-resume.pdf"
```

3. **Check Database Status** (from local):
```bash
npm run db:status
```

## 📞 Support Resources

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

## ✅ Checklist

- [ ] Render PostgreSQL database is active
- [ ] Database credentials are configured in `.env` locally
- [ ] SSL is enabled (`DB_SSL=true`)
- [ ] Database connection test passes (`npm run db:status`)
- [ ] Migration completes successfully (`npm run db:migrate`)
- [ ] Code is pushed to GitHub
- [ ] Render web service is created
- [ ] Environment variables are set in Render
- [ ] Application deploys successfully
- [ ] Health check endpoint works
- [ ] Database tables are visible in pgAdmin

## 🎉 Success!

Your SmartResumeScanner is now deployed to Render with PostgreSQL! 🚀

Your database is accessible from:
- ✅ Your local development machine
- ✅ Render web service
- ✅ pgAdmin 4
- ✅ Any PostgreSQL client

Next steps:
1. Test the API endpoints
2. Upload sample resumes
3. Monitor logs and performance
4. Set up monitoring and alerts
