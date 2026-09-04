-- Express backend connects with the database password / service role and owns authorization.
-- RLS is intentionally not relied upon for the API. Keep tables usable by the backend role.

-- Optional: enable RLS later for defense-in-depth if exposing PostgREST; not required for Express.
select 1;
