import { MongoServerError, ObjectId, type WithId } from "mongodb";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import type {
  ApiResponse,
  Claim,
  ClaimDocument,
  Item,
  ItemDocument,
  User,
  UserDocument,
} from "@/lib/types";

export function parseId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status });
}

export function jsonError(error: string, status: number) {
  return NextResponse.json<ApiResponse<never>>({ error }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) return jsonError(error.message, error.status);
  if (error instanceof ZodError) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: "Please check the highlighted information.",
        details: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (error instanceof SyntaxError) {
    return jsonError(error.message, 400);
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    return jsonError("That email address is already registered.", 409);
  }

  console.error(error);
  return jsonError(
    error instanceof Error && error.message.startsWith("MONGODB_URI")
      ? error.message
      : "The server could not complete this request.",
    500,
  );
}

export function serializeUser(document: WithId<UserDocument>): User {
  return {
    id: document._id.toHexString(),
    name: document.name,
    email: document.email,
    role: document.role,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function serializeItem(document: WithId<ItemDocument>): Item {
  return {
    id: document._id.toHexString(),
    name: document.name,
    description: document.description,
    category: document.category,
    location: document.location,
    occurredAt: document.occurredAt.toISOString(),
    status: document.status,
    recordStatus: document.recordStatus ?? "ACTIVE",
    imageUrl: document.imageUrl,
    reporterId: document.reporterId.toHexString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function serializeClaim(document: WithId<ClaimDocument>): Claim {
  return {
    id: document._id.toHexString(),
    itemId: document.itemId.toHexString(),
    claimantId: document.claimantId.toHexString(),
    description: document.description,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
