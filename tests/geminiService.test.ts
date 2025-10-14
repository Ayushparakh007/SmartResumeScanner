import { GeminiService } from '../src/services/geminiService';

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    // Use a test API key or mock
    geminiService = new GeminiService(process.env.GEMINI_API_KEY || 'test-key');
  });

  describe('scoreResume', () => {
    it('should return a valid scoring result', async () => {
      const resumeText = 'Software Engineer with 5 years experience in Node.js and Python';
      const jobDescription = 'Looking for a Senior Backend Developer with Node.js experience';

      // Note: This test requires a valid API key
      // In production, you'd mock the API call
      if (process.env.GEMINI_API_KEY) {
        const result = await geminiService.scoreResume(resumeText, jobDescription);
        
        expect(result).toHaveProperty('score');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(10);
        expect(result).toHaveProperty('justification');
        expect(result).toHaveProperty('matchedSkills');
        expect(result).toHaveProperty('missingSkills');
        expect(result).toHaveProperty('risks');
      }
    }, 30000); // 30 second timeout for API call
  });

  describe('extractResumeData', () => {
    it('should extract structured data from resume', async () => {
      const resumeText = `
        John Doe
        john@example.com
        (555) 123-4567
        
        Skills: JavaScript, TypeScript, React, Node.js
        
        Experience:
        Software Engineer at Tech Corp (2020-2023)
      `;

      if (process.env.GEMINI_API_KEY) {
        const result = await geminiService.extractResumeData(resumeText);
        
        expect(result).toBeDefined();
        // Basic structure check
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('skills');
      }
    }, 30000);
  });
});
