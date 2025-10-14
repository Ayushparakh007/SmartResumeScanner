# Database Quick Start Guide

Follow these steps to set up PostgreSQL database storage for your SmartResumeScanner project.

## 📋 Prerequisites Checklist

- ✅ PostgreSQL 15 installed on your local system
- ✅ pgAdmin 4 installed and running
- ✅ Node.js and npm installed
- ✅ Project dependencies installed (`npm install`)

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Database in pgAdmin 4

1. Open **pgAdmin 4**
2. Connect to your **PostgreSQL 15** server
3. Right-click **"Databases"** → **"Create"** → **"Database"**
4. Enter database name: **`SmartResumeScanner`**
5. Click **"Save"**

### Step 2: Configure Database Connection

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and add your PostgreSQL password:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=SmartResumeScanner
   DB_USER=postgres
   DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
   ```

   **Important:** Replace `YOUR_ACTUAL_PASSWORD_HERE` with your PostgreSQL password.

### Step 3: Run Database Migration

Execute the migration to create all tables:

```bash
npm run db:migrate
```

You should see output like:
```
✅ Database connection successful
📄 Executing schema.sql...
✅ Database migration completed successfully!

Created tables:
  - candidates
  - experience
  - education
  - job_descriptions
  - scores
```

### Step 4: Verify Setup

Check the database status:

```bash
npm run db:status
```

You should see:
```
✅ Database connection successful
📊 Database Tables:
  - candidates: 0 rows
  - education: 0 rows
  - experience: 0 rows
  - job_descriptions: 0 rows
  - scores: 0 rows
```

## ✅ You're All Set!

Your database is now ready to store parsed resume data!

## 📚 What's Next?

1. **View Tables in pgAdmin:**
   - Open pgAdmin 4
   - Navigate to: Servers → PostgreSQL 15 → Databases → SmartResumeScanner → Schemas → public → Tables

2. **Start Using the Database:**
   - The database services are in `src/db/`
   - See `docs/DATABASE_SETUP.md` for detailed usage examples

3. **Run Your Application:**
   ```bash
   npm run dev
   ```

## 🛠️ Available Database Commands

```bash
npm run db:migrate    # Create/update database tables
npm run db:status     # Check database status
npm run db:reset      # Reset database (DESTRUCTIVE!)
npm run db:drop       # Drop all tables (DESTRUCTIVE!)
```

## ❓ Troubleshooting

### Cannot Connect to Database

**Error:** `Connection failed`

**Solution:**
1. Make sure PostgreSQL is running
2. Check your password in `.env` file
3. Verify database name is exactly `SmartResumeScanner`
4. Ensure your PostgreSQL user has permissions

### Migration Fails

**Error:** `Permission denied` or `Database does not exist`

**Solution:**
1. Make sure you created the database in pgAdmin (Step 1)
2. Check if your user has CREATE privileges
3. Try running: `npm run db:drop` then `npm run db:migrate`

### Tables Already Exist

**Error:** `relation "candidates" already exists`

**Solution:**
This is actually OK! The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't break if tables already exist.

## 📖 Full Documentation

For detailed documentation, code examples, and advanced usage, see:
- `docs/DATABASE_SETUP.md` - Complete setup guide with examples
- `src/db/schema.sql` - Database schema
- `src/db/candidateService.ts` - Candidate operations
- `src/db/jobService.ts` - Job and scoring operations

## 🌐 Deploying to Render

If you're using Render PostgreSQL:

1. Get your database credentials from Render dashboard
2. Update `.env` with Render database details:
   ```env
   DB_HOST=your-render-host.postgres.render.com
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```
3. Run migration: `npm run db:migrate`

## 💡 Quick Tips

- **Backup your data:** Use pgAdmin's backup feature regularly
- **Use pgAdmin Query Tool:** Great for testing SQL queries
- **Check logs:** Look for database connection messages when starting the app
- **Connection pooling:** The app uses connection pooling for better performance

## 🎉 Success!

Your SmartResumeScanner database is now configured and ready to store parsed resume data, candidate profiles, job descriptions, and AI-generated fit scores!
