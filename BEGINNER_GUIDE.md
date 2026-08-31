# Beginner Guide

This guide explains the project in the order that data moves through it. Read these files in the same order.

## 1. The four pages

Next.js creates a page from every `page.tsx` file:

- `src/app/page.tsx` shows the dashboard.
- `src/app/users/page.tsx` shows user management.
- `src/app/items/page.tsx` shows item reports.
- `src/app/claims/page.tsx` shows claims.

Each page imports one component from `src/components`. The component contains the visible form, buttons, and list.

## 2. How a page loads data

Look at `src/components/user-manager.tsx` first.

The important state is:

```ts
const [users, setUsers] = useState<User[]>([]);
```

`users` contains the current list. `setUsers` replaces that list after the API returns data.

When the page opens, `useEffect` calls `loadUsers`. That function sends this request:

```text
GET /api/users
```

The response is stored with `setUsers(data)`, and React displays it with `users.map(...)`.

## 3. How create and update work

When a form is submitted, the component runs `saveUser`.

1. `event.preventDefault()` stops the browser from refreshing.
2. `new FormData(event.currentTarget)` reads the form inputs.
3. A new user uses `POST /api/users`.
4. An existing user uses `PATCH /api/users/:id`.
5. The list loads again so the screen shows the saved data.

Items and claims follow the same pattern in their own manager components.

## 4. How delete works

The delete button first asks for confirmation. It then sends:

```text
DELETE /api/users/:id
```

Users and claims are removed from MongoDB. Items use soft delete: the item remains in MongoDB, but `recordStatus` changes from `ACTIVE` to `DELETED`. Normal item lists hide deleted records.

## 5. The REST API files

The API is inside `src/app/api`:

```text
api/users/route.ts          GET all users, POST a new user
api/users/[id]/route.ts     GET, PATCH, or DELETE one user
api/items/route.ts          GET all active items, POST a new item
api/items/[id]/route.ts     GET, PATCH, or DELETE one item
api/claims/route.ts         GET all claims, POST a new claim
api/claims/[id]/route.ts    GET, PATCH, or DELETE one claim
```

Every create or update route follows four visible steps:

```ts
const body = await request.json();       // 1. Read the request
const input = schema.parse(body);         // 2. Validate the fields
const { users } = await getCollections(); // 3. Open the collection
// Insert or update the MongoDB document    4. Return JSON
```

## 6. MongoDB files

- `src/lib/mongodb.ts` connects to MongoDB using `MONGODB_URI` from `.env.local`.
- `src/lib/database.ts` returns the `users`, `items`, and `claims` collections.
- `src/lib/types.ts` lists the fields stored in each document.
- `src/lib/validation.ts` checks form values before they reach MongoDB.

The `.env.local` file is private and is not uploaded to GitHub.

## 7. A complete example

When a user adds a person:

```text
User form
   ↓ POST /api/users
API validates name, email, and role
   ↓
MongoDB inserts the document
   ↓
API returns the new user as JSON
   ↓
The page reloads the user list
```

This same flow is reused for items and claims.

## 8. Commands to know

```bash
npm run dev       # start the local website
npm test          # run automated tests
npm run lint      # check code style and common mistakes
npm run typecheck # check TypeScript
npm run build     # create a production build
```

## 9. Practice before presenting

You should be able to explain these questions:

1. What does `useState` store?
2. Why does the page call `fetch` through `apiRequest`?
3. What is the difference between `POST`, `PATCH`, and `DELETE`?
4. Why is `.env.local` ignored by Git?
5. How are MongoDB ObjectIds changed before they are sent to the browser?
6. Why does item deletion use `recordStatus: "DELETED"`?

If any answer is unclear, open the file named in the section above and follow the same request step by step.
