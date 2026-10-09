# Publish CreativeHub from GitHub to Vercel

This repository needs two Vercel projects and a hosted PostgreSQL database. Publishing just the Next.js project makes the public site reachable but does not activate login, bookings or dashboards.

## 1. Database

Create a PostgreSQL database with your chosen provider. Store the connection URL as the API project's sensitive `DATABASE_URL` environment variable. Use a provider-supported pooled URL for runtime functions. Apply the included migration and seed reference data once, using the provider's direct connection URL where required. Do not run migrations automatically on every preview build.

From a trusted local terminal with a private `.env` containing the target direct database URL:

```sh
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
```

Never put the connection URL in GitHub, browser variables or chat.

## 2. API project

Import `anupaabey/CreativeHub` into Vercel as `creativehub-api`.

- Root Directory: `apps/api`
- Framework: NestJS
- Include files outside the Root Directory: enabled (the Prisma schema and workspace lockfile live at the repository root).
- Install/build settings: supplied by `apps/api/vercel.json`.
- Node.js: 22.x
- Environment: `DATABASE_URL`, `NODE_ENV=production`, `WEB_URL` (the exact final website origin), `PAYMENTS_MODE=disabled`, and a random `ANALYTICS_HASH_SALT`.

Storage additionally needs the `S3_*` variables and `API_PUBLIC_URL`. Without storage configuration, uploads stay unavailable. Deploy and record the assigned API domain. Check `/api/v1/health` after deployment, then database-backed `/api/v1/categories` after migrating/seeding.

## 3. Website project

Import the same repository again as `creativehub`.

- Root Directory: `apps/web`
- Framework: Next.js
- Include files outside the Root Directory: enabled.
- Install/build settings: supplied by `apps/web/vercel.json`.
- Node.js: 22.x
- `API_INTERNAL_URL=https://<your-api-domain>` (no trailing slash).
- `NEXT_PUBLIC_API_URL`: leave unset or empty so browser requests go through the website's same-origin proxy.
- `SITE_URL=https://<your-website-domain>` and `NEXT_PUBLIC_BRAND_NAME=CreativeHub`.

Deploy. Set the API project's `WEB_URL` to this website's exact origin and redeploy the API. If you change `API_INTERNAL_URL`, redeploy the website because rewrite destinations are configured at build time.

## 4. Check the deployment

- Public homepage, Explore and pricing load.
- Register a customer and creator; confirm the session remains signed in through the website proxy.
- Publish a creator profile, create a package and send a customer booking request.
- Confirm conversations and bookings cannot be accessed by another account.
- Validate signed storage uploads/downloads if storage has been configured.

Avoid deploying a public environment with local development secrets or localhost URLs. Production payments remain disabled; the existing gateway adapters are not live integrations.

## Worker and preview limitations

The continuous `scripts/email-worker.mjs` loop is not deployed by either Vercel project. Run it on a separate worker host or implement a bounded authenticated scheduled job before relying on email delivery. Password reset requests can be queued without being delivered if no worker runs.

A preview website has a different origin. Use an isolated preview API/database and set its exact `WEB_URL`, or deliberately configure an approved preview-origin policy. Do not relax the Origin check to arbitrary websites.

Vercel deployment protection on the API can prevent the website proxy/server from reaching it. Configure access deliberately for the intended public API; never assume a protected preview URL is a usable production backend.

Deployment configuration has been prepared and locally built. A live deployment requires access to the Vercel account and configured hosted database; this document is not evidence that the website is already published.

Official references: https://vercel.com/docs/frameworks/backend/nestjs and https://vercel.com/docs/monorepos
