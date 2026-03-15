import { Db, MongoClient } from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | null = null;
let db: Db | null = null;
let connectPromise: Promise<Db> | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 20
    });

    await client.connect();
    db = client.db(env.MONGODB_DB_NAME);

    await Promise.all([
      db.collection("analysis_reports").createIndex({ requestId: 1 }, { unique: true }),
      db.collection("analysis_feedback").createIndex({ requestId: 1 }),
      db.collection("analysis_chats").createIndex({ requestId: 1, userId: 1 }, { unique: true }),
      db.collection("document_vectors").createIndex({ "metadata.requestId": 1 }),
      db.collection("user_accounts").createIndex({ email: 1 }, { unique: true })
    ]);

    return db;
  })();

  return connectPromise;
}

export async function getMongoDb(): Promise<Db> {
  return connectMongo();
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
  }
  client = null;
  db = null;
  connectPromise = null;
}
