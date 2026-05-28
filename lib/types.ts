export type JobStatus = "new" | "reviewing" | "applied" | "rejected" | "interviewing";
export type MatchTier = "A" | "B" | "C";

export type Job = {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string | null;
  location: string | null;
  job_url: string | null;
  apply_url: string | null;
  apply_type: string | null;
  company_url: string | null;
  company_logo: string | null;
  contract_type: string | null;
  experience_level: string | null;
  work_type: string | null;
  sector: string | null;
  salary_info: string | null;
  applications_count: string | null;
  posted_time: string | null;
  published_at: string | null;
  job_description: string | null;
  poster_name: string | null;
  poster_profile_url: string | null;
  search_string: string | null;
  match_score: number | null;
  match_tier: MatchTier | null;
  match_summary: string | null;
  strengths: string | null;
  gaps: string | null;
  apply_recommendation: string | null;
  cover_letter_angle: string | null;
  blocker: string | null;
  status: JobStatus;
  applied: boolean;
  applied_at: string | null;
  notes: string | null;
  cover_letter: string | null;
  cover_letter_generated_at: string | null;
  scraped_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ApplicationAnswer = {
  id: string;
  job_id: string;
  question: string;
  answer: string | null;
  created_at: string | null;
};

export type ApifyJob = {
  jobId?: string;
  jobTitle?: string;
  location?: string;
  salaryInfo?: unknown;
  postedTime?: string;
  publishedAt?: string;
  searchString?: string;
  jobUrl?: string;
  companyName?: string;
  companyUrl?: string;
  companyLogo?: string;
  jobDescription?: string;
  applicationsCount?: string;
  contractType?: string;
  experienceLevel?: string;
  workType?: string;
  sector?: string;
  posterFullName?: string;
  posterProfileUrl?: string;
  applyUrl?: string;
  applyType?: string;
};

export type ScoringResult = {
  score: number;
  tier: MatchTier;
  match_summary: string;
  strengths: string[];
  gaps: string[];
  apply_recommendation: string;
  cover_letter_angle: string;
  blocker: string | null;
};
