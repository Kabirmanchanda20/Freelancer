# Product Requirements Document (PRD)

### Campus Freelancer / Gig Marketplace SaaS

> **Version:** 1.0
> **Stack:** React (Vite/Next.js) + Supabase + TailwindCSS — Web SaaS
> **Audience:** Dev team (4 members), reviewing faculty/mentor, future contributors
> **Purpose:** Single source of truth for scope, architecture, schema, security, and delivery plan.

> ⚠️ **Version Safety Rule:** Never hardcode package versions from memory into `package.json`. Before installing any dependency, run `npm show <package> version` and check for open CVEs/advisories. Prefer the latest patched release on a supported major line. Run `npm audit` before every deploy and fix all high/critical issues.

---



## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas & Roles](#3-user-personas--roles)
4. [Tech Stack](#4-tech-stack)
5. [Feature Scope (Modules)](#5-feature-scope-modules)
6. [Core User Flows](#6-core-user-flows)
7. [Database Schema (Supabase/Postgres)](#7-database-schema-supabasepostgres)
8. [Row-Level Security (RLS) Policy Plan](#8-row-level-security-rls-policy-plan)
9. [Escrow / Wallet Logic (Postgres Functions)](#9-escrow--wallet-logic-postgres-functions)
10. [Repository Structure](#10-repository-structure)
11. [Environment Variables](#11-environment-variables)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Security Checklist](#13-security-checklist)
14. [API / RPC Reference](#14-api--rpc-reference)
15. [Team Split & Ownership](#15-team-split--ownership)
16. [Delivery Roadmap](#16-delivery-roadmap)
17. [Out of Scope / Future Work](#17-out-of-scope--future-work)
18. [Document Maintenance](#18-document-maintenance)

---



## 1. Product Overview

**Working name:** CampusGigs (placeholder — rename as needed)

A campus-only micro-marketplace where students post small paid tasks (tutoring, notes, assignment help, design work, errands) and other students apply, get matched, complete the work, and get paid through an internal credit-based wallet system (no real currency, to keep scope legally and operationally simple).

The product borrows real marketplace trust mechanics — escrow, two-way ratings, dispute resolution, verified onboarding — while staying deliberately small in monetization scope (internal credits, not real payment processing).

**Elevator pitch:** *"Fiverr + Upwork, shrunk to campus scale, with an AI-assisted matching layer that learns what kind of gigs a student is good at."*

---



## 2. Goals & Success Metrics


| Goal                                            | Metric                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Prove a working escrow-based transaction system | 100% of completed tasks have an atomic, auditable ledger entry — zero orphaned transactions |
| Demonstrate real trust & safety mechanics       | Dispute resolution flow fully functional end-to-end                                         |
| Show a working recommendation layer             | Recommended tasks list changes measurably based on user's completed-task history            |
| Deliver a demoable, deployable product          | Live on Vercel + Supabase, usable by real users without a local setup                       |
| Production-mindedness (not just a prototype)    | Passes the security + reliability checklist in Sections 12–13                               |


---



## 3. User Personas & Roles


| Role                        | Description                                                                                                                  | Key Needs                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Student (dual role)**     | Can both post tasks (as a "poster") and apply to tasks (as a "worker") — no fixed role split, mirrors real peer marketplaces | Fast task discovery, trustworthy payment, fair dispute handling  |
| **Admin/Moderator**         | Faculty mentor or designated student admin                                                                                   | Moderate flagged content, resolve disputes, view platform health |
| **Guest (unauthenticated)** | Can browse public task listings only                                                                                         | Must sign up with verified college email to interact             |


---



## 4. Tech Stack


| Layer                                     | Choice                                | Why                                                                            |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| **Frontend**                              | React (Vite) or Next.js               | Next.js if SSR + easy Vercel deploy is wanted; plain React+Vite for simplicity |
| **Backend-as-a-Service**                  | **Supabase**                          | Postgres DB, Auth, Realtime, Storage, Row-Level Security                       |
| **Styling**                               | Tailwind CSS                          | Fast, consistent UI, pairs cleanly with React                                  |
| **Server state**                          | TanStack Query (React Query)          | Caching, retries, background refetch for Supabase data                         |
| **Forms/validation**                      | React Hook Form + Zod                 | Client-side validation before hitting Supabase                                 |
| **Charts**                                | Recharts or Chart.js                  | Wallet trends, admin analytics dashboard                                       |
| **Real-time**                             | Supabase Realtime                     | Task status updates, in-app messaging, notifications                           |
| **File storage**                          | Supabase Storage                      | Proof-of-work submissions, profile pictures                                    |
| **Business logic (money-critical)**       | Postgres functions (RPC via Supabase) | Atomic transactions — never done client-side                                   |
| **Hosting: Frontend**                     | Vercel                                | Free tier, CI/CD on git push                                                   |
| **Hosting: Backend/DB**                   | Supabase (already hosted)             | No separate server to manage                                                   |
| **Monitoring (optional but recommended)** | Sentry (frontend)                     | Error tracking in production                                                   |


**Verification rule:** Before adding any package to `package.json`, search `"<package> npm latest version"` and `"<package> CVE"`, then confirm via `npm show <package> version`. Do not copy version numbers from this document — none are pinned here intentionally.

---



## 5. Feature Scope (Modules)



### 5.1 Must-Have (MVP — build these to full depth)


| #   | Module                                     | Core Functionality                                                                                                                      |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Auth & Identity**                        | Signup/login via Supabase Auth, college-email domain restriction, session handling, password reset                                      |
| 2   | **User Profile**                           | Bio, skill tags, experience level (Beginner/Intermediate/Advanced), avatar, average rating                                              |
| 3   | **Task/Gig Lifecycle**                     | Create/edit/delete task, category + difficulty tagging, state machine: `OPEN → ASSIGNED → SUBMITTED → COMPLETED / DISPUTED / CANCELLED` |
| 4   | **Application & Matching**                 | Apply to task, poster accepts/rejects, auto-expiry of stale postings                                                                    |
| 5   | **Wallet & Escrow**                        | Signup bonus credits, escrow hold on assignment, atomic release on completion, refund on cancellation, full transaction history         |
| 6   | **Ratings & Reviews**                      | Two-way review after completion (poster ↔ worker), average rating computation, duplicate-review prevention                              |
| 7   | **Search & Discovery**                     | Filter by category/budget/deadline/difficulty, keyword search, sort options                                                             |
| 8   | **Recommendation Engine ("AI Assistant")** | Onboarding quiz (experience level + interests), weighted content-based scoring, affinity updates on task completion                     |
| 9   | **Notifications**                          | In-app real-time notifications (task accepted, payment received, new message, dispute update)                                           |
| 10  | **Admin/Moderation**                       | View/suspend users, view flagged content, resolve disputes, platform-wide stats                                                         |




### 5.2 Should-Have (build if time allows, in this priority order)


| #   | Module                                  | Core Functionality                                             |
| --- | --------------------------------------- | -------------------------------------------------------------- |
| 11  | **Messaging**                           | Per-task threaded chat, real-time via Supabase Realtime        |
| 12  | **Trust & Safety — Reporting/Disputes** | Report a task/user, dispute workflow with admin mediation      |
| 13  | **Proof-of-Work Submission**            | Worker uploads file/screenshot before poster can mark complete |
| 14  | **Personal Analytics**                  | Earnings graph, category breakdown, rating trend (Recharts)    |




### 5.3 Nice-to-Have (stub or "Future Scope" section only — do not over-invest time here)


| #   | Feature                                                  | Notes                                           |
| --- | -------------------------------------------------------- | ----------------------------------------------- |
| 15  | Referral bonus                                           | Credits for both users on successful referral   |
| 16  | Boosted/featured task                                    | Spend credits to pin a task to top of feed      |
| 17  | Streak/loyalty badges                                    | Gamification — cheap to build, good demo polish |
| 18  | Saved searches / alerts                                  | "Notify me when X category task appears"        |
| 19  | Skill verification quiz                                  | Self-assessment badge system                    |
| 20  | Admin BI dashboard (GMV, retention, trending categories) | SQL views + charts                              |


---



## 6. Core User Flows



### 6.1 Task Lifecycle (state machine)

```
CREATE TASK
   │
   ▼
 [OPEN] ──apply──► Application(s) created
   │
   │ poster accepts one application
   ▼
[ASSIGNED] ── escrow held (poster's credits locked) ──► other applicants auto-rejected
   │
   │ worker submits proof of work
   ▼
[SUBMITTED]
   │
   ├── poster approves ──► [COMPLETED] ── escrow released to worker, both parties can review
   │
   ├── poster disputes ──► [DISPUTED] ── admin reviews chat + proof, resolves (release / refund / split)
   │
   └── poster/worker cancels before assignment ──► [CANCELLED] ── escrow refunded if held
```



### 6.2 Onboarding + Recommendation Flow

```
New user signs up (college email verified)
   │
   ▼
"AI Assistant" quiz: experience level + interest tags (button-based, not free text)
   │
   ▼
RecommendationService.getRecommendations(userId) called
   │
   ▼
Ranked task feed shown, re-scored after every completed task
```

---



## 7. Database Schema (Supabase/Postgres)

```sql
-- ── Users (extends Supabase auth.users) ─────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  college_email text unique not null,
  experience_level text check (experience_level in ('beginner','intermediate','advanced')),
  avg_rating numeric(3,2) default 0,
  wallet_balance numeric(10,2) default 100.00, -- signup bonus
  is_admin boolean default false,
  is_suspended boolean default false,
  created_at timestamptz default now()
);

-- ── Interest tags (many-to-many) ────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table user_interests (
  user_id uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (user_id, category_id)
);

-- ── Tasks ────────────────────────────────────────────────────────────
create table tasks (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid references profiles(id) not null,
  worker_id uuid references profiles(id),
  title text not null,
  description text not null,
  category_id uuid references categories(id) not null,
  difficulty text check (difficulty in ('beginner','intermediate','advanced')) not null,
  budget numeric(10,2) not null check (budget > 0),
  deadline timestamptz,
  status text check (status in ('open','assigned','submitted','completed','disputed','cancelled')) default 'open',
  proof_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Applications ─────────────────────────────────────────────────────
create table applications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  applicant_id uuid references profiles(id) on delete cascade,
  message text,
  status text check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now(),
  unique (task_id, applicant_id)
);

-- ── Wallet transactions (immutable ledger) ──────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id),
  from_user uuid references profiles(id),
  to_user uuid references profiles(id),
  amount numeric(10,2) not null,
  type text check (type in ('escrow_hold','escrow_release','refund','referral_bonus','signup_bonus')) not null,
  created_at timestamptz default now()
);

-- ── Ratings ──────────────────────────────────────────────────────────
create table reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  reviewer_id uuid references profiles(id),
  reviewee_id uuid references profiles(id),
  stars int check (stars between 1 and 5) not null,
  comment text,
  created_at timestamptz default now(),
  unique (task_id, reviewer_id)
);

-- ── Disputes ─────────────────────────────────────────────────────────
create table disputes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  raised_by uuid references profiles(id),
  reason text not null,
  status text check (status in ('open','resolved')) default 'open',
  resolution text,
  resolved_by uuid references profiles(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ── Messages (per task thread) ──────────────────────────────────────
create table messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- ── Notifications ────────────────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ── Category affinity (recommendation "learning" signal) ───────────
create table user_category_stats (
  user_id uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  completed_count int default 0,
  primary key (user_id, category_id)
);

-- ── Recommended indexes ──────────────────────────────────────────────
create index idx_tasks_status on tasks(status);
create index idx_tasks_category on tasks(category_id);
create index idx_tasks_created_at on tasks(created_at desc);
create index idx_applications_task on applications(task_id);
create index idx_transactions_user on transactions(from_user, to_user);
```

---



## 8. Row-Level Security (RLS) Policy Plan

> Enable RLS on **every** table above (`alter table X enable row level security;`). Default-deny, then add explicit policies.


| Table           | Policy Summary                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`      | Anyone can read public fields; only the owner can update their own row; `is_admin`/`wallet_balance` **not directly updatable by users** (only via Postgres functions)                               |
| `tasks`         | Anyone (authenticated) can `SELECT` open tasks; only `poster_id = auth.uid()` can `UPDATE`/`DELETE` their own task, and only while `status = 'open'`                                                |
| `applications`  | Applicant can insert/read their own application; poster can read applications for tasks they posted; no one can update `status` directly (only via accept/reject RPC)                               |
| `transactions`  | Read-only for the involved users (`from_user = auth.uid() or to_user = auth.uid()`); **no insert/update/delete from client at all** — only Postgres functions (running as a trusted role) may write |
| `reviews`       | Any authenticated user can read; only participants of a completed task can insert one review per direction                                                                                          |
| `disputes`      | Only task participants can create; only admins can update `status`/`resolution`                                                                                                                     |
| `messages`      | Only participants of the task (poster or assigned worker) can read/write                                                                                                                            |
| `notifications` | User can only read/update their own notifications                                                                                                                                                   |


**Critical rule:** wallet balance and transaction rows must **never** be writable directly by a client role. All money movement goes through `security definer` Postgres functions (Section 9), and RLS blocks any direct table write to `transactions` and `profiles.wallet_balance`.

---



## 9. Escrow / Wallet Logic (Postgres Functions)

All money-moving operations are implemented as **atomic Postgres functions**, called via Supabase RPC (`supabase.rpc(...)`). This is non-negotiable — doing debit/credit as two separate client calls risks a corrupted ledger on network failure.

```sql
-- Hold escrow when a poster accepts an application
create or replace function accept_application(p_application_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_task_id uuid;
  v_poster_id uuid;
  v_applicant_id uuid;
  v_budget numeric;
begin
  select task_id, applicant_id into v_task_id, v_applicant_id
  from applications where id = p_application_id;

  select poster_id, budget into v_poster_id, v_budget
  from tasks where id = v_task_id;

  if (select wallet_balance from profiles where id = v_poster_id) < v_budget then
    raise exception 'Insufficient balance to hold escrow';
  end if;

  update profiles set wallet_balance = wallet_balance - v_budget where id = v_poster_id;
  update tasks set status = 'assigned', worker_id = v_applicant_id, updated_at = now() where id = v_task_id;
  update applications set status = 'accepted' where id = p_application_id;
  update applications set status = 'rejected' where task_id = v_task_id and id != p_application_id;

  insert into transactions (task_id, from_user, to_user, amount, type)
  values (v_task_id, v_poster_id, null, v_budget, 'escrow_hold');
end;
$$;

-- Release escrow on approved completion
create or replace function release_escrow(p_task_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_poster_id uuid;
  v_worker_id uuid;
  v_budget numeric;
begin
  select poster_id, worker_id, budget into v_poster_id, v_worker_id, v_budget
  from tasks where id = p_task_id and status = 'submitted';

  if v_worker_id is null then
    raise exception 'Task has no assigned worker';
  end if;

  update profiles set wallet_balance = wallet_balance + v_budget where id = v_worker_id;
  update tasks set status = 'completed', updated_at = now() where id = p_task_id;

  insert into transactions (task_id, from_user, to_user, amount, type)
  values (p_task_id, v_poster_id, v_worker_id, v_budget, 'escrow_release');

  update user_category_stats
  set completed_count = completed_count + 1
  where user_id = v_worker_id
    and category_id = (select category_id from tasks where id = p_task_id)
  on conflict (user_id, category_id) do update set completed_count = user_category_stats.completed_count + 1;
end;
$$;

-- Refund escrow on cancellation
create or replace function refund_escrow(p_task_id uuid, p_reason text)
returns void
language plpgsql
security definer
as $$
declare
  v_poster_id uuid;
  v_budget numeric;
begin
  select poster_id, budget into v_poster_id, v_budget from tasks where id = p_task_id;

  update profiles set wallet_balance = wallet_balance + v_budget where id = v_poster_id;
  update tasks set status = 'cancelled', updated_at = now() where id = p_task_id;

  insert into transactions (task_id, from_user, to_user, amount, type)
  values (p_task_id, null, v_poster_id, v_budget, 'refund');
end;
$$;
```

**Rule for the team:** every function that touches `wallet_balance` or `transactions` must be `security definer`, must be wrapped implicitly by Postgres's per-statement transaction semantics (a function body either fully commits or fully rolls back on error), and must **never** be replicated as client-side logic "for speed."

---



## 10. Repository Structure

```
CampusGigs/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                      # Route definitions
│   │   ├── lib/
│   │   │   ├── env.ts                   # Zod-validated VITE_* env vars
│   │   │   └── supabaseClient.ts        # Single Supabase client instance
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx         # Context: session, login, logout
│   │   │   └── RequireAuth.tsx          # Route guard
│   │   ├── components/
│   │   │   └── ErrorBoundary.tsx
│   │   ├── features/
│   │   │   ├── tasks/
│   │   │   │   ├── api.ts               # TanStack Query hooks wrapping Supabase calls
│   │   │   │   ├── components/
│   │   │   │   └── types.ts
│   │   │   ├── wallet/
│   │   │   ├── applications/
│   │   │   ├── reviews/
│   │   │   ├── messaging/
│   │   │   ├── notifications/
│   │   │   ├── recommendations/
│   │   │   └── admin/
│   │   └── pages/
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── supabase/
│   ├── migrations/                      # SQL migration files (schema + RLS + functions)
│   ├── functions/                       # Supabase Edge Functions (recommendation scoring, cron jobs)
│   └── seed.sql                         # Sample categories + demo data
│
└── docs/
    ├── PRD.md                           # This file
    └── ER_DIAGRAM.png
```

**Rules — never break these:**

- Never commit `.env`, `node_modules`, `dist/`, or the Supabase service-role key anywhere in frontend code
- Always commit `.env.example` with placeholder values
- All schema changes go through versioned files in `supabase/migrations/` — no ad-hoc changes via the Supabase dashboard in production
- TypeScript strict mode on

---



## 11. Environment Variables

```env
# ── Frontend (.env.example) ─────────────────────────────────────────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key   # safe to expose — RLS protects data
VITE_ENABLE_REALTIME=true
```

> **Never expose the Supabase** `service_role` **key in frontend code.** It bypasses RLS entirely. It should only ever be used inside a trusted server context (an Edge Function or a secured backend), never shipped to the browser.

---



## 12. Non-Functional Requirements


| Category           | Requirement                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Reliability**    | All wallet operations are atomic via Postgres functions; no partial-write states possible                                       |
| **Security**       | RLS enabled on every table; no direct client writes to `transactions` or `wallet_balance`; college-email domain check on signup |
| **Performance**    | Indexed columns for search/filter (`status`, `category_id`, `created_at`); paginated task feed (never unbounded fetch)          |
| **Observability**  | Audit trail via `transactions` and `disputes.resolved_by`; optional Sentry integration on frontend for error tracking           |
| **Availability**   | Supabase free tier acceptable for demo; document upgrade path to Pro tier if usage grows                                        |
| **Data integrity** | Foreign keys with `on delete cascade` where appropriate; `check` constraints on all enum-like text fields                       |
| **Backups**        | Supabase automatic daily backups (Pro tier) or manual periodic `pg_dump` export on free tier                                    |


---



## 13. Security Checklist

```
[ ] RLS enabled on every table — verify with a non-owner test query per table
[ ] No service_role key present anywhere in frontend bundle (grep build output before deploy)
[ ] College-email domain restriction enforced at signup (trigger or edge function)
[ ] All money-moving logic lives in `security definer` Postgres functions — none in client code
[ ] Direct UPDATE/INSERT/DELETE on `transactions` blocked for the `authenticated` role
[ ] File uploads (proof-of-work) validated for type + size before accepting
[ ] Rate limit sensitive actions (task creation, applications) — Supabase Edge Function + simple counter, or a Postgres-side check
[ ] Input validation client-side (Zod) AND re-checked in Postgres via `check` constraints — never trust the client alone
[ ] Dispute resolution restricted to `is_admin = true` via RLS policy, not just UI hiding
[ ] Supabase project has email confirmation enabled (prevents fake signups)
[ ] .gitignore verified — .env, node_modules never tracked; only .env.example committed
[ ] npm audit run and high/critical issues resolved before each deploy
```

---



## 14. API / RPC Reference


| Function                                          | Type                                                | Purpose                                                          |
| ------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| `accept_application(application_id)`              | RPC (Postgres function)                             | Accepts an applicant, holds escrow, rejects others               |
| `release_escrow(task_id)`                         | RPC                                                 | Releases held credits to worker on approved completion           |
| `refund_escrow(task_id, reason)`                  | RPC                                                 | Refunds poster on cancellation                                   |
| `get_recommendations(user_id, limit)`             | RPC or Edge Function                                | Returns ranked task list using scoring formula                   |
| `resolve_dispute(dispute_id, resolution, action)` | RPC (admin-only via RLS)                            | Admin resolves a dispute — releases, refunds, or splits          |
| Standard Supabase client calls                    | `supabase.from('tasks').select()/insert()/update()` | All non-money CRUD — protected by RLS, no custom function needed |


**Recommendation scoring formula (implemented in** `get_recommendations`**):**

```
score(task, user) =
    w1 * category_match(user.interests, task.category)
  + w2 * difficulty_match(user.experience_level, task.difficulty)
  + w3 * recency(task.created_at)
  + w4 * past_success_in_category(user, task.category)   -- from user_category_stats
```

This is a **content-based filtering recommender** — a legitimate, named technique in recommendation-systems literature, not a black-box claim. Document it as such in your report.

---



## 15. Team Split & Ownership


| Member | Owns                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| **A**  | Auth, Profiles, RLS policies, onboarding quiz UI                                                                |
| **B**  | Task lifecycle (CRUD + state machine), Search/Filter, Applications                                              |
| **C**  | **Wallet/Escrow Postgres functions, transaction ledger UI, dispute resolution** (hardest, highest-value module) |
| **D**  | Messaging, Notifications (Realtime), Recommendation engine, Admin dashboard                                     |


---



## 16. Delivery Roadmap


| Phase        | Scope                                              | Target                                                               |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------------- |
| **Week 1–2** | Schema + RLS + Auth + basic task CRUD              | Skeleton app, no money logic yet                                     |
| **Week 3–4** | Application flow + escrow hold/release functions   | Core loop works end-to-end (post → apply → accept → complete → paid) |
| **Week 5**   | Ratings, notifications, search/filter              | Full MVP feature-complete                                            |
| **Week 6**   | Recommendation engine + onboarding quiz            | "AI Assistant" feature live                                          |
| **Week 7**   | Disputes, messaging, admin dashboard               | Should-have features                                                 |
| **Week 8**   | Security checklist pass, polish, deploy, demo prep | Production-ready state                                               |


---



## 17. Out of Scope / Future Work

- Real payment gateway integration (Razorpay/Stripe) — would replace internal credits
- Native mobile app (React Native) — web-only for v1
- ML-based recommendation model (current version is rule-based/content-filtering by design)
- Multi-college/multi-tenant support — single campus only for v1
- SMS/email notifications — in-app only for v1

---



## 18. Document Maintenance

**Update this file when:**

- Any table schema or RLS policy changes → update Sections 7–8 immediately
- A new Postgres function is added or changed → update Section 9 and 14
- Auth strategy changes (e.g., adding OAuth) → update Section 11 and 13
- A dependency has a published CVE → rotate secrets if affected, upgrade to patched version, log the incident separately (do not add long-lived version pins here)

**Security review triggers:**

- Any change to an RLS policy
- Any new public (unauthenticated) endpoint or Edge Function
- Any change to what the Supabase `anon` role can read/write

---

*This PRD is a living document — update it alongside the codebase, not after the fact.*