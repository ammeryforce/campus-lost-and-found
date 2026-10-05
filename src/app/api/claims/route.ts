import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  serializeClaim,
} from "@/lib/api";
import { ACTIVE_ITEM_FILTER } from "@/lib/items";
import { createClaimSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const { claims } = await getCollections();
    const documents = await claims
      .find(currentUser.role === "admin" ? {} : { claimantId: parseId(currentUser.id)! })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return jsonData(documents.map(serializeClaim));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireUser();
    const body = await request.json();
    const input = createClaimSchema.parse(body);
    const itemId = parseId(input.itemId);
    const claimantId = currentUser.role === "admin" ? parseId(input.claimantId) : parseId(currentUser.id);
    if (!itemId || !claimantId) return jsonError("Item or claimant not found.", 404);

    const { users, items, claims } = await getCollections();
    const [item, claimant] = await Promise.all([
      items.findOne({ _id: itemId, ...ACTIVE_ITEM_FILTER }),
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
