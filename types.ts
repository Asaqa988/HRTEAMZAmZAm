
export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  field: string;
  period: string;
}

export interface LinkedInProfile {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  title: string;
  location: string;
  profileUrl: string;
  profilePicUrl?: string;
  description?: string;
  company?: string;
  yearsOfExperience?: number;
  skills?: string[];
  experienceHistory?: ExperienceEntry[];
  educationHistory?: EducationEntry[];
  certifications?: string[];
}

export interface ParsedResume {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages: string[];
}

export interface InterviewQuestion {
  category: string;
  question: string;
  whatToLookFor: string;
}

export interface SearchParams {
  title: string;
  location: string;
  yearsOfExperience: string;
  limit: number;
  actorId: string;
  // New Advanced Filters
  positionLevel?: 'Manager' | 'Head' | 'Director' | 'VP' | 'C-Level';
  targetIndustry?: string;
  keywordsIncludes?: string;
  keywordsExcludes?: string;
  education?: string;
  currentEmployer?: string;
  internationalExperience?: boolean;
  coreFunction?: string;
  subSpecialization?: string;
  skills?: {
    mandatory?: string[];
    preferred?: string[];
    niceToHave?: string[];
  };
  certifications?: string[];
  companyMapping?: {
    target?: string[];
    competitor?: string[];
    excluded?: string[];
  };
  geographicFlexibility?: boolean;
}

export interface CandidateInsight {
  score: number; // 0-100
  matchScore: number; // New rigorous match score
  availabilityScore: number; // 0-100
  redFlags: string[];
  pros: string[];
  cons: string[];
  outreachDraft: string;
  summary: string;
  geographicFlexibility?: string;
  currentLevel?: string;
}
