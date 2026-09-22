# Deployment

This checklist deploys the application to Vercel with Neon PostgreSQL and Vercel Blob.
Complete it first with non-production test data, then repeat it for production.

## 1. Pre-deployment checks

- Use a clean, reviewed Git commit.
- Confirm `.env`, `.env.local`, and `.vercel` are not tracked by Git.
- Run `npm ci`.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
- Run `npm audit` and review applicable production dependency findings.
- Confirm the latest Prisma migrations are committed.
- Confirm the GitHub Actions `CI` workflow passes on the release commit.

## 2. Create the Vercel project

1. Import the GitHub repository into Vercel.
2. Keep the framework preset as Next.js.
3. Use the repository root as the project root.
4. Set the production Node.js version to a version supported by the installed Next.js release.

## 3. Configure environment variables

Configure separate values for Development, Preview, and Production. Preview deployments
must not use the production database or storage by default.

Required application variables:

```text
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_APP_URL
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
AUTH_ADMIN_EMAIL
```

- `DATABASE_URL` is the Neon pooled, TLS-enabled runtime URL.
- `DIRECT_URL` is the Neon direct URL used only for Prisma migrations.
- `NEXT_PUBLIC_APP_URL` is the exact canonical HTTPS origin with no path.
- Generate a unique high-entropy `AUTH_SECRET` for each environment.
- Never paste credentials into source files, commits, issue trackers, or chat messages.

## 4. Configure OAuth callbacks

Add the canonical production callbacks to the Google and GitHub OAuth applications:

```text
https://YOUR_DOMAIN/api/auth/callback/google
https://YOUR_DOMAIN/api/auth/callback/github
```

Keep localhost callbacks only for local development. Confirm that the provider application
origin, callback, and `NEXT_PUBLIC_APP_URL` all refer to the same intended environment.

## 5. Apply database migrations

Run the reviewed production migration against the intended database:

```text
npm run db:deploy
```

Do not run `prisma migrate dev`, reset commands, or destructive migration commands against
production. Seed only when the production seed content has been reviewed and is intended.
For local verification, first confirm that `DIRECT_URL` points to a dedicated development
Neon branch rather than shared or production data, then apply the migration there. Do
not infer the environment from the default `neondb` database name alone.

## 6. Connect Vercel Blob

Blob setup is intentionally deferred until deployment:

1. Open the Vercel project.
2. Go to **Storage**, choose **Create Database**, and select **Blob**.
3. Choose **Public** access because published portfolio images are public.
4. Connect the store to the required environments.
5. Redeploy if the store was connected after a deployment was created.

Vercel supplies the deployment credential through its connected environment. Depending on
the account and connection type, this may use OIDC automatically or expose a managed
`BLOB_READ_WRITE_TOKEN`. Do not copy that value into the repository.

For local upload testing after the Vercel project and Blob store exist:

```text
vercel link
vercel env pull
```

The pulled local environment file must remain ignored by Git.

## 7. Deploy and verify

After deployment, verify:

- `/`, `/projects`, `/members`, and published detail pages work without signing in.
- `/login` accepts only invited active Google or GitHub accounts.
- an active MEMBER can access only their own profile workspace.
- a TEAM_ADMIN can access team administration and, when linked, their personal workspace.
- an inactive or uninvited account is denied.
- `/robots.txt` excludes private routes and points to `/sitemap.xml`.
- `/sitemap.xml` contains only published members and projects with the production origin.
- unknown and unpublished public URLs render the branded not-found experience.
- security headers are present on public, login, admin, error, and not-found responses.

## 8. Test media storage

Use non-sensitive test images and verify all of the following after Blob is connected:

1. Upload a valid JPEG, PNG, and WebP below 5 MB.
2. Confirm the resulting image loads on the intended public page.
3. Reject an oversized, unsupported, extension-mismatched, or spoofed file.
4. Confirm a MEMBER cannot upload to another member or a team Project.
5. Replace an image and confirm the old Blob is removed only when unreferenced.
6. Delete a gallery image and confirm both its database metadata and unreferenced Blob are removed.
7. Review logs and confirm they contain no token, database URL, raw header, or private message data.

The rate-limit migration must be deployed before testing OAuth initiation, the public
contact form, media uploads, or high-impact administrator actions. Without the
`RateLimitBucket` table these operations fail closed with a safe temporary-unavailable
message. After migration, test the 20-attempts-per-hour shared administrator bucket
with a disposable account and content; do not use live member or project data.

## 9. Release and rollback readiness

- Complete the manual role matrix in `Testing.md` with two MEMBER and two TEAM_ADMIN accounts.
- Confirm the final active TEAM_ADMIN protection works.
- Confirm Neon backups and restoration procedures.
- Record the last known-good Vercel deployment for rollback.
- Rotate any credential exposed during setup and redeploy affected environments.
- Add monitoring and alerting before treating the deployment as production-ready.
