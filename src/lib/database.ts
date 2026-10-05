import { getDatabase } from "@/lib/mongodb";
import type { ClaimDocument, ItemDocument, SessionDocument, UserDocument } from "@/lib/types";

let indexesPromise: Promise<void> | undefined;

export async function getCollections() {
  const database = await getDatabase();
  const users = database.collection<UserDocument>("users");
  const items = database.collection<ItemDocument>("items");
  const claims = database.collection<ClaimDocument>("claims");
  const sessions = database.collection<SessionDocument>("sessions");

  // The unique index prevents two users from sharing one email address.
  // This promise is reused so the index is not created on every API request.
  indexesPromise ??= users.createIndex({ email: 1 }, { unique: true }).then(() => undefined);
  await indexesPromise;

  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return { users, items, claims, sessions };
}
