-- ApplyTrack initial schema
-- Resume versions, applications with cached match analysis, COMPASS checks and
-- a small usage ledger for the free tier limit.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz default now(),
  display_name text,
  nationality text,
  work_pass_needed text check (work_pass_needed in ('s_pass', 'ep', 'either', 'none_have_pr_citizen')),
  current_qualification text,
  years_experience integer check (years_experience between 0 and 60),
  degree_type text check (degree_type in ('diploma', 'bachelor', 'masters', 'phd', 'none')),
  university_tier text check (university_tier in ('top_tier', 'recognised', 'other')),
  field_of_study text,
  target_industry text,
  current_monthly_salary_expectation integer check (current_monthly_salary_expectation >= 0),
  -- COMPASS and pass salary thresholds both scale with age
  age integer check (age between 16 and 80),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  onboarding_complete boolean default false
);

-- ---------------------------------------------------------------------------
-- Resume versions
-- ---------------------------------------------------------------------------

create table resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  version_name text not null,
  file_url text,                           -- storage path inside the private resumes bucket
  file_name text,
  raw_text text,
  parsed_data jsonb,                       -- { name, summary, experience[], education[], skills[], projects[] }
  is_primary boolean default false
);

-- Only one primary resume per user
create unique index uniq_primary_resume on resumes(user_id) where is_primary;

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

create table applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Role details
  company_name text not null,
  role_title text not null,
  industry text,
  is_financial_sector boolean default false,
  job_description text not null,
  job_posting_url text,
  advertised_salary_min integer,
  advertised_salary_max integer,
  -- Match analysis (cached)
  match_score integer check (match_score between 0 and 100),
  match_breakdown jsonb,                   -- see MatchBreakdown in lib/types.ts
  gaps_identified text[],
  strengths_identified text[],
  match_analyzed_at timestamptz,
  -- Resume language suggestions from the gap pass
  language_suggestions jsonb,
  -- COMPASS estimate (if EP-eligible salary range)
  compass_estimate jsonb,
  -- Application tracking
  applied_date date,
  status text default 'researching' check (status in (
    'researching', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'skipped'
  )),
  furthest_stage text default 'researching' check (furthest_stage in (
    'researching', 'applied', 'screening', 'interview', 'offer'
  )),
  notes text,
  -- Cover letter
  cover_letter_draft text,
  sponsorship_pitch text
);

-- ---------------------------------------------------------------------------
-- Standalone COMPASS checks (history for the estimator page)
-- ---------------------------------------------------------------------------

create table compass_checks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  inputs jsonb not null,
  result jsonb not null
);

-- ---------------------------------------------------------------------------
-- Usage ledger, one row per paid-for AI call. Drives the free tier limit.
-- ---------------------------------------------------------------------------

create table usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  kind text not null check (kind in ('match', 'cover_letter', 'compass', 'gaps', 'resume_parse'))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index idx_resumes_user on resumes(user_id, is_primary);
create index idx_applications_user on applications(user_id, status, created_at desc);
create index idx_compass_checks_user on compass_checks(user_id, created_at desc);
create index idx_usage_user on usage_events(user_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_touch before update on applications
  for each row execute function touch_updated_at();

create trigger profiles_touch before update on user_profiles
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Profile row on sign up
-- ---------------------------------------------------------------------------

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into user_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table user_profiles enable row level security;
alter table resumes enable row level security;
alter table applications enable row level security;
alter table compass_checks enable row level security;
alter table usage_events enable row level security;

create policy "own_profile" on user_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_resumes" on resumes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_applications" on applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_compass_checks" on compass_checks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users can read and add their own usage rows but never delete them,
-- otherwise the free limit is one DELETE away from meaningless.
create policy "read_own_usage" on usage_events for select using (auth.uid() = user_id);
create policy "insert_own_usage" on usage_events for insert with check (auth.uid() = user_id);

-- The plan column is set by billing, not by the user. Block self-upgrades.
create or replace function guard_plan_change() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.plan = 'free';
  elsif new.plan is distinct from old.plan then
    new.plan = old.plan;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_plan before insert or update on user_profiles
  for each row execute function guard_plan_change();

-- ---------------------------------------------------------------------------
-- Storage: private bucket, one folder per user
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resume_files_select" on storage.objects for select
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume_files_insert" on storage.objects for insert
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume_files_delete" on storage.objects for delete
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
