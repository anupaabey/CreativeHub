# Deployment and launch review

## Runtime

Use Node.js 22+, PostgreSQL 16+, compatible S3 storage, an SMTP sender and a reverse proxy with HTTPS. The web server must reach `API_INTERNAL_URL`. The browser can use the same-origin Next.js proxy; set `NEXT_PUBLIC_API_URL` empty at build time. API `WEB_URL` must match the public browser origin exactly. Keep database/object-storage credentials on the server.

1. Install from the lockfile with `npm ci`.
2. Supply `DATABASE_URL`; generate the client with `npm run db:generate`.
3. Apply the SQL migration using `npm run db:deploy`; seed reference data using `npm run db:seed`.
4. Build with `npm run build`. Run API/web processes and one email worker under your process manager. Workspace `start` for the API reads `.env`; the Docker image runs the compiled entry directly using injected environment variables.
5. Set `NODE_ENV=production`, secure random secrets, HTTPS public URLs, and `PAYMENTS_MODE=disabled` until production payment work is implemented. Secure cookies require HTTPS.
6. Register and promote an operator account with the administrator CLI. Do not expose that command or database credentials to browser users.
7. Configure the S3 private bucket, upload CORS and both storage URLs. `S3_ENDPOINT` is the server-facing endpoint; `S3_PUBLIC_ENDPOINT` must be reachable from the user's browser because signed links use it. `API_PUBLIC_URL` is the browser-facing API origin used for public image URLs.
8. Configure SMTP delivery, SPF/DKIM/DMARC and the real `EMAIL_FROM`. The single email worker retries failed jobs up to five attempts. Inspect stalled jobs and transition to a distributed claimed-job queue before horizontal scaling.

## What was tested

Typechecks, builds, core unit tests, HTTP API journeys and SQL financial invariants using an in-memory PostgreSQL WASM harness. That harness has one database backend and is not a concurrency substitute for real PostgreSQL. Docker is unavailable in the delivery environment. Real S3/SMTP, signed upload downloads and provider integrations require separate runtime validation.

## Before public launch

- Run real PostgreSQL multi-client tests for simultaneous conflicting bookings, payment idempotency, refund replay and transaction retries. The application currently uses serializable transactions and bounded retry.
- Validate upload content, permissions, quotas and malware scanning; reject malicious content and expire abandoned upload records. Current confirmation verifies declared length/type, not full content scanning.
- Add administrative MFA and stronger sensitive-action controls before delegating production financial authority.
- Finish subscription billing/entitlements, automatic expirations, message abuse controls and moderation.
- Add monitoring, structured logs, error reporting, alerting, database backups and a tested restore procedure.
- Define and implement data retention, media deletion, access/export scope, operator contact details and final approved legal documents.
- Test browser/mobile journeys and accessibility. Build success is not a browser E2E or security audit.

## Payments

`PAYMENTS_MODE=sandbox` simulates only; records use provider `SANDBOX` and ledger accounts start with `SANDBOX_`. No external checkout, raw card data, custody or payout is implemented. A normal merchant gateway must not be assumed to offer marketplace settlement.

The three named payment classes are interface boundaries that throw for checkout and webhook verification. Implement one provider against its actual documentation and approved merchant agreement, including hosted checkout, raw-body signature checks, transaction correlation, amount/currency validation, replay protection, reconciliation, refunds and chargebacks. Choose the approved partner marketplace or provider-direct model before enabling real money. Do not reinterpret sandbox journal accounts as cash balances.

## Accounting migration

The migration adds checks and triggers for rating bounds, monetary entry signs, date ordering, balanced journals, immutable financial entries/headers and historical journal append rejection. These SQL constraints are additional to the Prisma model. Do not replace migrations with `db push` for deployment; doing so omits these protections.

The initial migration has not been applied to any production database. If you have independently deployed an earlier starter schema, back it up and create a separate reviewed migration rather than overwriting its migration history.
