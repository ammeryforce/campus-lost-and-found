import type { Filter } from "mongodb";
import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  readJson,
  serializeClaim,
} from "@/lib/api";
import { CLAIM_STATUSES, type ClaimDocument } from "@/lib/types";
import { createClaimSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const itemId = url.searchParams.get("itemId");
    const claimantId = url.searchParams.get("claimantId");
    const filter: Filter<ClaimDocument> = {};

    if (status && CLAIM_STATUSES.includes(status as (typeof CLAIM_STATUSES)[number])) {
      filter.status = status as ClaimDocument["status"];
    }
    if (itemId) {
      const parsed = parseId(itemId);
      if (!parsed) return jsonError("Invalid item filter.", 400);
      filter.itemId = parsed;
    }
    if (claimantId) {
      const parsed = parseId(claimantId);
      if (!parsed) return jsonError("Invalid claimant filter.", 400);
      filter.claimantId = parsed;
    }

    const { claims } = await getCollections();
    const documents = await claims.find(filter).sort({ createdAt: -1 }).limit(200).toArray();
    return jsonData(documents.map(serializeClaim));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await readJson(request, createClaimSchema);
    const itemId = parseId(input.itemId);
    const claimantId = parseId(input.claimantId);
    if (!itemId || !claimantId) return jsonError("Item or claimant not found.", 404);

    const { users, items, claims } = await getCollections();
    const [item, claimant] = await Promise.all([
      items.findOne({ _id: itemId }),
      users.findOne({ _id: claimantId }, { projection: { _id: 1 } }),
    ]);
    if (!item || !claimant) return jsonError("Item or claimant not found.", 404);
    if (item.status === "returned") {
      return jsonError("This item has already been returned.", 409);
    }

    const existing = await claims.findOne({ itemId, claimantId, status: "pending" });
    if (existing) return jsonError("This user already has a pending claim for the item.", 409);

    const now = new Date();
    const document = {
      itemId,
      claimantId,
      description: input.description,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    };
    const result = await claims.insertOne(document);

    return jsonData(serializeClaim({ ...document, _id: result.insertedId }), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
