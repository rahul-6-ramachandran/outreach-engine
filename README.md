# Ping! ⌯⌲

A local-first outreach platform for managing job opportunities, finding
relevant professional contacts, generating tailored outreach drafts, and
sending them through an explicit approval workflow.

> **Status:** Working local application. SMTP delivery has been verified
> end-to-end with a controlled test recipient.

## Why I built this

Job applications often separate two workflows that are closely related:

-   finding an opportunity
-   reaching the right person about it

WarmRoute connects those workflows without turning the system into an
automated bulk-email tool.

The application lets me:

1.  Enter a company and role.
2.  Find matching contacts from the local contact database.
3.  Review the match and contact information.
4.  Generate an outreach draft based on the role and contact type.
5.  Persist the draft.
6.  Explicitly approve it.
7.  Review a final send confirmation.
8.  Send through a configurable email provider.
9.  Track the resulting outreach and delivery attempt in persistent
    history.

The emphasis is on **control, traceability, and safe state transitions**
rather than fully autonomous outreach.

------------------------------------------------------------------------

## Core workflow

``` text
Company + Role
      |
      v
Opportunity
      |
      v
Contact Matching
      |
      v
Contact Selection
      |
      v
Draft Generation
      |
      v
Persistent DRAFT
      |
      v
Explicit Approval
      |
      v
Send Confirmation
      |
      v
Email Provider
      |
      v
Persistent Outreach History
```

The send lifecycle is persisted rather than being maintained only in
frontend session state.

### Outreach states

``` text
DRAFT
  |
  v
APPROVED
  |
  v
SENDING
  |
  +----> SENT
  |
  +----> FAILED
  |
  +----> UNKNOWN
```

Each send attempt is recorded separately so that provider activity and
application state can be reconciled without blindly retrying an
uncertain delivery.

------------------------------------------------------------------------

## Features

### Opportunity and contact matching

-   Create opportunities using company and role information.
-   Match opportunities against locally stored contacts.
-   Role-aware matching and contact-role classification.
-   Match scores and reasons are persisted with the opportunity/contact
    relationship.
-   Existing opportunities can be reopened and their saved matches
    reviewed.

### Outreach drafting

-   Generate outreach drafts from the selected opportunity and contact.
-   Different outreach strategies/templates are available for contact
    categories such as:
    -   Engineering leadership
    -   Technical hiring managers
    -   Recruiters
    -   HR
    -   Founders
    -   General professional contacts
-   Drafts are persisted before sending.

### Controlled sending

Sending requires explicit progression through the application:

``` text
Create Draft -> Approve -> Confirm Send -> Send
```

The application does not automatically send an outreach simply because a
draft was generated.

Before sending, eligibility is checked again, including the contact and
selected email address.

### Persistent outreach history

The application records:

-   recipient email
-   subject
-   body
-   opportunity
-   contact
-   outreach status
-   approval timestamp
-   send timestamp
-   failure information
-   individual send attempts

This allows the application to show actual persisted outreach history
rather than relying on temporary frontend state.

### Email provider abstraction

The email layer supports:

-   `log` --- safe local development/testing provider
-   `smtp` --- real SMTP delivery using Nodemailer

The provider is selected through configuration:

``` env
EMAIL_PROVIDER=log
```

For a controlled real-email test:

``` env
EMAIL_PROVIDER=smtp
```

SMTP credentials remain in the local `.env` file and are intentionally
excluded from Git.

------------------------------------------------------------------------

## Safety and privacy

WarmRoute is designed as a **local-first personal tool**.

### Local contact data

The application is intended to work with a local PostgreSQL database
containing contact information. The contact dataset itself is not part
of this repository.

No contact CSVs, spreadsheets, or private datasets are committed to Git.

### Explicit sending

The application does not treat draft generation as permission to send.

A user must explicitly:

1.  create the draft
2.  approve it
3.  confirm the send

### Do-not-contact checks

Contact and email-level `doNotContact` flags are checked during the
approval/send lifecycle.

This prevents an otherwise valid draft from being sent when the selected
contact or email address is no longer eligible.

### Secrets

Local configuration is stored in `.env`.

Only `.env.example` is tracked:

``` env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

Do not commit real database credentials, SMTP credentials, application
passwords, or session secrets.

------------------------------------------------------------------------

## Architecture

``` text
+------------------------------+
|          React UI            |
|                              |
| Dashboard                    |
| Opportunities                |
| Contact Selection             |
| Draft Composer                |
| Send Confirmation             |
| Outreach History              |
+---------------+--------------+
                | HTTP
                v
+------------------------------+
|        NestJS Backend        |
|                              |
| Auth                         |
| Opportunities                |
| Contact Matching             |
| Outreach Lifecycle           |
| Email Provider Abstraction   |
+---------------+--------------+
                |
        +-------+--------+
        v                v
+-------------+  +---------------+
| PostgreSQL  |  | Email Provider|
|             |  |               |
| Opportunities| | Log / SMTP    |
| Contacts     | | Nodemailer    |
| Matches      | |               |
| Outreach     | |               |
| Attempts     | |               |
+-------------+  +---------------+
```

### Backend

The backend uses NestJS with PostgreSQL access through a small database
service.

The application persists the outreach lifecycle in:

-   `outreach`
-   `outreachAttempt`

This separates the logical outreach record from individual provider
attempts.

### Transactional send lifecycle

The send operation is deliberately split into database and provider
phases.

At a high level:

``` text
APPROVED
   |
   v
