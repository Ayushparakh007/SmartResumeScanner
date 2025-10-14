import { GoogleGenAI } from '@google/genai';
import { ScoringResult, Candidate } from '../models/types';

export class GeminiService {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash-exp') {
    if (!apiKey || apiKey === '') {
      throw new Error('GEMINI_API_KEY is required but not provided');
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  /**
   * Score a resume against a job description
   */
  async scoreResume(resumeText: string, jobDescription: string): Promise<ScoringResult> {
    const prompt = `You are an expert technical recruiter. Be concise and factual. Avoid hallucinations. If data is missing, explicitly say so.

Compare the following resume with this job description and rate the fit on a 1–10 scale. Provide a JSON response with:
- score: number (1–10)
- justification: brief string (<= 280 chars)
- matchedSkills: string[]
- missingSkills: string[]
- risks: string[]

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a valid JSON object, no additional text.`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      
      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      // Extract JSON from response (handle cases where model adds markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        score: parsed.score,
        justification: parsed.justification,
        matchedSkills: parsed.matchedSkills || [],
        missingSkills: parsed.missingSkills || [],
        risks: parsed.risks || []
      };
    } catch (error) {
      throw new Error(`Failed to score resume: ${error}`);
    }
  }

  /**
   * Extract structured data from resume text
   */
  async extractResumeData(resumeText: string): Promise<Partial<Candidate>> {
    const prompt = `Extract structured information from the following resume. Return a JSON object with:
- name: string
- email: string
- phone: string
- skills: string[]
- experience: array of {company: string, title: string, start: string, end: string, bullets: string[]}
- education: array of {school: string, degree: string, field: string, start: string, end: string}

If any field is not found, use empty string or empty array as appropriate.

Resume:
${resumeText}

Return ONLY a valid JSON object, no additional text.`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      
      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to extract resume data: ${error}`);
    }
  }
}
