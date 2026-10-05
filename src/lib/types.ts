import type { ObjectId } from "mongodb";

export const USER_ROLES = ["student", "staff", "admin"] as const;
export const ITEM_STATUSES = ["lost", "found", "returned"] as const;
export const ITEM_RECORD_STATUSES = ["ACTIVE", "DELETED"] as const;
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
export type ItemRecordStatus = (typeof ITEM_RECORD_STATUSES)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface UserDocument {
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument {
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ItemDocument {
  name: string;
  description: string;
  category: ItemCategory;
  location: string;
  occurredAt: Date;
  status: ItemStatus;
  /** Missing on records created before soft deletion was introduced. */
  recordStatus?: ItemRecordStatus;
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

// These three interfaces describe the JSON sent to the browser.
// MongoDB ObjectIds and Dates are changed to strings before they are returned.
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  location: string;
  status: ItemStatus;
  recordStatus: ItemRecordStatus;
  imageUrl?: string;
  reporterId: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
