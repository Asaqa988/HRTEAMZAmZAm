
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
  excludeSeniors?: boolean;
  smartExpansion?: boolean;
}

export interface EnrichedProfile {
  linkedinUrl: string;
  fullName: string;
  headline: string;
  connections: number;
  followers: number;
  email: string | null;
  mobileNumber: string | null;
  about: string;
  location: string;
  skills: { title: string }[];
  experiences: {
    title: string;
    companyName: string;
    jobLocation: string | null;
    jobDescription: string | null;
    jobStartedOn: string | null;
    jobEndedOn: string | null;
    jobStillWorking: boolean;
    logo?: string | null;
    companyIndustry?: string | null;
    companySize?: string | null;
  }[];
  educations: {
    title: string;
    subtitle: string;
    period: { startedOn: { year: number }; endedOn: { year: number } } | null;
  }[];
  languages: { name: string; proficiency: string }[];
  profilePic: string | null;
}

export interface SavedSearch {
  id: string;
  title: string;
  profiles: LinkedInProfile[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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
