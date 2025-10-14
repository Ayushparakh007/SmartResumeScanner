-- SmartResumeScanner Database Schema
-- PostgreSQL 15

-- ====================================
-- Table: candidates
-- ====================================
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    resume_file_uri TEXT,
    resume_text TEXT,
    skills TEXT[], -- Array of skill strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);

-- ====================================
-- Table: experience
-- ====================================
CREATE TABLE IF NOT EXISTS experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date VARCHAR(50), -- Stored as string for flexibility (e.g., "Jan 2020")
    end_date VARCHAR(50),
    bullets TEXT[], -- Array of bullet point strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_experience_candidate ON experience(candidate_id);

-- ====================================
-- Table: education
-- ====================================
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    school VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    field VARCHAR(255),
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_education_candidate ON education(candidate_id);

-- ====================================
-- Table: job_descriptions
-- ====================================
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description_text TEXT NOT NULL,
    required_skills TEXT[], -- Array of required skill strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_created_at ON job_descriptions(created_at DESC);

-- ====================================
-- Table: scores
-- ====================================
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    score DECIMAL(3, 1) NOT NULL CHECK (score >= 0 AND score <= 10),
    justification TEXT,
    matched_skills TEXT[],
    missing_skills TEXT[],
    risks TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scores_candidate ON scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scores_job ON scores(job_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);

-- ====================================
-- Trigger: Update timestamp on candidates
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- Views: Useful aggregations
-- ====================================

-- View: Get complete candidate profile with counts
CREATE OR REPLACE VIEW candidate_profiles AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.resume_file_uri,
    c.resume_text,
    c.skills,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT e.id) as experience_count,
    COUNT(DISTINCT ed.id) as education_count,
    COUNT(DISTINCT s.id) as scores_count,
    AVG(s.score) as average_score
FROM candidates c
LEFT JOIN experience e ON c.id = e.candidate_id
LEFT JOIN education ed ON c.id = ed.candidate_id
LEFT JOIN scores s ON c.id = s.candidate_id
GROUP BY c.id, c.name, c.email, c.phone, c.resume_file_uri, c.resume_text, c.skills, c.created_at, c.updated_at;

-- View: Recent scores with candidate and job info
CREATE OR REPLACE VIEW recent_scores AS
SELECT 
    s.id,
    s.score,
    s.justification,
    s.matched_skills,
    s.missing_skills,
    s.risks,
    s.created_at,
    c.id as candidate_id,
    c.name as candidate_name,
    c.email as candidate_email,
    j.id as job_id,
    j.title as job_title
FROM scores s
JOIN candidates c ON s.candidate_id = c.id
JOIN job_descriptions j ON s.job_id = j.id
ORDER BY s.created_at DESC;

-- ====================================
-- Sample queries (commented out)
-- ====================================

-- Get all candidates with their experience and education
-- SELECT c.*, 
--        json_agg(DISTINCT e.*) as experiences,
--        json_agg(DISTINCT ed.*) as education
-- FROM candidates c
-- LEFT JOIN experience e ON c.id = e.candidate_id
-- LEFT JOIN education ed ON c.id = ed.candidate_id
-- GROUP BY c.id;

-- Get top candidates for a job
-- SELECT c.name, s.score, s.justification
-- FROM scores s
-- JOIN candidates c ON s.candidate_id = c.id
-- WHERE s.job_id = 'YOUR_JOB_ID'
-- ORDER BY s.score DESC
-- LIMIT 10;
