import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/database";
import type { User, UserDocument } from "@/lib/types";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "findly_session";
const SESSION_DAYS = 7;

export type AuthUser = Pick<User, "id" | "name" | "email" | "role">;

function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored?: string) {
  if (!stored) return false;
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
}

function toAuthUser(user: UserDocument & { _id: ObjectId }): AuthUser {
  return { id: user._id.toHexString(), name: user.name, email: user.email, role: user.role };
}

export async function ensureInitialAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) return;
  const { users } = await getCollections();
  const existing = await users.findOne({ email });
  if (existing) return;
  const now = new Date();
  await users.insertOne({ name: "Campus Administrator", email, role: "admin", passwordHash: await hashPassword(password), createdAt: now, updatedAt: now });
}

export async function createSession(user: UserDocument & { _id: ObjectId }) {
  const { sessions } = await getCollections();
  const token = randomBytes(32).toString("base64url");
  const result = await sessions.insertOne({ userId: user._id, tokenHash: hashToken(token), createdAt: new Date(), expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000) });
  const store = await cookies();
  store.set(SESSION_COOKIE, `${result.insertedId.toHexString()}.${token}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400 });
  return toAuthUser(user);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  const [sessionId, token] = value?.split(".") ?? [];
  if (!sessionId || !token || !ObjectId.isValid(sessionId)) return null;
  const { sessions, users } = await getCollections();
  const session = await sessions.findOne({ _id: new ObjectId(sessionId), tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await users.findOne({ _id: session.userId });
  return user ? toAuthUser(user) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Please log in to continue.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError(403, "Administrator access is required.");
  return user;
}

export async function destroySession() {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  const [sessionId] = value?.split(".") ?? [];
  if (sessionId && ObjectId.isValid(sessionId)) {
    const { sessions } = await getCollections();
    await sessions.deleteOne({ _id: new ObjectId(sessionId) });
  }
  store.delete(SESSION_COOKIE);
}

export class AuthError extends Error { constructor(public status: number, message: string) { super(message); } }
