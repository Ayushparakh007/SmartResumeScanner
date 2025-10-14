# Database Update Fix - Experience, Job Descriptions, and Scores

## Problem Identified

The following data was not being saved to your Render database:
1. **Experience records** - Were being saved but might have failed silently
2. **Job descriptions** - No endpoint existed to create them
3. **Scores** - Were calculated but never persisted to the database

## Root Causes

### 1. Experience Records
The `createCandidate()` function in `candidateService.ts` DOES insert experience records correctly (lines 35-41). However, if there were database connection issues or transaction failures, these would fail silently.

### 2. Job Descriptions  
The `/api/score` endpoint did not create or save job descriptions to the database. It only calculated scores without persistence.

### 3. Scores
The `/api/score` endpoint returned scoring results but never called `createScore()` to persist them to the database.

## Solutions Implemented

### 1. Updated `/api/score` Endpoint
**File**: `src/routes/api.ts`

Now accepts optional `candidateId` and `jobId` parameters. When provided, it will:
- Save the scoring result to the database
- Return the `scoreId` in the response
- Continue even if database save fails (graceful degradation)

**Usage**:
```javascript
// Without database save (old behavior)
POST /api/score
{
  "resumeText": "...",
  "jobDescription": "..."
}

// With database save (new behavior)
POST /api/score
{
  "resumeText": "...",
  "jobDescription": "...",
  "candidateId": "uuid-here",
  "jobId": "uuid-here"
}
```

### 2. New `/api/job-description` Endpoint
**File**: `src/routes/api.ts` (lines 141-170)

Creates job descriptions in the database.

**Usage**:
```javascript
POST /api/job-description
{
  "title": "Senior Software Engineer",
  "descriptionText": "We are looking for...",
  "requiredSkills": ["Python", "React", "AWS"]
}

// Response
{
  "success": true,
  "message": "Job description created successfully",
  "data": {
    "jobId": "uuid-here",
    "title": "Senior Software Engineer"
  }
}
```

### 3. New `/api/screen-and-save` Endpoint
**File**: `src/routes/api.ts` (lines 172-243)

Combines bulk screening with full database persistence:
- Creates a job description
- Scores all candidates
- Saves all scores to the database
- Returns sorted results

**Usage**:
```javascript
POST /api/screen-and-save
{
  "jobTitle": "Senior Software Engineer",
  "jobDescription": "We are looking for...",
  "candidates": [
    {
      "id": "candidate-uuid-1",
      "name": "John Doe",
      "resumeText": "..."
    },
    {
      "id": "candidate-uuid-2",
      "name": "Jane Smith",
      "resumeText": "..."
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "results": [
      {
        "candidateId": "candidate-uuid-1",
        "candidateName": "John Doe",
        "score": 8.5,
        "justification": "...",
        "matchedSkills": [...],
        "missingSkills": [...],
        "risks": [...]
      }
    ]
  }
}
```

## Deployment Steps for Render

### Step 1: Verify Database Schema
Run the migration to ensure all tables exist:

```bash
npm run db:status
```

If tables are missing:
```bash
npm run db:migrate
```

### Step 2: Rebuild and Deploy
1. Commit the changes:
   ```bash
   git add .
   git commit -m "Fix: Add database persistence for job descriptions and scores"
   git push origin main
   ```

2. Render will automatically rebuild and deploy

### Step 3: Verify on Render
Check the Render logs to ensure:
- ✅ Database connection successful
- ✅ Tables exist
- ✅ API endpoints respond correctly

## Testing the Fix

### Test 1: Parse Resume (Experience should save)
```bash
curl -X POST https://your-render-url.com/api/parse-resume \
  -F "resume=@path/to/resume.pdf"
```

Check database:
```sql
SELECT c.name, COUNT(e.id) as experience_count 
FROM candidates c 
LEFT JOIN experience e ON c.id = e.candidate_id 
GROUP BY c.id, c.name;
```

### Test 2: Create Job Description
```bash
curl -X POST https://your-render-url.com/api/job-description \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "descriptionText": "Job description here",
    "requiredSkills": ["JavaScript", "Node.js"]
  }'
```

Check database:
```sql
SELECT * FROM job_descriptions ORDER BY created_at DESC LIMIT 5;
```

### Test 3: Score with Persistence
```bash
curl -X POST https://your-render-url.com/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "...",
    "jobDescription": "...",
    "candidateId": "existing-candidate-uuid",
    "jobId": "existing-job-uuid"
  }'
```

Check database:
```sql
SELECT * FROM scores ORDER BY created_at DESC LIMIT 5;
```

### Test 4: Bulk Screen and Save
```bash
curl -X POST https://your-render-url.com/api/screen-and-save \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Software Engineer",
    "jobDescription": "Looking for a talented developer...",
    "candidates": [...]
  }'
```

## Database Schema Reference

### Tables
- `candidates` - Basic candidate info + skills
- `experience` - Work experience records (FK to candidates)
- `education` - Education records (FK to candidates)
- `job_descriptions` - Job postings
- `scores` - Scoring results (FK to candidates + job_descriptions)

### Views
- `candidate_profiles` - Complete candidate info with counts
- `recent_scores` - Latest scoring activity

## Troubleshooting

### Issue: "Experience still not saving"
**Check**:
1. Database connection in Render logs
2. Transaction rollback messages
3. Foreign key constraint errors

**Solution**: 
```bash
npm run db:status  # Check table structure
```

### Issue: "Scores not appearing"
**Check**:
1. Are you using the correct endpoint? (`/api/score` with candidateId/jobId OR `/api/screen-and-save`)
2. Do the candidateId and jobId exist in the database?

**Solution**:
```sql
-- Verify IDs exist
SELECT id, name FROM candidates WHERE id = 'your-uuid';
SELECT id, title FROM job_descriptions WHERE id = 'your-uuid';
```

### Issue: "Job descriptions not created"
**Check**:
1. Using the new `/api/job-description` endpoint
2. Providing both `title` and `descriptionText`

## Next Steps

1. **Update Frontend**: Modify your frontend to use the new endpoints
2. **Add Error Handling**: Implement proper error handling for DB failures
3. **Add Validation**: Validate UUIDs before database operations
4. **Monitoring**: Add logging to track database operations

## Questions?

If data is still not being saved:
1. Check Render logs for specific error messages
2. Run `npm run db:status` to verify table structure
3. Test database connection with `npm run db:migrate status`
4. Verify environment variables are set correctly in Render dashboard
