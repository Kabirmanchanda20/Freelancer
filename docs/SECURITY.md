# Security notes (Express + Supabase DB/Storage)

## Architecture

- Browser never receives Supabase `service_role` or DB password
- Frontend calls Express only (`VITE_API_BASE_URL`)
- Express uses `DATABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (storage uploads)

## RLS advisory

Tables intentionally do **not** rely on Supabase RLS for the product API.
Instead, direct PostgREST access is revoked for `anon` / `authenticated`.

If you re-enable Supabase client access later, add RLS policies before exposing the anon key.

## Checklist

- [x] JWT access + httpOnly refresh cookie
- [x] `@thapar.edu` enforced (Zod + DB check)
- [x] Department accounts cannot apply
- [x] Workshop hosting gated by `can_host_workshops`
- [x] Money/escrow deferred
- [x] Soft wallet credits + escrow hold/release/refund via Express transactions
- [x] Anon/authenticated table grants revoked
- [x] Structured logging (pino); prod hides stack traces
- [x] Performance indexes on hot query paths
- [ ] Rotate any anon keys that were previously committed/shared
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is the long JWT service_role secret (not publishable key)

> Note: RLS remains disabled by design because the API uses the Postgres connection string directly (not PostgREST). Direct table access for `anon`/`authenticated` is revoked instead. Do not enable RLS without policies or Express DB access will break.
