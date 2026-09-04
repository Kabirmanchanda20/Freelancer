-- CampusGigs schema for Express API + Supabase Postgres/Storage
-- Auth is owned by Express (app_users), not Supabase Auth.
-- Payment/escrow deferred.

create extension if not exists "pgcrypto";

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  refresh_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_email_thapar check (email ~* '@thapar\.edu$')
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references public.app_users(id) on delete cascade,
  full_name text not null,
  college_email text unique not null,
  campus_role text not null check (campus_role in (
    'ug_student', 'mtech', 'phd', 'faculty', 'staff', 'department'
  )),
  department_id uuid references public.departments(id),
  roll_or_employee_id text,
  program text,
  year_of_study smallint check (year_of_study is null or year_of_study between 1 and 6),
  designation text,
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  bio text,
  headline text,
  avatar_url text,
  skill_tags text[] not null default '{}',
  linkedin_url text,
  portfolio_url text,
  is_open_to_work boolean not null default true,
  can_host_workshops boolean not null default false,
  avg_rating numeric(3,2) not null default 0,
  wallet_balance numeric(10,2) not null default 0,
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  kind text not null default 'non_technical' check (kind in ('technical', 'non_technical')),
  created_at timestamptz not null default now()
);

create table public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (user_id, category_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id),
  worker_id uuid references public.profiles(id),
  listing_type text not null default 'gig' check (listing_type in (
    'gig', 'workshop', 'project', 'mentorship'
  )),
  title text not null,
  description text not null,
  category_id uuid not null references public.categories(id),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  budget numeric(10,2) not null default 0 check (budget >= 0),
  deadline timestamptz,
  venue text,
  mode text check (mode is null or mode in ('in_person', 'online', 'hybrid')),
  starts_at timestamptz,
  ends_at timestamptz,
  max_participants int check (max_participants is null or max_participants > 0),
  target_roles text[] default null,
  target_department_id uuid references public.departments(id),
  status text not null default 'open' check (status in (
    'open', 'assigned', 'submitted', 'completed', 'disputed', 'cancelled'
  )),
  proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (task_id, applicant_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id),
  from_user uuid references public.profiles(id),
  to_user uuid references public.profiles(id),
  amount numeric(10,2) not null,
  type text not null check (type in (
    'escrow_hold', 'escrow_release', 'refund', 'referral_bonus', 'signup_bonus'
  )),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (task_id, reviewer_id)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  raised_by uuid not null references public.profiles(id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution text,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_category_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  completed_count int not null default 0,
  primary key (user_id, category_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  target_type text not null check (target_type in ('task', 'user', 'message')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index idx_tasks_status on public.tasks(status);
create index idx_tasks_category on public.tasks(category_id);
create index idx_tasks_created_at on public.tasks(created_at desc);
create index idx_tasks_listing_type on public.tasks(listing_type);
create index idx_tasks_starts_at on public.tasks(starts_at);
create index idx_applications_task on public.applications(task_id);
create index idx_profiles_campus_role on public.profiles(campus_role);
create index idx_profiles_department on public.profiles(department_id);
create index idx_notifications_user on public.notifications(user_id, is_read);
create index idx_messages_task on public.messages(task_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger app_users_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();
