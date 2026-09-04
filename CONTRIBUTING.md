# Contributing to CampusGigs

## Quick setup

```bash
cd backend && npm install && cp .env.example .env && npm run dev
cd frontend && npm install && cp .env.example .env && npm run dev
```

Use Supabase **Session Pooler** for `DATABASE_URL` on IPv4 networks.

## Scripts

| Area | Command |
|------|---------|
| Backend typecheck | `cd backend && npm run typecheck` |
| Backend tests | `cd backend && npm test` |
| Frontend build | `cd frontend && npm run build` |

## Guidelines

1. Keep Express as the only write path to Postgres (no client Supabase DB access).
2. Validate inputs with Zod on every mutating route.
3. Prefer small PRs with a clear why.
4. Do not commit `.env` or secrets.
5. For wallet/escrow changes, keep hold → release/refund atomic in a DB transaction.

## Architecture note

Auth is Express-owned (`app_users` + JWT). Supabase is Postgres + Storage only.
