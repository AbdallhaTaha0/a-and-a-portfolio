# Team Portfolio Platform

A full-stack, multi-user team portfolio platform.

The platform has three major surfaces:

1. Public team website
2. Public individual member portfolios
3. Authenticated administration dashboards

The system is content-driven and database-backed. The public pages must never depend on hardcoded member/project data.

## Core principle

Visitors browse the public site and published member profiles without an account. The
platform supports multiple Team Admins who manage team and home-page content. Each
Member manages only their own profile and personal portfolio content after signing in.

The application is intended to run as a serverless application on Vercel with PostgreSQL as the primary database.

See:
- `Rules.md` — non-negotiable engineering and product rules
- `Agents.md` — instructions for coding agents/Codex
- `Schema.md` — database/domain model
- `Plan.md` — implementation roadmap
- `Architecture.md` — application architecture
- `Security.md` — authentication/authorization/security requirements
- `Content.md` — content model and public-page requirements
- `Design.md` — visual identity, components, motion, and responsive behavior
- `API.md` — API/server action conventions
- `Testing.md` — testing strategy

## Local development

Requirements:

- Node.js 20.9 or newer
- npm 11 or newer
- a PostgreSQL database; Neon is the planned provider

Install and start the application:

```text
npm install
npm run dev
```

The application runs at `http://localhost:3000`.

Because the repository folder contains an ampersand (`a&a-portfolio`), package scripts call their local tools directly instead of relying on Windows command shims. Keep using the scripts in `package.json` rather than invoking binaries from `node_modules/.bin`.

## Environment setup

Copy `.env.example` to `.env`, then replace every placeholder locally. Google and
GitHub callbacks are:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
```

For production, replace the origin with the canonical HTTPS domain. Set
`AUTH_ADMIN_EMAIL` to the Google/GitHub email that should bootstrap the first
TEAM_ADMIN. Other emails must already exist as active users before they can sign in.

```text
DATABASE_URL="PUT_YOUR_NEON_POOLED_CONNECTION_STRING_HERE"
DIRECT_URL="PUT_YOUR_NEON_DIRECT_CONNECTION_STRING_HERE"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="GENERATE_A_LONG_RANDOM_VALUE"
AUTH_GOOGLE_ID="YOUR_GOOGLE_OAUTH_CLIENT_ID"
AUTH_GOOGLE_SECRET="YOUR_GOOGLE_OAUTH_CLIENT_SECRET"
AUTH_GITHUB_ID="YOUR_GITHUB_OAUTH_CLIENT_ID"
AUTH_GITHUB_SECRET="YOUR_GITHUB_OAUTH_CLIENT_SECRET"
AUTH_ADMIN_EMAIL="YOUR_ADMIN_EMAIL"
```

- `DATABASE_URL` is the pooled Neon URL used by the running application.
- `DIRECT_URL` is the direct Neon URL used by Prisma migrations.
- `AUTH_SECRET` must be a high-entropy secret unique to each environment.
- OAuth client secrets and database credentials are server-only.
- Never commit `.env` or send its values through chat.
- Configure production values in Vercel's environment settings.

## Quality commands

```text
npm run lint
npm run typecheck
npm run test
npm run prisma:validate
npm run prisma:generate
npm run db:seed
npm run build
```
