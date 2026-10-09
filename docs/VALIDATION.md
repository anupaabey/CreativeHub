# Verification results — 9 October 2026

| Check | Actual result |
|---|---|
| Dependency installation | Passed; lockfile included |
| `npm ci --dry-run --ignore-scripts` | Passed |
| Prisma format/client generation | Passed |
| Initial SQL migration | Executed successfully in disposable PostgreSQL WASM |
| `npm run typecheck` | Passed for web, API and shared packages |
| `npm test` | Passed: 10 business-rule unit tests |
| `npm run build` | Passed: shared package, NestJS API and optimized Next.js frontend |
| `node scripts/test-local.mjs` | Passed: 49 HTTP/journey checks plus database and recovery assertions |
| Script syntax checks | Passed for integration runner, local test harness and email worker |
| Docker containers | Not run; Docker is unavailable in this environment |
| Real PostgreSQL concurrency | Not verified by the single-backend WASM harness |
| External SMTP and object storage | Interfaces implemented; external runtime not verified |
| Live gateway checkout/webhooks | Not implemented; fail-closed placeholders |
| Browser E2E/accessibility/load/security audits | Not completed |

The end-to-end API journey covers customer/creator registrations, consent restrictions, service publication, private booking access, quotations, customer-only acceptance, repeated sandbox checkout, required deliverables, provider/customer state permissions, completion and duplicate-review rejection. Additional checks cover agency membership access, category/budget/rating filters, overlapping appointment rejection, daily-view deduplication, ledger balancing/immutability, authorized sandbox refunds with replay protection, and password reset token reuse/session revocation.

Synthetic test accounts and reviews exist only in the disposable in-memory database. No providers, reviews, payments or statistics are seeded into a normal installation.

The completed frontend build contains public home/about/explore/agency/pricing/help pages, creator portfolios, login/register/recovery pages, creator/customer workspaces, agency management and private booking detail routes. Compilation does not replace browser interaction testing.
