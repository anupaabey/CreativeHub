# Architecture

CreativeHub is a modular monorepo with a Next.js browser/server frontend, a NestJS HTTP API and PostgreSQL persistence through Prisma. It is intentionally one API, not distributed microservices.

Authentication stores Argon2id password hashes and SHA-256 hashes of opaque session tokens. Browser cookies are HTTP-only. Backend guards resolve current roles; booking services also enforce participant ownership and agency scope. Unsafe HTTP requests require the configured browser Origin. Anonymous view tracking uses a random visitor cookie and a day-scoped salted hash, not a stored IP address.

A creator is attached to one user account, which retains customer access. Services have published status and a standard package. Portfolio projects begin private and require publication permission. Organizations own service assignments while creator membership scopes employee bookings.

Booking commands are transactional. Requests create the customer request, booking, project and conversation together. Providers quote; customers accept. Only the sandbox payment service confirms paid bookings. It checks quote expiry and overlapping active appointments in serializable transactions. Delivery requires a file/link, approval belongs to the customer and review creation requires completed ownership and a unique booking review.

Messaging is scoped by booking access and uses authenticated polling. In-app notifications are stored in the same business transactions. Email recovery messages use a database outbox and a separate SMTP worker. Redis is provisioned but is not yet used by a distributed queue.

Public images and private project files use S3-compatible object storage. Upload and download URLs expire; server-side metadata checks confirm size and content type. Object references are stored separately from signed URLs. Streaming, scan/quota enforcement and signed-upload replay hardening are later work.

Sandbox finance records integer minor units. Commission is rounded deterministically. A journal debits a test partner receivable and credits creator entitlement and commission. Refunds append reversal journals. PostgreSQL triggers forbid changing recorded journals/entries or adding entries to historical journals, and enforce balanced entries at commit. No production payment or real account balance exists.

Swagger is available at `/api/docs`; application endpoints use `/api/v1`. Controller DTOs define runtime validation. Source modules include auth, marketplace, workspace, administration, media and payment interfaces. `PROGRESS.md` distinguishes implemented workflows from unimplemented production functionality.
