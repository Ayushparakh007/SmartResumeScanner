# Quick Start Guide

Get SmartResumeScanner up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Google Gemini API key (free at https://makersuite.google.com/app/apikey)

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
Copy-Item .env.example .env

# 3. Edit .env and add your Gemini API key
# Open .env in your editor and replace:
# GEMINI_API_KEY=your_gemini_api_key_here
```

## Run the Application

```bash
# Development mode (with hot reload)
npm run dev
```

Open your browser to **http://localhost:3000**

## Using the Application

### 1. Parse Resume
- Click "Parse Resume" tab
- Upload a PDF or text file
- View extracted information (name, email, skills, experience, education)

### 2. Score Resume
- Click "Score Resume" tab
- Paste resume text and job description
- Get a 1-10 fit score with analysis

### 3. Bulk Screening
- Click "Bulk Screening" tab
- Paste job description
- Provide JSON array of candidates:
```json
[
  {
    "id": "1",
    "name": "John Doe",
    "resumeText": "Software Engineer with 5 years experience..."
  },
  {
    "id": "2", 
    "name": "Jane Smith",
    "resumeText": "Full-stack developer specializing in..."
  }
]
```
- View ranked results

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Building for Production

```bash
# Compile TypeScript
npm run build

# Run production build
npm start
```

## Troubleshooting

### "Missing API Key" error
- Make sure `.env` file exists in root directory
- Check that `GEMINI_API_KEY` is set to your actual key
- Restart the dev server after changing `.env`

### "Failed to parse PDF" error
- Ensure uploaded file is a valid PDF
- Try converting PDF to text first
- Check file size (max 10MB by default)

### Port 3000 already in use
Edit `.env` and change:
```
PORT=3001
```

## Next Steps

- Add database persistence (see README.md)
- Implement authentication
- Add more LLM providers
- Deploy to cloud platform
