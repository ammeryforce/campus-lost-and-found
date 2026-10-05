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

Set the first administrator account in `.env.local` before starting the app:

```env
INITIAL_ADMIN_EMAIL=admin@university.edu
INITIAL_ADMIN_PASSWORD=use-a-long-unique-password
```

Visit `/login` and sign in with those credentials. The first login creates the administrator record. Other campus members can use **Create account**; they receive the standard user role. Administrators can manage all people, reports, and claims, while standard users can manage only their own reports and claims.

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
| `imageUrl` | string | Optional uploaded image stored as a data URL |
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

The item form accepts a JPG, PNG, WebP, or GIF file smaller than 2 MB. The browser converts the file to a data URL, MongoDB saves it with the item, and the same photo appears on both the item card and its claim card.

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

The production Docker Compose setup runs two containers:

```text
Browser → Caddy (HTTPS) → Next.js on port 3000 → MongoDB Atlas
```

On an Azure Ubuntu VM:

1. Create a DNS **A** record such as `lostfound.example.edu` pointing to the VM public IP.
2. In the Azure Network Security Group, allow inbound TCP ports **80** and **443** only. Do not expose port 3000 or MongoDB.
3. In MongoDB Atlas Network Access, allow the VM's outbound public IP address.
4. Install Docker Engine and the Docker Compose plugin, then copy or clone this project onto the VM.
5. Create the production environment file without committing it:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Set `MONGODB_URI`, `MONGODB_DB=campus-lost-and-found`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and `DOMAIN` in `.env.production`.

6. From the project directory, build and start it:

```bash
docker compose --env-file .env.production up -d --build
```

7. Check the containers and application health:

```bash
docker compose --env-file .env.production ps
curl -fsS https://your-domain.example/api/health
```

8. Visit the domain in a browser. Caddy requests and renews the HTTPS certificate automatically once the DNS record resolves to the VM.

TLS certificates and Caddy configuration are kept in named volumes, so normal container recreation does not erase them. MongoDB data is stored in Atlas; enable Atlas backups there.

The production setup uses Caddy for HTTPS and includes application authentication. Keep `.env.production` private, use a unique admin password, and rotate database credentials if they are ever exposed.

Useful deployment commands:

```bash
docker compose --env-file .env.production logs -f app
docker compose --env-file .env.production restart app
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d --build
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
compose.yaml             App and HTTPS reverse-proxy services
deploy/Caddyfile         HTTPS reverse-proxy and security headers
```

## Current scope and sensible next additions

This version intentionally focuses on the requested CRUD system. Before a university-wide launch, the next additions should be sign-in, role-based authorization, controlled image uploads, rate limiting, audit logs, email notifications, and automatic database backups.
