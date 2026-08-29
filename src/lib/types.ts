import type { ObjectId } from "mongodb";

export const USER_ROLES = ["student", "staff", "admin"] as const;
export const ITEM_STATUSES = ["lost", "found", "returned"] as const;
export const ITEM_CATEGORIES = [
  "Electronics",
  "Books & Notes",
  "Clothing",
  "Keys",
  "Cards & IDs",
  "Bags",
  "Other",
] as const;
export const CLAIM_STATUSES = ["pending", "approved", "rejected"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface UserDocument {
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemDocument {
  name: string;
  description: string;
  category: ItemCategory;
  location: string;
  occurredAt: Date;
  status: ItemStatus;
  imageUrl?: string;
  reporterId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimDocument {
  itemId: ObjectId;
  claimantId: ObjectId;
  description: string;
  status: ClaimStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type User = Omit<UserDocument, "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type Item = Omit<
  ItemDocument,
  "reporterId" | "occurredAt" | "createdAt" | "updatedAt"
> & {
  id: string;
  reporterId: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Claim = Omit<
  ClaimDocument,
  "itemId" | "claimantId" | "createdAt" | "updatedAt"
> & {
  id: string;
  itemId: string;
  claimantId: string;
  createdAt: string;
  updatedAt: string;
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