Atomically claim as SENDING
   |
   v
Create STARTED attempt
   |
   v
Commit transaction
   |
   v
Call email provider
   |
   +----------------+
   |                |
   v                v
Success           Failure
   |                |
   v                v
 SENT             FAILED
```

The provider call is not held inside the database transaction.

If the provider succeeds but final database persistence fails, the
application avoids incorrectly converting the operation into a normal
provider failure. The attempt remains recoverable/uncertain instead of
encouraging an unsafe blind retry.

------------------------------------------------------------------------

## Tech stack

### Frontend

-   React 18
-   TypeScript
-   Vite
-   React Router
-   TanStack Query
-   Tailwind CSS
-   React Hook Form
-   Zod
-   Lucide React

### Backend

-   NestJS 12
-   TypeScript
-   PostgreSQL
-   `pg`
-   Prisma schema/contract tooling
-   Nodemailer
-   Vitest
-   Supertest
-   Oxlint
-   Prettier

### Authentication

The application uses an HTTP-only session cookie with:

-   SameSite protection
-   server-side session validation
-   configurable application password
-   session expiry

The backend is intended to run locally rather than as a publicly exposed
service.

------------------------------------------------------------------------

## Project structure

``` text
outreach-platform/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── contacts/
│   │   ├── database/
│   │   ├── opportunities/
│   │   ├── outreach/
│   │   │   ├── providers/
│   │   │   └── templates/
│   │   └── prisma/
│   ├── scripts/
│   ├── test/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── dashboard/
    │   │   ├── opportunities/
    │   │   └── outreach/
    │   ├── components/
    │   └── lib/
    └── package.json
```

------------------------------------------------------------------------

## Running locally

### Prerequisites

-   Node.js
-   npm
-   PostgreSQL 15+
-   A local PostgreSQL database

### 1. Clone the repository

``` bash
git clone <repository-url>
cd Mailer/outreach-platform
```

### 2. Configure the backend

``` bash
cd backend
cp .env.example .env
```

Set your local PostgreSQL connection string:

``` env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

The application also expects the authentication and email-provider
configuration used by the backend. Keep these values in `.env` and never
commit them.

For safe local development, use:

``` env
EMAIL_PROVIDER=log
```

The `log` provider allows the complete outreach lifecycle to be
exercised without sending a real email.

### 3. Install backend dependencies

``` bash
npm install
```

### 4. Start the backend

``` bash
npm run start:dev
```

### 5. Install frontend dependencies

In another terminal:

``` bash
cd ../frontend
npm install
```

### 6. Start the frontend

``` bash
npm run dev
```

------------------------------------------------------------------------

## Testing

Backend tests:

``` bash
cd backend
npm test
```

Build:

``` bash
npm run build
```

Frontend build:

``` bash
cd ../frontend
npm run build
```

The completed implementation has been verified with:

-   **19 backend tests passing**
-   backend production build passing
-   frontend production build passing
-   SMTP delivery successfully verified with a controlled test recipient

------------------------------------------------------------------------

## Screenshots

> The screenshots below should use sanitized demo data only. No real
> contact information is included in the public repository.

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Opportunity matching

![Opportunity matching](docs/screenshots/opportunity-matches.png)

### Draft and send

![Draft and send](docs/screenshots/draft-and-send.png)

### Send confirmation

![Send confirmation](docs/screenshots/send-confirmation.png)

### Outreach history

![Outreach history](docs/screenshots/outreach-history.png)

------------------------------------------------------------------------

## Design decisions

### Why persistent outreach state?

A draft that only exists in frontend memory can disappear or become
inconsistent with the actual sending process.

Persisting the outreach record gives the application a durable
representation of:

-   what was drafted
-   what was approved
-   what was sent
-   what failed
-   what remains uncertain

### Why separate outreach attempts?

An outreach can potentially have multiple provider interactions over its
lifetime.

Keeping attempts separate makes it possible to distinguish:

``` text
Outreach
├── Attempt 1
├── Attempt 2
└── Attempt 3
```

from the current logical state of the outreach itself.

### Why use a provider abstraction?

Development and real sending have very different safety requirements.

The provider abstraction allows the same application lifecycle to run
against:

``` text
LogEmailProvider
       |
       +-- safe local testing

SmtpEmailProvider
       |
       +-- controlled real delivery
```

This makes it possible to test the state machine without accidentally
sending emails.

### Why keep contact data outside Git?

The application code is shareable; the underlying personal contact
dataset is not.

Separating the two allows the project to demonstrate the engineering
implementation without exposing private contact information.

------------------------------------------------------------------------

## Current scope

WarmRoute currently focuses on the core personal outreach workflow:

-   opportunity creation
-   contact matching
-   contact selection
-   draft generation
-   persistent drafts
-   explicit approval
-   explicit send confirmation
-   SMTP delivery
-   outreach history
-   send-attempt tracking
-   authentication
-   local-first privacy

It is intentionally **not** a bulk-email platform or autonomous outreach
agent.

------------------------------------------------------------------------

## Future improvements

Potential future work includes:

-   richer opportunity management
-   more granular outreach analytics
-   improved template customization
-   additional email providers
-   stronger recovery tooling for uncertain provider states
-   additional automated end-to-end coverage
-   improved contact matching heuristics

These are intentionally separate from the current core workflow.

------------------------------------------------------------------------

## License

This project is currently a personal project and is not licensed for
redistribution.
