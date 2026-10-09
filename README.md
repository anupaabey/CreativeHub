# CreativeHub — Sri Lanka creative services marketplace

A database-backed Next.js / NestJS / PostgreSQL monorepo. This delivery is a working MVP, not the fully completed production scope of the master prompt. See `PROGRESS.md` for the exact implementation and launch gaps.

## Included workflows

- Customer registration, cookie login/logout, creator onboarding under the same account, email verification and password reset with single-use tokens and session revocation.
- Public creator portfolios, consent-aware publishing, service package creation/editing/archiving, location/category/budget/rating/remote search and favorites.
- Booking requests, provider quotations, customer acceptance, explicitly labeled sandbox checkout, date-conflict checking, project delivery, revisions, completion, disputes and verified booking reviews.
- Private booking conversations, in-app notifications, creator analytics, agency profiles/teams/service assignment and platform administration.
- S3-compatible upload URLs, public raster images and private deliverable download URLs; optional external delivery links.
- Integer monetary values, idempotent sandbox payments, balanced immutable journals and full sandbox refund reversals for cancelled bookings.
- Account data export, soft deletion, support tickets, configurable plans, administration audit logs, Swagger API docs.

**No real money is collected. PayHere, OnePay and WEBXPAY are fail-closed interface placeholders, not live integrations.** No gateway signature or reconciliation implementation is claimed. Seed data contains categories, districts and plans only; it does not fabricate providers, testimonials or revenue.

## Local setup (Windows, macOS or Linux)

Install Node.js 22+ and Docker Desktop with Compose. Open a terminal in this folder.

1. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` in a Unix shell).
2. Run `npm ci`.
3. Run `docker compose up -d db redis minio mailpit`.
4. Run `npm run db:generate`, then `npm run db:deploy`, then `npm run db:seed`.
5. Open http://localhost:9001 and sign into MinIO using `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`. Create the private bucket `creativehub`. Keep it private; access uses signed URLs. Set browser upload CORS for http://localhost:3000 if your storage vendor requires it.
6. Run `npm run dev` in one terminal and `npm run email:worker` in another.
7. Open http://localhost:3000. API docs are http://localhost:4000/api/docs. Test emails appear in http://localhost:8025.

Do not reuse development secrets or test credentials in production. The API requires a matching `Origin` header on unsafe requests, including CLI requests. The browser app supplies it automatically. `WEB_URL` must match the browser origin exactly. Use the default same-origin Next.js proxy, or configure `NEXT_PUBLIC_API_URL` at build time. Server rendering uses `API_INTERNAL_URL`.

## Try the complete journey

Register a creator, use **Overview → Become a creator**, then publish the profile in **Settings**. Add a consented portfolio item and a service package. In a separate browser profile, register a customer and book that creator. Send messages; the creator sends a quotation, the customer accepts and simulates checkout. Start work as the creator, add a private file or a delivery link, and submit delivery. Approve completion as the customer and submit a review.

Create an agency from **Agency team**, add a registered member using the account ID from their Settings, then open **Agency projects and services**. Agency administrators can create services assigned to their member creators and reassign unquoted booking requests. Ordinary members see bookings assigned to their creator profile. Members must publish their creator profiles to accept public bookings.

There are no seeded administrator accounts or hardcoded administrator passwords. Register an account, then run:

```sh
npm run admin:grant -- your-registered-email@example.com
```

The **Administration** tab becomes available after refreshing. You can review creators, configure categories/plans, resolve disputes, inspect support records and simulate full refunds on cancelled sandbox bookings.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run test:local
```

`test:local` runs a disposable PostgreSQL WASM instance, the compiled API, and automated HTTP/database checks. Build the API first. It uses synthetic accounts in an in-memory test database and never touches your configured database. It validates sequential transactions, not real PostgreSQL multi-connection concurrency. For a running real PostgreSQL/API installation, run `npm run test:integration`; that creates clearly named test accounts and records, so use a disposable test database.

## Full application containers

First initialize the database using the local setup commands above. Then run `docker compose --profile app up --build -d`. The app profile uses development cookie settings for localhost. It is not a production HTTPS deployment configuration. Use `docker compose --profile email up --build -d email-worker` for the email worker.

Docker and external SMTP/S3 connectivity were not executable in the delivery environment; these integrations need validation on your machine. See `docs/DEPLOYMENT.md`.

## Repository

- `apps/web`: Next.js App Router, dashboard UI and public pages.
- `apps/api`: NestJS controllers, authorization, booking/financial services and media interfaces.
- `prisma`: normalized schema, SQL migration, seed and financial database constraints.
- `packages/shared`: role/state definitions and Sri Lankan localization helpers.
- `scripts`: administrator grant, email worker and integration checks.
- `docs`: architecture, deployment and launch requirements.

Set `NEXT_PUBLIC_BRAND_NAME` before rebuilding to change the main brand. Some descriptive copy and email subjects still use the temporary CreativeHub name and should be updated during a final branding pass.
