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
 * Optional: candidateId and jobId to save score to database
 */
router.post('/score', async (req: Request, res: Response) => {
  try {
    const { resumeText, jobDescription, candidateId, jobId, jobTitle } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'resumeText and jobDescription are required' });
    }

    const geminiService = getGeminiService();
    const scoringResult = await geminiService.scoreResume(resumeText, jobDescription);

    // If candidateId and jobId provided, save score to database
    let scoreId = null;
    if (candidateId && jobId) {
      try {
        scoreId = await createScore(candidateId, jobId, scoringResult);
        console.log(`✅ Score saved to database: ${scoreId}`);
      } catch (dbError: any) {
        console.error('Failed to save score to database:', dbError.message);
        // Continue anyway - return the score even if DB save fails
      }
    }

    res.json({
      success: true,
      data: {
        ...scoringResult,
        scoreId: scoreId
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /api/job-description
 * Create a new job description
 */
router.post('/job-description', async (req: Request, res: Response) => {
  try {
    const { title, descriptionText, requiredSkills } = req.body;

    if (!title || !descriptionText) {
      return res.status(400).json({ error: 'title and descriptionText are required' });
    }

    const jobId = await createJobDescription(
      title,
      descriptionText,
      requiredSkills || []
    );

    res.json({
      success: true,
      message: 'Job description created successfully',
      data: {
        jobId: jobId,
        title: title
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/screen-and-save
 * Bulk screening with database persistence
 * Creates job description and saves all scores
 */
router.post('/screen-and-save', async (req: Request, res: Response) => {
  try {
    const { candidates, jobDescription, jobTitle } = req.body;

    if (!candidates || !Array.isArray(candidates) || !jobDescription || !jobTitle) {
      return res.status(400).json({ 
        error: 'candidates array, jobDescription, and jobTitle are required' 
      });
    }

    // Create job description in database
    const jobId = await createJobDescription(
      jobTitle,
      jobDescription,
      [] // We'll extract required skills from candidates
    );
    console.log(`✅ Job description created: ${jobId}`);

    const results: CandidateScore[] = [];
    const geminiService = getGeminiService();

    for (const candidate of candidates) {
      try {
        const scoringResult = await geminiService.scoreResume(
          candidate.resumeText,
          jobDescription
        );

        // Save score to database
        try {
          await createScore(candidate.id, jobId, scoringResult);
        } catch (dbError: any) {
          console.error(`Failed to save score for candidate ${candidate.id}:`, dbError.message);
        }

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
      data: {
        jobId: jobId,
        results: results
      }
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
