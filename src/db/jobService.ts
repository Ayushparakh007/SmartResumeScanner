import { query } from './config';
import { JobDescription, ScoringResult } from '../models/types';

/**
 * Create a new job description
 */
export async function createJobDescription(
  title: string,
  descriptionText: string,
  requiredSkills: string[] = []
): Promise<string> {
  try {
    const result = await query(
      `INSERT INTO job_descriptions (title, description_text, required_skills)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [title, descriptionText, requiredSkills]
    );
    
    console.log(`✅ Job description created: ${result.rows[0].id}`);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating job description:', error);
    throw error;
  }
}

/**
 * Get job description by ID
 */
export async function getJobDescriptionById(jobId: string): Promise<JobDescription | null> {
  try {
    const result = await query(
      'SELECT * FROM job_descriptions WHERE id = $1',
      [jobId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      descriptionText: row.description_text,
      requiredSkills: row.required_skills || []
    };
  } catch (error) {
    console.error('Error getting job description:', error);
    throw error;
  }
}

/**
 * Get all job descriptions
 */
export async function getAllJobDescriptions(
  limit: number = 50,
  offset: number = 0
): Promise<JobDescription[]> {
  try {
    const result = await query(
      `SELECT * FROM job_descriptions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      descriptionText: row.description_text,
      requiredSkills: row.required_skills || []
    }));
  } catch (error) {
    console.error('Error getting all job descriptions:', error);
    throw error;
  }
}

/**
 * Update job description
 */
export async function updateJobDescription(
  jobId: string,
  updates: Partial<Omit<JobDescription, 'id'>>
): Promise<boolean> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.descriptionText !== undefined) {
      setClauses.push(`description_text = $${paramIndex++}`);
      values.push(updates.descriptionText);
    }
    if (updates.requiredSkills !== undefined) {
      setClauses.push(`required_skills = $${paramIndex++}`);
      values.push(updates.requiredSkills);
    }
    
    if (setClauses.length === 0) {
      return false;
    }
    
    values.push(jobId);
    
    const result = await query(
      `UPDATE job_descriptions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error updating job description:', error);
    throw error;
  }
}

/**
 * Delete job description
 */
export async function deleteJobDescription(jobId: string): Promise<boolean> {
  try {
    const result = await query(
      'DELETE FROM job_descriptions WHERE id = $1',
      [jobId]
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error deleting job description:', error);
    throw error;
  }
}

/**
 * Create a score for a candidate-job pair
 */
export async function createScore(
  candidateId: string,
  jobId: string,
  scoringResult: ScoringResult
): Promise<string> {
  try {
    const result = await query(
      `INSERT INTO scores (candidate_id, job_id, score, justification, matched_skills, missing_skills, risks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        candidateId,
        jobId,
        scoringResult.score,
        scoringResult.justification,
        scoringResult.matchedSkills || [],
        scoringResult.missingSkills || [],
        scoringResult.risks || []
      ]
    );
    
    console.log(`✅ Score created: ${result.rows[0].id} (${scoringResult.score}/10)`);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating score:', error);
    throw error;
  }
}

/**
 * Get all scores for a specific candidate
 */
export async function getScoresByCandidate(candidateId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT s.*, j.title as job_title
       FROM scores s
       JOIN job_descriptions j ON s.job_id = j.id
       WHERE s.candidate_id = $1
       ORDER BY s.created_at DESC`,
      [candidateId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      score: parseFloat(row.score),
      justification: row.justification,
      matchedSkills: row.matched_skills || [],
      missingSkills: row.missing_skills || [],
      risks: row.risks || [],
      jobTitle: row.job_title,
      jobId: row.job_id,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error getting scores by candidate:', error);
    throw error;
  }
}

/**
 * Get all scores for a specific job (ranked candidates)
 */
export async function getScoresByJob(
  jobId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const result = await query(
      `SELECT s.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone
       FROM scores s
       JOIN candidates c ON s.candidate_id = c.id
       WHERE s.job_id = $1
       ORDER BY s.score DESC, s.created_at DESC
       LIMIT $2`,
      [jobId, limit]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      candidatePhone: row.candidate_phone,
      score: parseFloat(row.score),
      justification: row.justification,
      matchedSkills: row.matched_skills || [],
      missingSkills: row.missing_skills || [],
      risks: row.risks || [],
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error getting scores by job:', error);
    throw error;
  }
}

/**
 * Get top candidates across all jobs
 */
export async function getTopCandidates(limit: number = 10): Promise<any[]> {
  try {
    const result = await query(
      `SELECT 
         c.id as candidate_id,
         c.name as candidate_name,
         c.email as candidate_email,
         AVG(s.score) as average_score,
         COUNT(s.id) as total_scores,
         MAX(s.score) as max_score
       FROM candidates c
       JOIN scores s ON c.id = s.candidate_id
       GROUP BY c.id, c.name, c.email
       HAVING COUNT(s.id) > 0
       ORDER BY average_score DESC, max_score DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows.map(row => ({
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      averageScore: parseFloat(row.average_score),
      maxScore: parseFloat(row.max_score),
      totalScores: parseInt(row.total_scores)
    }));
  } catch (error) {
    console.error('Error getting top candidates:', error);
    throw error;
  }
}

/**
 * Get recent scoring activity
 */
export async function getRecentScores(limit: number = 20): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM recent_scores LIMIT $1`,
      [limit]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      score: parseFloat(row.score),
      justification: row.justification,
      matchedSkills: row.matched_skills || [],
      missingSkills: row.missing_skills || [],
      risks: row.risks || [],
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      jobId: row.job_id,
      jobTitle: row.job_title,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error getting recent scores:', error);
    throw error;
  }
}

export default {
  createJobDescription,
  getJobDescriptionById,
  getAllJobDescriptions,
  updateJobDescription,
  deleteJobDescription,
  createScore,
  getScoresByCandidate,
  getScoresByJob,
  getTopCandidates,
  getRecentScores
};
