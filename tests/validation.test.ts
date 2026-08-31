import { describe, expect, it } from "vitest";
import {
  createClaimSchema,
  createItemSchema,
  createUserSchema,
  updateClaimSchema,
  updateItemSchema,
  updateUserSchema,
} from "../src/lib/validation";

const objectId = "64f1c2a9b17d4d6f4a8b1234";

describe("user validation", () => {
  it("normalizes a valid user", () => {
    const result = createUserSchema.parse({
      name: "  Maya Chen  ",
      email: "MAYA@UNIVERSITY.EDU",
      role: "student",
    });

    expect(result).toEqual({
      name: "Maya Chen",
      email: "maya@university.edu",
      role: "student",
    });
  });

  it("rejects an invalid email and an empty update", () => {
    expect(() => createUserSchema.parse({ name: "Maya", email: "wrong", role: "student" })).toThrow();
    expect(() => updateUserSchema.parse({})).toThrow();
  });
});

describe("item validation", () => {
  const item = {
    name: "Black umbrella",
    description: "Small silver initials are written inside the handle.",
    category: "Other",
    location: "Science Hall",
    occurredAt: "2026-08-20",
    status: "found",
    reporterId: objectId,
    imageUrl: "",
  };

  it("accepts a complete item and removes an empty image URL", () => {
    expect(createItemSchema.parse(item)).toMatchObject({ name: "Black umbrella", imageUrl: undefined });
  });

  it("accepts an uploaded image and rejects a normal text URL", () => {
    const uploadedImage = "data:image/png;base64,AA==";

    expect(createItemSchema.parse({ ...item, imageUrl: uploadedImage }).imageUrl)
      .toBe(uploadedImage);
    expect(() => createItemSchema.parse({ ...item, imageUrl: "https://example.com/photo.jpg" }))
      .toThrow();
  });

  it("rejects a short description and invalid update status", () => {
    expect(() => createItemSchema.parse({ ...item, description: "black" })).toThrow();
    expect(() => updateItemSchema.parse({ status: "in storage" })).toThrow();
  });
});

describe("claim validation", () => {
  it("accepts ownership evidence with valid references", () => {
    expect(createClaimSchema.parse({ itemId: objectId, claimantId: objectId, description: "The lock screen shows a white dog." })).toBeTruthy();
  });

  it("only permits known claim statuses", () => {
    expect(updateClaimSchema.parse({ status: "approved" })).toEqual({ status: "approved" });
    expect(() => updateClaimSchema.parse({ status: "maybe" })).toThrow();
  });
});
