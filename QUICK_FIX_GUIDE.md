# Quick Fix Guide - Database Not Updating

## What Was Wrong?

Your Render database wasn't saving:
- ❌ **Experience records** - Might have been failing due to transaction/connection issues
- ❌ **Job descriptions** - No endpoint existed to create them
- ❌ **Scores** - Calculated but never saved to database

## What I Fixed

### ✅ 1. Updated `/api/score` Endpoint
Now accepts optional `candidateId` and `jobId` to save scores:
```javascript
POST /api/score
{
  "resumeText": "...",
  "jobDescription": "...",
  "candidateId": "uuid",  // OPTIONAL - if provided, saves to DB
  "jobId": "uuid"         // OPTIONAL - if provided, saves to DB
}
```

### ✅ 2. Created `/api/job-description` Endpoint (NEW)
Creates job descriptions in database:
```javascript
POST /api/job-description
{
  "title": "Software Engineer",
  "descriptionText": "Job requirements...",
  "requiredSkills": ["Python", "React"]
}
```

### ✅ 3. Created `/api/screen-and-save` Endpoint (NEW)
Bulk screening with full database persistence:
```javascript
POST /api/screen-and-save
{
  "jobTitle": "Software Engineer",
  "jobDescription": "Job requirements...",
  "candidates": [
    {"id": "uuid1", "name": "John", "resumeText": "..."},
    {"id": "uuid2", "name": "Jane", "resumeText": "..."}
  ]
}
// Creates job description + saves all scores
```

### ✅ 4. Added Database Test Script
New command to verify everything works:
```bash
npm run db:test
```

## How to Deploy to Render

### Option 1: Quick Deploy (Recommended)
```bash
# 1. Build locally to verify
npm run build

# 2. Commit and push
git add .
git commit -m "Fix: Add database persistence for job descriptions and scores"
git push origin main

# 3. Render will auto-deploy (watch the logs)
```

### Option 2: Test Locally First
```bash
# 1. Make sure you have .env with Render DB credentials
# (Download from Render dashboard)

# 2. Test database connection
npm run db:status

# 3. Run comprehensive tests
npm run db:test

# 4. If all passes, deploy as above
```

## Testing After Deployment

### Test 1: Check Database Status
```bash
# SSH into Render or use local connection
npm run db:status
```

Expected output:
```
📊 Database Tables:
  - candidates: X rows
  - education: X rows
  - experience: X rows  ← Should have data!
  - job_descriptions: X rows  ← Should have data!
  - scores: X rows  ← Should have data!
```

### Test 2: Create a Job Description
```bash
curl -X POST https://your-app.onrender.com/api/job-description \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "descriptionText": "Test description",
    "requiredSkills": ["JavaScript"]
  }'
```

### Test 3: Upload Resume
```bash
curl -X POST https://your-app.onrender.com/api/parse-resume \
  -F "resume=@resume.pdf"
```

### Test 4: Score and Save
Use the returned candidateId from Test 3 and jobId from Test 2:
```bash
curl -X POST https://your-app.onrender.com/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "...",
    "jobDescription": "...",
    "candidateId": "uuid-from-test-3",
    "jobId": "uuid-from-test-2"
  }'
```

## Verify in Render Dashboard

1. Go to Render Dashboard → Your Database
2. Click "Shell" or use connection info
3. Run these queries:

```sql
-- Check experience records
SELECT c.name, COUNT(e.id) as exp_count 
FROM candidates c 
LEFT JOIN experience e ON c.id = e.candidate_id 
GROUP BY c.id, c.name;

-- Check job descriptions
SELECT id, title, created_at 
FROM job_descriptions 
ORDER BY created_at DESC;

-- Check scores
SELECT * FROM recent_scores LIMIT 10;
```

## Troubleshooting

### Problem: Tables don't exist
**Solution:**
```bash
npm run db:migrate
```

### Problem: Connection fails
**Check:**
- Environment variables in Render dashboard
- Database is running (check Render status)
- SSL is enabled (`DB_SSL=true`)

### Problem: Data still not saving
**Debug steps:**
1. Check Render logs for errors
2. Run `npm run db:test` locally
3. Verify foreign key constraints aren't failing
4. Check if UUIDs are valid

## Files Changed

1. **`src/routes/api.ts`** - Updated score endpoint, added 2 new endpoints
2. **`src/scripts/testDatabase.ts`** - NEW: Database testing script
3. **`package.json`** - Added `db:test` command
4. **`DATABASE_FIX.md`** - Complete documentation
5. **`QUICK_FIX_GUIDE.md`** - This file

## Next Steps

After confirming data is saving:

1. **Update Frontend** - Use new endpoints for better UX
2. **Add Monitoring** - Track when saves fail
3. **Add Bulk Operations** - Use `/api/screen-and-save` for efficiency
4. **Add Validation** - Validate UUIDs before database calls

## Need Help?

Run this diagnostic:
```bash
npm run db:test
```

This will:
- ✅ Test database connection
- ✅ Verify all tables exist
- ✅ Test experience record insertion
- ✅ Test job description creation
- ✅ Test score persistence
- ✅ Show current database state

## Summary

**Before:** Data calculated but not saved  
**After:** Data calculated AND saved to database

**Key Improvement:** All endpoints now support database persistence with graceful fallbacks.

---

**Need more details?** See `DATABASE_FIX.md` for comprehensive documentation.
