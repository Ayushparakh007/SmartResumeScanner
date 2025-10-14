import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { PDFParser } from '../utils/pdfParser';
import { GeminiService } from '../services/geminiService';
import { CandidateScore } from '../models/types';
import { createCandidate, getCandidateById } from '../db/candidateService';
import { createJobDescription, createScore } from '../db/jobService';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

// Helper to get Gemini service with validation
function getGeminiService(): GeminiService {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  return new GeminiService(
    apiKey,
    process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  );
}

/**
 * POST /api/parse-resume
 * Upload and parse a resume file
 */
router.post('/parse-resume', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let resumeText: string;

    if (req.file.mimetype === 'application/pdf') {
      resumeText = await PDFParser.parseBuffer(req.file.buffer || await require('fs').promises.readFile(req.file.path));
    } else {
      resumeText = req.file.buffer ? req.file.buffer.toString('utf-8') : await require('fs').promises.readFile(req.file.path, 'utf-8');
    }

    // Extract structured data using Gemini
    const geminiService = getGeminiService();
    const extractedData = await geminiService.extractResumeData(resumeText);

    // Save candidate data to database
    const candidateData = {
      name: extractedData.name || 'Unknown',
      email: extractedData.email || '',
      phone: extractedData.phone || '',
      resumeText: resumeText,
      skills: extractedData.skills || [],
      experience: extractedData.experience || [],
      education: extractedData.education || []
    };

    const candidateId = await createCandidate(
      candidateData,
      extractedData.experience || [],
      extractedData.education || []
    );

    res.json({
      success: true,
      message: 'Resume parsed and saved to database',
      data: {
        candidateId: candidateId,
        ...extractedData,
        resumeText
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/score
 * Score a resume against a job description
 */
router.post('/score', async (req: Request, res: Response) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'resumeText and jobDescription are required' });
    }

    const geminiService = getGeminiService();
    const scoringResult = await geminiService.scoreResume(resumeText, jobDescription);

    res.json({
      success: true,
      data: scoringResult
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/screen
 * Bulk screening of multiple candidates
 */
router.post('/screen', async (req: Request, res: Response) => {
  try {
    const { candidates, jobDescription } = req.body;

    if (!candidates || !Array.isArray(candidates) || !jobDescription) {
      return res.status(400).json({ error: 'candidates array and jobDescription are required' });
    }

    const results: CandidateScore[] = [];
    const geminiService = getGeminiService();

    for (const candidate of candidates) {
      try {
        const scoringResult = await geminiService.scoreResume(
          candidate.resumeText,
          jobDescription
        );

        results.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          ...scoringResult
        });
      } catch (error) {
        console.error(`Failed to score candidate ${candidate.id}:`, error);
        results.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          score: 0,
          justification: 'Failed to process',
          matchedSkills: [],
          missingSkills: [],
          risks: ['Processing error']
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/config-check
 * Check if API is properly configured
 */
router.get('/config-check', (req: Request, res: Response) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  
  res.json({
    success: true,
    config: {
      apiKeyConfigured: hasApiKey,
      apiKeyLength: hasApiKey ? process.env.GEMINI_API_KEY!.length : 0,
      model: model,
      uploadDir: process.env.UPLOAD_DIR || './uploads',
      maxFileSize: process.env.MAX_FILE_SIZE || '10485760'
    },
    message: hasApiKey 
      ? '✓ Configuration looks good!' 
      : '✗ GEMINI_API_KEY is not set. Please check your .env file.'
  });
});

export default router;
