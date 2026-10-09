# Delivery status — 9 October 2026

## Completed MVP functionality

- Installed dependencies; repaired the starter's invalid Prisma syntax; generated the client and executable initial PostgreSQL SQL migration.
- Strict TypeScript Next.js/NestJS monorepo with password hashing, opaque hashed sessions, role guards, trusted-Origin protection, input validation, Helmet and request throttling.
- Register/login/logout, dual customer/creator accounts, reset/verification token workflows, email outbox worker, account export and identity deactivation.
- Creator profile editing, portfolio CRUD/publishing/archiving with consent, one fixed-price package per service, service updates/archiving and public portfolios.
- Marketplace pagination, category/district/city/budget/rating/remote filtering, alphabetical/recent sorting and favorites.
- Booking requests, revised quotations before acceptance, scoped project actions, sandbox confirmation, date overlap checks, project delivery links/files, revision limits, customer completion, review eligibility and duplicates protection.
- Private booking messages with 15-second polling, read timestamps, in-app notifications and basic creator charts.
- Agency registration, public profiles, membership administration, agency service creation, team-scoped booking lists and reassignment of unquoted bookings.
- Admin overview, creator verification, category/plan configuration, dispute resolution, support viewing, sandbox financial oversight and audit logging.
- S3 presigned uploads/downloads, metadata checks, private booking-file authorization and public image delivery.
- Sandbox checkout idempotency; commission rounding; balanced ledger; immutable entries/headers; no appending to historical journals; full simulated refund reversals for cancelled bookings.
- Pricing/help/about pages; draft terms/privacy pages; robots and public sitemap; local Compose and Dockerfile.

## Verification

Actual command results are recorded in `docs/VALIDATION.md`.

## Not completed or not production-validated

These are separate from credentials and must not be described as finished:

- Live PayHere/OnePay/WEBXPAY checkout, provider-specific signature verification, reconciliation, chargebacks, real refunds, partner settlement and payouts. Adapter classes intentionally throw rather than pretend to implement these flows.
- Subscription checkout/renewal/billing records and entitlement enforcement beyond commission lookup and editable plans.
- Distributed email jobs/Redis consumers, broad event email notifications, WebSockets, message attachments/reporting/blocking, robust anti-spam and content moderation.
- Media malware scanning, quota enforcement, multipart uploads, streaming/transcoding, signed-upload replay controls and full privacy retention/purge workflows. S3 and SMTP interfaces are implemented but not tested against external services here.
- Rich portfolio layout/theme editor, project reordering, before/after displays, integrated video showcase UI and dedicated portfolio-project/service detail pages.
- Availability/calendar management UI, milestones, automatic quote expiry jobs, configurable add-ons/travel/cancellation policies and multiple package tiers per service.
- Agency financial reporting, paid entitlements, invitations delivered by email, employee offboarding and granular team permissions beyond administrator vs assigned member.
- Full admin user suspension, verification evidence intake, review moderation, support resolution, financial reconciliation reports, audit pagination and privileged-action MFA.
- Complete revenue/commission/time-range analytics and conversion attribution. Current overview is real booking counts plus profile views and basic inquiry charts; sample statistics are not manufactured.
- OAuth, production email sender setup, formal accessibility/browser E2E suite, production load/security audit, real PostgreSQL concurrency tests, Docker execution, backup restore validation and legal/operator approval of launch documents.

## Next implementation order

1. Run the included app against real PostgreSQL, MinIO/S3 and SMTP; validate Docker deployment and concurrent date reservations.
2. Complete subscriptions/entitlements, calendar availability, moderation, advanced analytics and operational email jobs.
3. Implement and sandbox-test the first payment gateway from its actual merchant contract and official signature/webhook specification. Verify provider-direct or approved marketplace settlement before enabling live money.
4. Add browser E2E coverage, production monitoring/backups, storage scanning/quotas and the final operator/privacy/security review.
