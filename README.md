# SmartResumeScanner

An intelligent resume parsing and screening service that extracts structured data from resumes and computes a semantic fit score against a job description.

## Objectives
- Parse resumes (PDF/Text)
- Extract structured data: skills, experience, education, contact info
- Use an LLM to semantically match resumes to job descriptions
- Produce a 1–10 fit score with concise justification
- Output shortlisted candidates ranked by score

## Scope of Work
- Input: PDF/Text resumes + job description
- Processing: parsing, enrichment, semantic scoring
- Output: ranked candidates with explanations and extracted fields
- Optional: web dashboard for management and review
- Storage: database for parsed resumes and job profiles

## Architecture (proposed)
- Backend API (choose one):
  - Node.js (Express/Fastify) or
- Workers/Queue (optional): for batch parsing jobs
- Object storage (optional): for raw resume files
- Database: Postgres/SQLite (local dev) to store parsed entities and scores
- LLM Provider: pluggable (e.g., OpenAI/Azure/Open-source via local server)

### Suggested API Endpoints
- POST /api/parse-resume: upload or reference a resume; returns extracted fields
- POST /api/score: provide resume text + job description; returns score + justification
- POST /api/screen: bulk input of candidates and a JD; returns ranked list
- GET  /api/candidates/:id: get parsed data and latest score

### Data Model (initial)
- Candidate
  - id, name, email, phone
  - resume_file_uri, resume_text
  - skills [string]
  - experience [{ company, title, start, end, bullets[] }]
  - education [{ school, degree, field, start, end }]
- JobDescription
  - id, title, description_text
  - required_skills [string]
- Score
  - id, candidate_id, job_id, score (0–10), justification, created_at

## LLM Usage Guidance
- Role: semantic matching and justification
- Strategy:
  1) Extract key attributes from resume text (skills, roles, tenure, domains)
  2) Extract key attributes from the JD (required skills, seniority, location, must-haves)
  3) Compute a single numeric score 1–10 with reasoning
  4) Return structured JSON for deterministic downstream usage

### Prompt Template (example)
System:
"You are an expert technical recruiter. Be concise and factual. Avoid hallucinations. If data is missing, explicitly say so."

User:
"""
Compare the following resume with this job description and rate the fit on a 1–10 scale. Provide a JSON response with:
- score: number (1–10)
- justification: brief string (<= 280 chars)
- matched_skills: string[]
- missing_skills: string[]
- risks: string[]

Resume:
{{RESUME_TEXT}}

Job Description:
{{JOB_DESCRIPTION}}
"""

Assistant: Return ONLY a JSON object.

### Example JSON Output
```json path=null start=null
{
  "score": 7.5,
  "justification": "Solid backend experience with Node and Python; limited exposure to NLP pipelines and AWS Glue.",
  "matched_skills": ["node.js", "python", "rest apis"],
  "missing_skills": ["langchain", "aws glue"],
  "risks": ["short tenure in last role"]
}
```

## Local Development (TBD per language)
- Python
  - FastAPI + Pydantic + Uvicorn
  - pdfminer.six/pypdf for PDF, spaCy for skills extraction (optional)
- Node.js
  - Fastify/Express + TypeScript
  - pdf-parse/pdfjs + skills extraction via heuristics/NER
- Java
  - Spring Boot + Tika for text extraction

## Project Structure
- src/ — service code
- tests/ — unit/integration tests
- docs/ — documentation, prompt library, diagrams

## Roadmap
- MVP: file upload, parsing to text, heuristic skill extraction, LLM scoring, basic API
- V1: persistence, bulk screening, retry/queue, prompt library, monitoring
- Optional: dashboard for search/sort/filter, candidate profiles

## Deliverables Checklist
- [ ] GitHub repo with commits
- [ ] README with architecture & LLM prompts
- [ ] 2–3 min demo video (screening flow + explanation)

## License
TBD
