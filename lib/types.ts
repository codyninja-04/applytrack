export type WorkPassNeeded = 's_pass' | 'ep' | 'either' | 'none_have_pr_citizen'
export type DegreeType = 'diploma' | 'bachelor' | 'masters' | 'phd' | 'none'
export type UniversityTier = 'top_tier' | 'recognised' | 'other'
export type Plan = 'free' | 'pro'

export type ApplicationStatus =
  | 'researching'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'skipped'

export type PipelineStage = 'researching' | 'applied' | 'screening' | 'interview' | 'offer'

export type SalaryFit = 'below_range' | 'within_range' | 'above_range' | 'unclear'

export interface UserProfile {
  user_id: string
  updated_at: string | null
  display_name: string | null
  nationality: string | null
  work_pass_needed: WorkPassNeeded | null
  current_qualification: string | null
  years_experience: number | null
  degree_type: DegreeType | null
  university_tier: UniversityTier | null
  field_of_study: string | null
  target_industry: string | null
  current_monthly_salary_expectation: number | null
  age: number | null
  plan: Plan
  onboarding_complete: boolean | null
}

export interface ParsedResume {
  name: string | null
  headline: string | null
  summary: string
  total_years_experience: number | null
  experience: {
    title: string
    company: string
    start: string | null
    end: string | null
    highlights: string[]
  }[]
  education: {
    qualification: string
    institution: string
    year: string | null
  }[]
  skills: string[]
  projects: {
    name: string
    description: string
    tech: string[]
  }[]
  certifications: string[]
}

export interface Resume {
  id: string
  user_id: string
  created_at: string
  version_name: string
  file_url: string | null
  file_name: string | null
  raw_text: string | null
  parsed_data: ParsedResume | null
  is_primary: boolean
}

export interface JDKeyword {
  term: string
  aliases: string[]
  must_have: boolean
}

export interface KeywordCoverage {
  found: string[]
  missing: string[]
  must_have_missing: string[]
  percent: number
}

export interface MatchBreakdown {
  skills_match: { matched: string[]; missing: string[] }
  experience_match: string
  keyword_coverage: KeywordCoverage
  honest_verdict: string
  recommendation: 'apply' | 'apply_with_changes' | 'stretch' | 'skip'
  salary_fit: SalaryFit
  seniority_read: string
}

export interface LanguageSuggestion {
  jd_phrase: string
  your_current_wording: string | null
  suggested_rewrite: string
  why: string
  honesty_check: string
}

export interface GapReport {
  suggestions: LanguageSuggestion[]
  do_not_claim: string[]
  summary: string
  generated_at: string
}

export type CompassPoints = 0 | 10 | 20

export interface CompassEstimate {
  exempt: boolean
  salary_points: CompassPoints
  salary_reasoning: string
  qualification_points: CompassPoints
  qualification_reasoning: string
  sol_bonus_possible: boolean
  sol_reasoning: string
  candidate_points: number
  employer_points_needed: number
  likely_outcome: 'strong' | 'depends_on_employer' | 'difficult' | 'exempt'
  strong_criteria: string[]
  weak_criteria: string[]
  recommendation: string
  qualifying_salary: {
    threshold: number
    offered: number
    clears: boolean
  }
  disclaimer: string
  generated_at: string
}

export interface Application {
  id: string
  user_id: string
  resume_id: string | null
  created_at: string
  updated_at: string
  company_name: string
  role_title: string
  industry: string | null
  is_financial_sector: boolean
  job_description: string
  job_posting_url: string | null
  advertised_salary_min: number | null
  advertised_salary_max: number | null
  match_score: number | null
  match_breakdown: MatchBreakdown | null
  gaps_identified: string[] | null
  strengths_identified: string[] | null
  match_analyzed_at: string | null
  language_suggestions: GapReport | null
  compass_estimate: CompassEstimate | null
  applied_date: string | null
  status: ApplicationStatus
  furthest_stage: PipelineStage
  notes: string | null
  cover_letter_draft: string | null
  sponsorship_pitch: string | null
}

export interface CompassInputs {
  offered_salary: number
  role_title: string
  industry: string
  is_financial_sector: boolean
  degree_type: DegreeType
  university_tier: UniversityTier
  years_experience: number
  age: number
  nationality: string
}

export interface CompassCheck {
  id: string
  created_at: string
  inputs: CompassInputs
  result: CompassEstimate
}
