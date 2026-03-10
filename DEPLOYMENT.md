# IVORY Deployment (Simple Path)

Use this stack:
- Hosting: Vercel
- Database: Neon PostgreSQL
- Images: Google Drive links (already supported)

This is the easiest reliable setup for your project.

## 1. Accounts you need
- GitHub
- Vercel
- Neon
- Upstash
- DNS access for `ivory.ge`

## 2. Create database in Neon
1. Create a Neon project.
2. Copy the PostgreSQL connection string.

## 3. Connect repo to Vercel
1. Vercel -> Add New -> Project.
2. Import this GitHub repository.
3. Keep framework as Next.js.

## 4. Add Environment Variables in Vercel
Project -> Settings -> Environment Variables

Required:
- `DATABASE_URL` = Neon connection string
- `AUTH_SECRET` = random 32+ chars
- `CRON_SECRET` = random 32+ chars
- `UPSTASH_REDIS_REST_URL` = Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` = Upstash Redis REST token
- `NEXT_PUBLIC_SITE_URL` = `https://ivory.ge`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `ADMIN_EMAIL`

Recommended:
- `ALLOWED_ORIGINS` = comma-separated list of trusted origins (e.g. `https://ivory.ge,https://www.ivory.ge`)

## 5. Deploy
- Click Deploy.
- `vercel.json` is already configured.
- Build will run:
  - `prisma generate --schema prisma/schema.postgres.prisma`
  - `prisma migrate deploy --schema prisma/schema.postgres.prisma`
  - `next build`

## 5.1 Deploy on non-Vercel server (manual pipeline)
Run commands in this exact order:
1. `npm ci`
2. `npm run prisma:generate:postgres`
3. `npm run db:deploy`
4. `npm run build`
5. `npm run start`

Notes:
- Ensure server env has the same required variables as section 4.
- `npm run build` alone is not enough for PostgreSQL deployment; Prisma generate/migrate must run first.

## 6. Connect domain
1. Vercel -> Project -> Settings -> Domains.
2. Add `ivory.ge` and `www.ivory.ge`.
3. Apply DNS records exactly as Vercel shows.
4. Wait for DNS propagation.

## 7. After first deploy, test
- Home page
- Catalog page
- Product page
- Admin login
- Create/edit product
- Contact form
- Booking form

## 8. Local development
Local dev uses SQLite from `.env`:
- `DATABASE_URL="file:./dev.db"`

Production on Vercel uses PostgreSQL from Vercel env vars.
