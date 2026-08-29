import type { Collection } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { ClaimDocument, ItemDocument, UserDocument } from "@/lib/types";

interface Collections {
  users: Collection<UserDocument>;
  items: Collection<ItemDocument>;
  claims: Collection<ClaimDocument>;
}

let indexesPromise: Promise<void> | undefined;

async function createIndexes(collections: Collections) {
  await Promise.all([
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.items.createIndex({ status: 1, category: 1, occurredAt: -1 }),
    collections.items.createIndex({ reporterId: 1 }),
    collections.claims.createIndex({ itemId: 1, claimantId: 1 }),
    collections.claims.createIndex({ status: 1, createdAt: -1 }),
  ]);
}

export async function getCollections(): Promise<Collections> {
  const database = await getDatabase();
  const collections: Collections = {
    users: database.collection<UserDocument>("users"),
    items: database.collection<ItemDocument>("items"),
    claims: database.collection<ClaimDocument>("claims"),
  };

  indexesPromise ??= createIndexes(collections).catch((error) => {
    indexesPromise = undefined;
    throw error;
  });
  await indexesPromise;

  return collections;
}
