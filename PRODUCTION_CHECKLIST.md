# IVORY Production Checklist

## Go-Live Blockers (must be complete before production traffic)
- [ ] `DATABASE_URL` points to PostgreSQL (`postgresql://`), not SQLite (`file:./dev.db`)
- [ ] `CRON_SECRET` set (32+ chars)
- [ ] `UPSTASH_REDIS_REST_URL` set
- [ ] `UPSTASH_REDIS_REST_TOKEN` set
- [ ] `ALLOWED_ORIGINS` configured for all trusted domains (`https://ivory.ge,https://www.ivory.ge`)

## Code Health
- [x] `npm run lint -- --max-warnings=0`
- [x] `npx tsc --noEmit --incremental false`
- [x] `npm run build`
- [x] `npm audit --omit=dev --audit-level=high`

## Build/Release Pipeline
- [ ] For non-Vercel deploys, run in order:
  - `npm ci`
  - `npm run prisma:generate:postgres`
  - `npm run db:deploy`
  - `npm run build`
  - `npm run start`

## Database
- [x] Prisma datasource switched to PostgreSQL
- [x] Fresh PostgreSQL migration created
- [ ] Vercel `DATABASE_URL` set to Neon connection string

## Security
- [ ] `AUTH_SECRET` set (32+ chars)
- [ ] `CRON_SECRET` set (32+ chars)
- [ ] `UPSTASH_REDIS_REST_URL` set
- [ ] `UPSTASH_REDIS_REST_TOKEN` set
- [ ] SMTP credentials set
- [ ] `ALLOWED_ORIGINS` configured for all trusted domains (`https://ivory.ge,https://www.ivory.ge`)

## Domain
- [ ] `ivory.ge` connected in Vercel
- [ ] `www.ivory.ge` redirect/alias configured
- [ ] `NEXT_PUBLIC_SITE_URL=https://ivory.ge`

## Operations
- [x] Vercel cron config added (`/api/cron/cleanup-trash` hourly)
- [ ] First production smoke-test completed
