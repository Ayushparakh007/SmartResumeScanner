import { query, getClient } from './config';
import { Candidate, Experience, Education } from '../models/types';

/**
 * Insert a new candidate with experience and education
 */
export async function createCandidate(
  candidateData: Omit<Candidate, 'id'>,
  experienceData: Experience[] = [],
  educationData: Education[] = []
): Promise<string> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Insert candidate
    const candidateResult = await client.query(
      `INSERT INTO candidates (name, email, phone, resume_file_uri, resume_text, skills)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        candidateData.name,
        candidateData.email || null,
        candidateData.phone || null,
        null, // resume_file_uri
        candidateData.resumeText,
        candidateData.skills || []
      ]
    );
    
    const candidateId = candidateResult.rows[0].id;
    
    // Insert experience records
    for (const exp of experienceData) {
      await client.query(
        `INSERT INTO experience (candidate_id, company, title, start_date, end_date, bullets)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [candidateId, exp.company, exp.title, exp.start, exp.end, exp.bullets || []]
      );
    }
    
    // Insert education records
    for (const edu of educationData) {
      await client.query(
        `INSERT INTO education (candidate_id, school, degree, field, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [candidateId, edu.school, edu.degree || null, edu.field || null, edu.start, edu.end]
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Candidate created: ${candidateId}`);
    return candidateId;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating candidate:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get candidate by ID with all related data
 */
export async function getCandidateById(candidateId: string): Promise<Candidate | null> {
  try {
    // Get candidate basic info
    const candidateResult = await query(
      'SELECT * FROM candidates WHERE id = $1',
      [candidateId]
    );
    
    if (candidateResult.rows.length === 0) {
      return null;
    }
    
    const candidateRow = candidateResult.rows[0];
    
    // Get experience
    const experienceResult = await query(
      'SELECT * FROM experience WHERE candidate_id = $1 ORDER BY start_date DESC',
      [candidateId]
    );
    
    // Get education
    const educationResult = await query(
      'SELECT * FROM education WHERE candidate_id = $1 ORDER BY start_date DESC',
      [candidateId]
    );
    
    // Map to Candidate interface
    const candidate: Candidate = {
      id: candidateRow.id,
      name: candidateRow.name,
      email: candidateRow.email || '',
      phone: candidateRow.phone || '',
      resumeText: candidateRow.resume_text || '',
      skills: candidateRow.skills || [],
      experience: experienceResult.rows.map(row => ({
        company: row.company,
        title: row.title,
        start: row.start_date,
        end: row.end_date,
        bullets: row.bullets || []
      })),
      education: educationResult.rows.map(row => ({
        school: row.school,
        degree: row.degree || '',
        field: row.field || '',
        start: row.start_date,
        end: row.end_date
      }))
    };
    
    return candidate;
  } catch (error) {
    console.error('Error getting candidate:', error);
    throw error;
  }
}

/**
 * Get all candidates (paginated)
 */
export async function getAllCandidates(
  limit: number = 50,
  offset: number = 0
): Promise<Candidate[]> {
  try {
    const result = await query(
      `SELECT id, name, email, phone, resume_text, skills, created_at
       FROM candidates
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      resumeText: row.resume_text || '',
      skills: row.skills || [],
      experience: [],
      education: []
    }));
  } catch (error) {
    console.error('Error getting all candidates:', error);
    throw error;
  }
}

/**
 * Update candidate information
 */
export async function updateCandidate(
  candidateId: string,
  updates: Partial<Omit<Candidate, 'id' | 'experience' | 'education'>>
): Promise<boolean> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.phone !== undefined) {
      setClauses.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.resumeText !== undefined) {
      setClauses.push(`resume_text = $${paramIndex++}`);
      values.push(updates.resumeText);
    }
    if (updates.skills !== undefined) {
      setClauses.push(`skills = $${paramIndex++}`);
      values.push(updates.skills);
    }
    
    if (setClauses.length === 0) {
      return false;
    }
    
    values.push(candidateId);
    
    const result = await query(
      `UPDATE candidates SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
}

/**
 * Delete candidate (cascade deletes experience, education, and scores)
 */
export async function deleteCandidate(candidateId: string): Promise<boolean> {
  try {
    const result = await query(
      'DELETE FROM candidates WHERE id = $1',
      [candidateId]
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error deleting candidate:', error);
    throw error;
  }
}

/**
 * Search candidates by name or email
 */
export async function searchCandidates(searchTerm: string): Promise<Candidate[]> {
  try {
    const result = await query(
      `SELECT id, name, email, phone, resume_text, skills
       FROM candidates
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY name
       LIMIT 50`,
      [`%${searchTerm}%`]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      resumeText: row.resume_text || '',
      skills: row.skills || [],
      experience: [],
      education: []
    }));
  } catch (error) {
    console.error('Error searching candidates:', error);
    throw error;
  }
}

/**
 * Get candidates with specific skills
 */
export async function getCandidatesBySkills(skills: string[]): Promise<Candidate[]> {
  try {
    const result = await query(
      `SELECT id, name, email, phone, resume_text, skills
       FROM candidates
       WHERE skills && $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [skills]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      resumeText: row.resume_text || '',
      skills: row.skills || [],
      experience: [],
      education: []
    }));
  } catch (error) {
    console.error('Error getting candidates by skills:', error);
    throw error;
  }
}

export default {
  createCandidate,
  getCandidateById,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  searchCandidates,
  getCandidatesBySkills
};
