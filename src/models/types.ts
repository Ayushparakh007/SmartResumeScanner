export interface Experience {
  company: string;
  title: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface JobDescription {
  id: string;
  title: string;
  descriptionText: string;
  requiredSkills: string[];
}

export interface ScoringResult {
  score: number;
  justification: string;
  matchedSkills: string[];
  missingSkills: string[];
  risks: string[];
}

export interface CandidateScore {
  candidateId: string;
  candidateName: string;
  score: number;
  justification: string;
  matchedSkills: string[];
  missingSkills: string[];
  risks: string[];
}
