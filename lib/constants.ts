import type { ApplicationStatus, DegreeType, MatchBreakdown, PipelineStage, SalaryFit, UniversityTier, WorkPassNeeded } from '@/lib/types'

export const KANBAN_COLUMNS: ApplicationStatus[] = ['researching', 'applied', 'screening', 'interview', 'offer', 'rejected']

export const STATUS_META: Record<ApplicationStatus, { label: string; dot: string }> = {
  researching: { label: 'Researching', dot: 'bg-slate-400' },
  applied: { label: 'Applied', dot: 'bg-primary' },
  screening: { label: 'Screening', dot: 'bg-sky-400' },
  interview: { label: 'Interview', dot: 'bg-sponsorship' },
  offer: { label: 'Offer', dot: 'bg-match-high' },
  rejected: { label: 'Rejected', dot: 'bg-match-low' },
  withdrawn: { label: 'Withdrawn', dot: 'bg-slate-500' },
  skipped: { label: 'Skipped', dot: 'bg-slate-600' },
}

export const ALL_STATUSES = Object.keys(STATUS_META) as ApplicationStatus[]

export const STAGE_ORDER: PipelineStage[] = ['researching', 'applied', 'screening', 'interview', 'offer']

/** Moves furthest_stage forward only. Rejected at interview still reached interview. */
export function nextFurthest(current: PipelineStage | null, status: ApplicationStatus): PipelineStage {
  const now = current ?? 'researching'
  if (!(STAGE_ORDER as string[]).includes(status)) return now
  return STAGE_ORDER.indexOf(status as PipelineStage) > STAGE_ORDER.indexOf(now) ? (status as PipelineStage) : now
}

export type MatchTier = 'high' | 'medium' | 'low'

export function matchTier(score: number | null | undefined): MatchTier | null {
  if (score === null || score === undefined) return null
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export const MATCH_HEX: Record<MatchTier, string> = {
  high: '#22C55E',
  medium: '#F59E0B',
  low: '#EF4444',
}

export const MATCH_TEXT: Record<MatchTier, string> = {
  high: 'text-match-high',
  medium: 'text-match-medium',
  low: 'text-match-low',
}

export const MATCH_BADGE: Record<MatchTier, string> = {
  high: 'bg-match-high/15 text-match-high ring-match-high/30',
  medium: 'bg-match-medium/15 text-match-medium ring-match-medium/30',
  low: 'bg-match-low/15 text-match-low ring-match-low/30',
}

export const RECOMMENDATION_META: Record<MatchBreakdown['recommendation'], { label: string; tone: MatchTier }> = {
  apply: { label: 'Apply', tone: 'high' },
  apply_with_changes: { label: 'Apply after tailoring', tone: 'medium' },
  stretch: { label: 'Long shot', tone: 'low' },
  skip: { label: 'Skip this one', tone: 'low' },
}

export const SALARY_FIT_META: Record<SalaryFit, { label: string; tone: MatchTier | 'neutral' }> = {
  within_range: { label: 'Within range', tone: 'high' },
  below_range: { label: 'Below your expectation', tone: 'low' },
  above_range: { label: 'Pays above your ask', tone: 'medium' },
  unclear: { label: 'Salary unclear', tone: 'neutral' },
}

export const PASS_LABEL: Record<WorkPassNeeded, string> = {
  s_pass: 'S Pass',
  ep: 'Employment Pass',
  either: 'EP or S Pass',
  none_have_pr_citizen: 'Citizen or PR',
}

export const DEGREE_LABEL: Record<DegreeType, string> = {
  none: 'No degree',
  diploma: 'Diploma',
  bachelor: "Bachelor's",
  masters: "Master's",
  phd: 'PhD',
}

export const TIER_LABEL: Record<UniversityTier, string> = {
  top_tier: 'Top-tier global',
  recognised: 'Recognised university',
  other: 'Other',
}

export const LEGAL_DISCLAIMER =
  'ApplyTrack provides estimates and general guidance only. COMPASS point estimates are not official and cannot account for employer-specific workforce data. Actual work pass eligibility is determined solely by MOM. Verify all current criteria and thresholds at mom.gov.sg.'

export const INDUSTRIES = [
  'Technology',
  'Fintech',
  'Banking',
  'Insurance',
  'Asset management',
  'E-commerce',
  'Consulting',
  'Healthcare',
  'Biomedical',
  'Logistics',
  'Manufacturing',
  'Semiconductors',
  'Energy',
  'Government',
  'Education',
  'Media',
  'Real estate',
  'Hospitality',
  'Other',
]
