import { Db, MongoClient } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

let productionClientPromise: Promise<MongoClient> | undefined;

function connectClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env.local and add your MongoDB connection string.",
    );
  }

  return new MongoClient(uri, {
    appName: "campus-lost-and-found",
    serverSelectionTimeoutMS: 5000,
  }).connect();
}

export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    global.mongoClientPromise ??= connectClient();
    return global.mongoClientPromise;
  }

  productionClientPromise ??= connectClient();
  return productionClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "campus_lost_found");
}
