# Database Setup Guide

This guide will help you set up PostgreSQL database storage for SmartResumeScanner to store parsed resume data.

## Prerequisites

- PostgreSQL 15 installed locally
- pgAdmin 4 (for database management)
- Node.js and npm installed

## Database Overview

The SmartResumeScanner database includes the following tables:

### Tables

1. **candidates** - Stores candidate information and resume text
2. **experience** - Stores work experience records (one-to-many with candidates)
3. **education** - Stores education records (one-to-many with candidates)
4. **job_descriptions** - Stores job postings and requirements
5. **scores** - Stores AI-generated fit scores between candidates and jobs

### Views

1. **candidate_profiles** - Aggregated view of candidates with counts
2. **recent_scores** - Recent scoring activity with candidate and job info

## Setup Instructions

### 1. Create Database in pgAdmin 4

1. Open pgAdmin 4
2. Connect to your PostgreSQL 15 server
3. Right-click on "Databases" → "Create" → "Database"
4. Enter database name: `SmartResumeScanner`
5. Click "Save"

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SmartResumeScanner
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

**Note:** Replace `your_actual_password` with your PostgreSQL password.

### 3. Run Database Migration

Execute the migration to create all tables, indexes, and views:

```bash
npm run db:migrate
```

This will:
- Test the database connection
- Create all tables (candidates, experience, education, job_descriptions, scores)
- Create indexes for performance
- Create triggers for automatic timestamp updates
- Create views for common queries

### 4. Verify Setup

Check the database status:

```bash
npm run db:status
```

This will show:
- Connection status
- List of tables and row counts
- List of views

## Database Commands

The project includes several npm scripts for database management:

```bash
# Run migrations (create tables)
npm run db:migrate

# Check database status
npm run db:status

# Reset database (drop and recreate all tables) - DESTRUCTIVE!
npm run db:reset

# Drop all tables - DESTRUCTIVE!
npm run db:drop
```

## Database Schema Details

### Candidates Table

```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    resume_file_uri TEXT,
    resume_text TEXT,
    skills TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Experience Table

```sql
CREATE TABLE experience (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    bullets TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Education Table

```sql
CREATE TABLE education (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    school VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    field VARCHAR(255),
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Job Descriptions Table

```sql
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description_text TEXT NOT NULL,
    required_skills TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Scores Table

```sql
CREATE TABLE scores (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    score DECIMAL(3, 1) CHECK (score >= 0 AND score <= 10),
    justification TEXT,
    matched_skills TEXT[],
    missing_skills TEXT[],
    risks TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
);
```

## Using the Database in Your Application

### Import Database Services

```typescript
import * as candidateService from './db/candidateService';
import * as jobService from './db/jobService';
```

### Create a Candidate

```typescript
const candidateData = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  resumeText: "Full resume text...",
  skills: ["JavaScript", "TypeScript", "Node.js"]
};

const experience = [{
  company: "Tech Corp",
  title: "Senior Developer",
  start: "Jan 2020",
  end: "Present",
  bullets: ["Built scalable APIs", "Led team of 5"]
}];

const education = [{
  school: "University of Example",
  degree: "Bachelor of Science",
  field: "Computer Science",
  start: "2015",
  end: "2019"
}];

const candidateId = await candidateService.createCandidate(
  candidateData,
  experience,
  education
);
```

### Get Candidate by ID

```typescript
const candidate = await candidateService.getCandidateById(candidateId);
console.log(candidate);
```

### Create Job Description

```typescript
const jobId = await jobService.createJobDescription(
  "Senior Full Stack Developer",
  "We are looking for an experienced developer...",
  ["JavaScript", "React", "Node.js", "PostgreSQL"]
);
```

### Create a Score

```typescript
const scoringResult = {
  score: 8.5,
  justification: "Strong technical background with relevant experience",
  matchedSkills: ["JavaScript", "Node.js"],
  missingSkills: ["PostgreSQL"],
  risks: ["Limited experience with databases"]
};

await jobService.createScore(candidateId, jobId, scoringResult);
```

### Get Top Candidates for a Job

```typescript
const rankedCandidates = await jobService.getScoresByJob(jobId);
console.log(rankedCandidates);
```

### Search Candidates

```typescript
// Search by name or email
const results = await candidateService.searchCandidates("John");

// Search by skills
const candidates = await candidateService.getCandidatesBySkills(["Node.js", "TypeScript"]);
```

## Connecting to Render PostgreSQL

If you're deploying to Render and using their managed PostgreSQL:

1. Get your database connection string from Render dashboard
2. Add to your `.env`:

```env
# Option 1: Individual parameters
DB_HOST=your-render-host.postgres.render.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# Option 2: Connection string (if you want to modify config.ts to use it)
DATABASE_URL=postgresql://user:password@host:port/database?ssl=true
```

3. Update `src/db/config.ts` to parse DATABASE_URL if you prefer using connection strings

## Viewing Data in pgAdmin 4

1. Open pgAdmin 4
2. Navigate to: Servers → PostgreSQL 15 → Databases → SmartResumeScanner
3. Expand "Schemas" → "public" → "Tables"
4. Right-click on any table → "View/Edit Data" → "All Rows"

### Useful Queries in pgAdmin

```sql
-- View all candidates with their scores
SELECT 
  c.name,
  c.email,
  COUNT(s.id) as total_scores,
  AVG(s.score) as avg_score
FROM candidates c
LEFT JOIN scores s ON c.id = s.candidate_id
GROUP BY c.id, c.name, c.email;

-- Top candidates for a specific job
SELECT 
  c.name,
  s.score,
  s.justification,
  s.matched_skills
FROM scores s
JOIN candidates c ON s.candidate_id = c.id
WHERE s.job_id = 'YOUR_JOB_ID'
ORDER BY s.score DESC;

-- Recent activity
SELECT * FROM recent_scores LIMIT 10;
```

## Backup and Restore

### Create Backup

```bash
pg_dump -U postgres -d SmartResumeScanner -F c -f backup.dump
```

### Restore Backup

```bash
pg_restore -U postgres -d SmartResumeScanner -c backup.dump
```

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to database

**Solutions:**
1. Verify PostgreSQL is running: `pg_ctl status`
2. Check credentials in `.env` file
3. Ensure database exists in pgAdmin
4. Check if PostgreSQL is listening on the correct port

### Migration Fails

**Problem:** Migration script fails

**Solutions:**
1. Check if database exists
2. Ensure user has CREATE privileges
3. Drop existing tables if needed: `npm run db:drop`
4. Re-run migration: `npm run db:migrate`

### Permission Errors

**Problem:** Permission denied errors

**Solutions:**
1. Ensure your PostgreSQL user has proper permissions
2. Grant permissions in pgAdmin or via SQL:
```sql
GRANT ALL PRIVILEGES ON DATABASE SmartResumeScanner TO your_user;
```

## Performance Tips

1. **Indexes**: The schema includes indexes on commonly queried fields
2. **Connection Pooling**: The application uses connection pooling (default: 20 connections)
3. **Pagination**: Always use pagination for large result sets
4. **Array Queries**: Use PostgreSQL array operators for skill matching

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for database users
3. **Limit database user permissions** in production
4. **Use SSL connections** for remote databases
5. **Regular backups** of production data
6. **Sanitize user inputs** - The services use parameterized queries

## Next Steps

1. ✅ Database schema created
2. ✅ Database services implemented
3. 🔄 Integrate with API routes (next step)
4. 🔄 Add database persistence to resume parsing flow
5. 🔄 Implement candidate search and filtering
6. 🔄 Add bulk screening with database storage

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [node-postgres Documentation](https://node-postgres.com/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
