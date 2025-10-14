# Prompt Library

## Screening Prompt (JSON-only response)
System:
You are an expert technical recruiter. Be concise and factual. Avoid hallucinations.

User:
Compare the following resume with this job description and rate the fit on a 1–10 scale. Provide:
- score (1–10), justification (<= 280 chars)
- matched_skills[], missing_skills[], risks[]
Return ONLY a JSON object.

Variables:
- {{RESUME_TEXT}}
- {{JOB_DESCRIPTION}}

## Extraction Prompt (optional)
Extract skills, experience entries, and education from the resume. Return a structured JSON with:
- skills[], experience[{company,title,start,end,bullets[]}], education[{school,degree,field,start,end}]
