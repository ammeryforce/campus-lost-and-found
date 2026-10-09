Findly — Campus Lost & Found
Findly is a full-stack campus lost-property system. Students and staff can report lost or found items, search existing reports, and submit ownership claims from a responsive dashboard. Administrators can manage people, reports, and claims.
The project demonstrates CRUD operations using Next.js route handlers, MongoDB, and a browser interface. New to the code? Start with [BEGINNER_GUIDE.md](BEGINNER_GUIDE.md), which explains the folders and follows a request from the form to MongoDB and back.
Features
- Mobile-friendly overview dashboard.
- Sign-in and account creation with role-based access.
- User CRUD: create, list, edit, and safely delete people.
- Item CRUD: create, search, filter, edit, update status, and soft-delete reports.
- Claim CRUD: submit, list, edit, approve or reject, and delete claims.
- Business rules that protect linked records.
- Claim approval marks the item as returned and rejects competing pending claims.
- Input validation with clear API errors.
- MongoDB indexes for unique emails and common filters.
- Automated validation tests.
- Docker Compose deployment with Caddy HTTPS and MongoDB Atlas.
Technology
- Next.js 16 with the App Router and TypeScript
- React 19
- MongoDB with the official Node.js driver
- Zod for server-side validation
- Tailwind CSS 4 and project-specific CSS
- Vitest for automated tests
- Docker Compose and Caddy for production deployment
Stage 1 — Project setup
Requirements
- Node.js 20.9 or newer
- npm
- Local MongoDB or a MongoDB Atlas cluster
Install dependencies and create your local environment file:
npm install
cp .env.example .env.local
The local example connects to MongoDB on your computer:
MONGODB_URI=mongodb://127.0.0.1:27017/campus_lost_found
MONGODB_DB=campus_lost_found
INITIAL_ADMIN_EMAIL=admin@university.edu
INITIAL_ADMIN_PASSWORD=replace-with-a-long-unique-password
For Atlas, replace MONGODB_URI with your Atlas connection string. Never commit .env.local, because it can contain passwords.
Start the application:
npm run dev
Open http://localhost:3000, visit /login, and sign in using the initial administrator credentials. The first administrator login creates the administrator record. Other campus members can select Create account to receive standard user access.
Administrators can manage all people, reports, and claims. Standard users can manage only their own reports and claims.
Basic user workflow
1. Sign in or create an account.
2. Search existing reports before adding a new one.
3. Report a lost or found item with its description, location, date, and optional image.
4. If you recognise your item, submit a claim with private ownership evidence.
5. An administrator reviews the claim and approves or rejects it.
6. Approval changes the item status to returned and rejects competing pending claims.
Stage 2 — Database connection
src/lib/mongodb.ts creates a reusable MongoDB client. src/lib/database.ts selects the collections and creates their indexes.
The local database name defaults to campus_lost_found; the production instructions below use campus-lost-and-found. Set MONGODB_DB explicitly for the environment you intend to use.
The following tables describe the main application fields, rather than a complete authentication schema.
users
Field	Type	Purpose
name	string	Person’s full name
email	string	Unique campus email
role	string	student, staff, or admin
createdAt, updatedAt	date	Audit timestamps


items
Field	Type	Purpose
name, description	string	Identifying information
category	string	Supported item category
location	string	Where the item was lost or found
occurredAt	date	Date of the event
status	string	lost, found, or returned
recordStatus	string	ACTIVE or DELETED; defaults to ACTIVE
imageUrl	string	Optional uploaded image stored as a data URL
reporterId	ObjectId	Reference to a user


claims
Field	Type	Purpose
itemId	ObjectId	Item being claimed
claimantId	ObjectId	User making the claim
description	string	Private ownership evidence
status	string	pending, approved, or rejected


Stage 3 — REST API
Responses use either { "data": ... } or { "error": "..." }.
Resource	List / create	Read / update / delete
Users	GET, POST /api/users	GET, PATCH, DELETE /api/users/:id
Items	GET, POST /api/items	GET, PATCH, DELETE /api/items/:id
Claims	GET, POST /api/claims	GET, PATCH, DELETE /api/claims/:id
Health	GET /api/health	Checks the MongoDB connection


