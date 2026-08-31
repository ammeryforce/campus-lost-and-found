# Findly — Campus Lost & Found

Findly is a full-stack campus lost-property system. Students and staff can be registered, lost or found items can be reported and searched, and ownership claims can be reviewed from one responsive dashboard.

The project demonstrates complete CRUD operations with Next.js route handlers, MongoDB, and a browser UI.

If you are learning the code, start with [BEGINNER_GUIDE.md](BEGINNER_GUIDE.md). It explains the folders and follows one user request from the form to MongoDB and back.

## What is included

- A polished, mobile-friendly overview dashboard.
- User CRUD: create, list, edit, and safely delete people.
- Item CRUD: create, search, filter, edit, update status, and delete reports.
- Claim CRUD: submit, list, edit, approve or reject, and delete claims.
- Business rules that protect linked records.
- Claim approval automatically marks the item as returned and rejects competing pending claims.
- Input validation with clear API errors.
- MongoDB indexes for unique emails and common filters.
- Automated validation tests.
- Docker, MongoDB, and Nginx files for deployment to a Linux VM.

## Technology

- Next.js 16 with the App Router and TypeScript
- React 19
- MongoDB with the official Node.js driver
- Zod for server-side validation
- Tailwind CSS 4 plus project-specific CSS
- Vitest for automated tests

## Stage 1 — Project setup

### Requirements

- Node.js 20.9 or newer
- npm
- A MongoDB database, either local MongoDB or a free MongoDB Atlas cluster

Install the project packages:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

The default example connects to MongoDB on your own computer:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/campus_lost_found
MONGODB_DB=campus_lost_found
```

For MongoDB Atlas, replace `MONGODB_URI` with the connection string shown in Atlas. Never commit `.env.local`; it can contain a database password.

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add a person first, then add an item report, and finally create a claim.

## Stage 2 — Database connection

The shared connection is in `src/lib/mongodb.ts`. It creates one reusable MongoDB client instead of opening a new connection for every request. `src/lib/database.ts` selects the three collections and creates their indexes.

The database name defaults to `campus_lost_found`. It contains:

### `users`

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | string | Person’s full name |
| `email` | string | Unique campus email |
| `role` | string | `student`, `staff`, or `admin` |
| `createdAt`, `updatedAt` | date | Audit timestamps |

### `items`

| Field | Type | Purpose |
| --- | --- | --- |
| `name`, `description` | string | Identifying information |
| `category` | string | One of the supported categories |
| `location` | string | Where it was lost or found |
| `occurredAt` | date | Date of the event |
| `status` | string | `lost`, `found`, or `returned` |
| `recordStatus` | string | Soft-delete state: `ACTIVE` or `DELETED` (defaults to `ACTIVE`) |
| `imageUrl` | string | Optional external image URL |
| `reporterId` | ObjectId | Reference to a user |

### `claims`

| Field | Type | Purpose |
| --- | --- | --- |
| `itemId` | ObjectId | Item being claimed |
| `claimantId` | ObjectId | User making the claim |
| `description` | string | Private ownership evidence |
| `status` | string | `pending`, `approved`, or `rejected` |

## Stage 3 — REST API

All responses use either `{ "data": ... }` or `{ "error": "..." }`.

| Resource | List / create | Read / update / delete |
| --- | --- | --- |
| Users | `GET, POST /api/users` | `GET, PATCH, DELETE /api/users/:id` |
| Items | `GET, POST /api/items` | `GET, PATCH, DELETE /api/items/:id` |
| Claims | `GET, POST /api/claims` | `GET, PATCH, DELETE /api/claims/:id` |
| Health | `GET /api/health` | Checks the MongoDB connection |

Search and filter controls are handled in the browser after the records load. This keeps the first version of the API easy to read.

Example — create a user:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Maya Chen","email":"maya@university.edu","role":"student"}'
```

## Stage 4 — User interface

- `/` shows totals, recent reports, and the claim queue.
- `/items` contains item search, filters, cards, and the report form.
- `/claims` contains the review queue and approval controls.
- `/users` contains the campus people directory.

The interface will still open when MongoDB is not configured, but it shows a setup message instead of data.

## Stage 5 — Testing and quality checks

Run the automated tests:

```bash
npm test
```

Run all code-quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

Suggested manual test order:

1. Add two users with different roles.
2. Edit one user and confirm the changes remain after a refresh.
3. Report a found item and verify search and category filters.
4. Create a claim from the item card.
5. Approve the claim and verify the item changes to `returned`.
6. Try deleting a user linked to an item; the API should protect the record.
7. Delete the claim, item, and user in that order.
8. After deleting an item, refresh `/items` and confirm it remains hidden while its MongoDB document has `recordStatus: "DELETED"`.

## Stage 6 — Prepare and deploy to a VM

The included Docker Compose setup runs three containers:

```text
Browser → Nginx on port 80 → Next.js on port 3000 → MongoDB
```

On an Ubuntu VM:

1. Install Docker Engine and the Docker Compose plugin.
2. Copy or clone this project onto the VM.
3. From the project directory, build and start it:

```bash
docker compose up -d --build
```

4. Check the containers and application health:

```bash
docker compose ps
curl http://localhost/api/health
```

5. Visit the VM’s public IP address in a browser.

MongoDB data is kept in the named `mongo_data` volume, so normal container recreation does not erase the records. Back up that volume before server migrations or destructive maintenance.

For a public production deployment, point a domain at the VM and add HTTPS (for example, with Certbot or a TLS-enabled reverse proxy). Add authentication and authorization before allowing untrusted public users to access the admin CRUD screens.

Useful deployment commands:

```bash
docker compose logs -f app
docker compose restart app
docker compose pull
docker compose up -d --build
```

Do not run `docker compose down -v` unless you intentionally want to delete the MongoDB volume.

## Project structure

```text
src/
  app/
    api/                 REST route handlers
    claims/              Claim page
    items/               Item page
    users/               User page
  components/            Dashboard and CRUD interface components
  lib/                   MongoDB, validation, types, and API helpers
tests/                   Automated validation tests
BEGINNER_GUIDE.md        Plain-language walkthrough of the code
deploy/nginx.conf        VM reverse-proxy configuration
Dockerfile               Production Next.js image
compose.yaml             App, MongoDB, and Nginx services
```

## Current scope and sensible next additions

This version intentionally focuses on the requested CRUD system. Before a university-wide launch, the next additions should be sign-in, role-based authorization, controlled image uploads, rate limiting, audit logs, email notifications, and automatic database backups.
