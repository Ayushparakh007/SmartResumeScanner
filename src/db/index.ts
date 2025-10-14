/**
 * Database Module
 * 
 * Central export point for all database functionality.
 * Import database services and utilities from this file.
 * 
 * @example
 * import { candidateService, jobService, db } from './db';
 */

// Database configuration and utilities
export * as db from './config';
export { getPool, testConnection, closePool, query, getClient } from './config';

// Candidate operations
export * as candidateService from './candidateService';
export {
  createCandidate,
  getCandidateById,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  searchCandidates,
  getCandidatesBySkills
} from './candidateService';

// Job and scoring operations
export * as jobService from './jobService';
export {
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
} from './jobService';

// Re-export types for convenience
export type { Candidate, Experience, Education, JobDescription, ScoringResult } from '../models/types';