Search and filter controls run in the browser after records load. Protected operations require an authenticated session and the appropriate permissions; use the signed-in browser interface to try them.
Stage 4 — User interface
- /login: sign-in page.
- /: totals, recent reports, and the claim queue.
- /items: search, filters, item cards, and the report form.
- /claims: claim review queue and approval controls.
- /users: campus people directory.
The item form accepts JPG, PNG, WebP, or GIF files smaller than 2 MB. The browser converts the image into a data URL, which MongoDB stores with the item. The same photo appears on the item card and its claim card.
If MongoDB is not configured, the interface shows a setup message instead of data.
Stage 5 — Testing and quality checks
Run automated tests:
npm test
Run code-quality checks:
npm run lint
npm run typecheck
npm run build
Suggested manual checks
1. Sign in as an administrator and add two users with different roles.
2. Edit a user and confirm the changes remain after refreshing.
3. Report a found item and check search and category filters.
4. Create two pending claims for that item from different users.
5. Approve one claim and verify that the item becomes returned and the competing claim becomes rejected.
6. Try deleting a user linked to an item; the API should protect the record.
7. Check that a standard user cannot edit another user’s reports or claims.
8. Test deletion in claim, item, then user order; check for any linked-record restrictions.
9. After deleting an item, refresh /items. Verify that it stays hidden and its MongoDB document has recordStatus: "DELETED".
Stage 6 — Prepare and deploy to a VM
The production setup runs the application and Caddy in two containers, with MongoDB hosted in Atlas:
Browser → Caddy (HTTPS) → Next.js on port 3000 → MongoDB Atlas
On an Azure Ubuntu VM:
1. Create a DNS A record pointing your domain to the VM’s public IP.
2. Allow inbound web traffic on TCP ports 80 and 443 in the Azure Network Security Group. Keep port 3000 and MongoDB private.
3. Allow the VM’s outbound public IP in MongoDB Atlas Network Access.
4. Install Docker Engine and the Docker Compose plugin, then clone or copy the project to the VM.
5. Create a private production environment file:
cp .env.production.example .env.production
chmod 600 .env.production
Set MONGODB_URI, MONGODB_DB=campus-lost-and-found, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, and DOMAIN in .env.production. Do not commit this file.
6. Build and start the services:
docker compose --env-file .env.production up -d --build
7. Check the containers and health endpoint, replacing the example domain with your own:
docker compose --env-file .env.production ps
curl -fsS https://your-domain.example/api/health
8. Open the domain in a browser. Caddy requests and renews the HTTPS certificate once DNS resolves and the domain is reachable.
Persistent Caddy data is kept in named volumes. MongoDB data is stored in Atlas; configure backups there. Use a unique administrator password and rotate database credentials if exposed.
Useful deployment commands
docker compose --env-file .env.production logs -f app
docker compose --env-file .env.production restart app
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d --build
Avoid docker compose down -v unless you intend to remove Compose-managed named volumes, including persistent Caddy data. Atlas data is stored separately.
Project structure
src/
  app/
    api/                 REST route handlers
    claims/              Claim page
    items/               Item page
    users/               User page
  components/            Dashboard and CRUD interface components
  lib/                   MongoDB, validation, types, and API helpers
tests/                   Automated validation tests
BEGINNER_GUIDE.md        Plain-language code walkthrough
Dockerfile               Production Next.js image
compose.yaml             Application and HTTPS reverse-proxy services
deploy/Caddyfile         HTTPS reverse-proxy and security headers
deploy/nginx.conf        Additional Nginx configuration file
Current scope and future improvements
Findly currently includes CRUD operations, sign-in, role-based access, item images, and claim review. Potential improvements before a university-wide launch include:
- Dedicated image storage instead of data URLs in MongoDB.
- Rate limiting and audit logs.
- Email notifications for claim updates.
- A documented backup and recovery process.

This project is done by the following members:
- SENG BAN NU (6622007)
- SEIN TUN TUCK (6622152)
- MIN HTET (6622085)
