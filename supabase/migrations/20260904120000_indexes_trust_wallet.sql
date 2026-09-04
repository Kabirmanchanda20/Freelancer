-- Performance indexes + trust signal column + signup credits default

create index if not exists idx_tasks_status_created on public.tasks (status, created_at desc);
create index if not exists idx_tasks_category on public.tasks (category_id);
create index if not exists idx_tasks_poster on public.tasks (poster_id);
create index if not exists idx_tasks_worker on public.tasks (worker_id);
create index if not exists idx_tasks_listing_type on public.tasks (listing_type);
create index if not exists idx_tasks_deadline on public.tasks (deadline) where deadline is not null;
create index if not exists idx_applications_task on public.applications (task_id, status);
create index if not exists idx_applications_applicant on public.applications (applicant_id);
create index if not exists idx_messages_task_created on public.messages (task_id, created_at desc);
create index if not exists idx_notifications_user_read on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_reviews_reviewee on public.reviews (reviewee_id);
create index if not exists idx_transactions_user_from on public.transactions (from_user);
create index if not exists idx_transactions_user_to on public.transactions (to_user);
create index if not exists idx_transactions_task on public.transactions (task_id);

alter table public.profiles
  add column if not exists completed_count int not null default 0;

alter table public.profiles
  alter column wallet_balance set default 100.00;

update public.profiles set wallet_balance = 100 where wallet_balance = 0;

update public.profiles p
set completed_count = coalesce((
  select count(*)::int from public.tasks t
  where t.status = 'completed' and (t.poster_id = p.id or t.worker_id = p.id)
), 0);
