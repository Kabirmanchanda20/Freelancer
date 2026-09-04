-- Allow guests to browse open listings with poster display names
create policy profiles_select_anon on public.profiles
  for select to anon using (true);
