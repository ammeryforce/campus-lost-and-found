import { getDatabase } from "@/lib/mongodb";
import type { ClaimDocument, ItemDocument, UserDocument } from "@/lib/types";

let indexesPromise: Promise<void> | undefined;

export async function getCollections() {
  const database = await getDatabase();
  const users = database.collection<UserDocument>("users");
  const items = database.collection<ItemDocument>("items");
  const claims = database.collection<ClaimDocument>("claims");

  // The unique index prevents two users from sharing one email address.
  // This promise is reused so the index is not created on every API request.
  indexesPromise ??= users.createIndex({ email: 1 }, { unique: true }).then(() => undefined);
  await indexesPromise;

  return { users, items, claims };
}
