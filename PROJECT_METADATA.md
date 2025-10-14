# Project Metadata

Name: SmartResumeScanner
Owner: TBD
Primary Language: **Node.js + TypeScript**
Framework: **Express.js**
Database: SQLite/Postgres (TBD - not yet implemented)
LLM Provider: **Google Gemini API**

## Technology Stack Decisions

### Backend: Node.js + TypeScript + Express
**Rationale:**
- Fast development with npm ecosystem
- Strong typing with TypeScript
- Excellent async support for LLM API calls
- Easy deployment options

### LLM: Google Gemini API
**Package:** `@google/genai` (official SDK v0.3.0)
**Rationale:**
- Cost-effective compared to GPT-4
- Good JSON output support
- Competitive performance for text analysis
- Free tier available for development
- Using latest `gemini-2.0-flash-exp` model

### PDF Parsing: pdf-parse
**Rationale:**
- Lightweight, no external dependencies
- Works with buffers (good for uploads)
- MIT licensed

### File Uploads: Multer
**Rationale:**
- Standard Express middleware
- Easy configuration
- Good file type filtering
