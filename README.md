# Project Command

Project Command is a production Next.js application for running company-scoped project portfolios. It supports administrator and read-only access, Current/Pending/Finalized projects, QAR-only costs, Asia/Qatar dates and times, project and task notes, task-derived progress, document storage, and user administration.

## Stack

- Next.js 16 App Router and React 19
- Neon Postgres with Drizzle ORM and versioned SQL migrations
- Signed HTTP-only sessions with bcrypt password hashing
- Vercel deployment
- Vitest and Playwright

## Local setup

1. Copy `.env.example` to `.env.local` and configure the required values.
2. Install dependencies with `npm install`.
3. Run `npm run db:migrate` and `npm run db:seed`.
4. Start the application with `npm run dev`.

## Commands

- `npm run db:generate` — generate SQL migrations from the schema
- `npm run db:migrate` — apply pending migrations
- `npm run db:seed` — create the initial administrator and onboarding records
- `npm run db:verify` — verify required tables and seed records
- `npm run test` — run unit tests with coverage
- `npm run test:e2e` — run browser tests on desktop and mobile
- `npm run check` — lint, type-check, unit-test, and build

## Security model

Every authenticated user is assigned one or more companies. Project queries, detail views, and document downloads enforce those company assignments on the server. Administrators can mutate records and manage users; read-only users can browse and download only. Uploaded files are validated, limited to 4 MB, stored in Postgres, and served with private no-store headers.
