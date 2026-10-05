import { z } from "zod";
import {
  CLAIM_STATUSES,
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  USER_ROLES,
} from "@/lib/types";

const uploadedImage = z
  .string()
  .max(2_800_000, "The image is too large")
  .regex(
    /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/,
    "Upload a JPG, PNG, WebP, or GIF image",
  );

const optionalImage = z
  .union([uploadedImage, z.literal("")])
  .optional()
  .transform((value) => value || undefined);

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Choose a valid record");

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Enter a valid date",
});

const userFields = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  role: z.enum(USER_ROLES),
});

const itemFields = z.object({
  name: z.string().trim().min(2, "Item name must be at least 2 characters").max(100),
  description: z.string().trim().min(10, "Add at least 10 characters of detail").max(1000),
  category: z.enum(ITEM_CATEGORIES),
  location: z.string().trim().min(2, "Location is required").max(120),
  occurredAt: dateString,
  status: z.enum(ITEM_STATUSES),
  imageUrl: optionalImage,
  reporterId: objectId,
});

const claimFields = z.object({
  itemId: objectId,
  claimantId: objectId,
  description: z
    .string()
    .trim()
    .min(10, "Explain how you can identify the item")
    .max(1000),
});

export const createUserSchema = userFields;
export const updateUserSchema = userFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const createItemSchema = itemFields;
export const updateItemSchema = itemFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const createClaimSchema = claimFields;
export const updateClaimSchema = z
  .object({
    description: claimFields.shape.description.optional(),
    status: z.enum(CLAIM_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});
