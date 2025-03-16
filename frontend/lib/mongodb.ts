import mongoose, { Connection } from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
  throw new Error("Mongo URI is not defined");
}

interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// Ensure `globalThis` has the correct type
declare global {
  export interface Global {
    mongoose: MongooseCache | undefined;
  }
}

const cached: MongooseCache = (
  global as typeof global & { mongoose?: MongooseCache }
).mongoose ?? { conn: null, promise: null };

export async function connectToDb(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 5,
    };
    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((conn) => conn.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  (global as typeof global & { mongoose?: MongooseCache }).mongoose = cached; // Store back in global scope

  return cached.conn;
}
