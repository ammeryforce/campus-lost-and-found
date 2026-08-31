import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  claimFindOne: vi.fn(),
  itemFind: vi.fn(),
  itemFindOneAndUpdate: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  getCollections: vi.fn(async () => ({
    claims: { findOne: database.claimFindOne },
    items: {
      find: database.itemFind,
      findOneAndUpdate: database.itemFindOneAndUpdate,
    },
  })),
}));

import { DELETE } from "../src/app/api/items/[id]/route";
import { GET } from "../src/app/api/items/route";

describe("item soft-delete routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists active and legacy items but excludes deleted records", async () => {
    const legacyId = new ObjectId();
    const reporterId = new ObjectId();
    const timestamp = new Date("2026-08-20T00:00:00.000Z");
    const toArray = vi.fn(async () => [{
      _id: legacyId,
      name: "Black umbrella",
      description: "Small silver initials are written inside the handle.",
      category: "Other",
      location: "Science Hall",
      occurredAt: timestamp,
      status: "found",
      reporterId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }]);
    const limit = vi.fn(() => ({ toArray }));
    const sort = vi.fn(() => ({ limit }));
    database.itemFind.mockReturnValue({ sort });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(database.itemFind).toHaveBeenCalledWith({
      recordStatus: { $ne: "DELETED" },
    });
    await expect(response.json()).resolves.toMatchObject({
      data: [{ id: legacyId.toHexString(), recordStatus: "ACTIVE" }],
    });
  });

  it("updates recordStatus instead of removing the MongoDB document", async () => {
    const id = new ObjectId().toHexString();
    database.claimFindOne.mockResolvedValue(null);
    database.itemFindOneAndUpdate.mockResolvedValue({ _id: new ObjectId(id) });

    const response = await DELETE(new Request(`http://localhost/api/items/${id}`), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(200);
    expect(database.itemFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: new ObjectId(id), recordStatus: { $ne: "DELETED" } },
      { $set: { recordStatus: "DELETED", updatedAt: expect.any(Date) } },
      { returnDocument: "after" },
    );
    await expect(response.json()).resolves.toEqual({ data: { id, deleted: true } });
  });
});
