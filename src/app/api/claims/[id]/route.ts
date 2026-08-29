import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  readJson,
  serializeClaim,
} from "@/lib/api";
import { updateClaimSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Claim not found.", 404);

    const { claims } = await getCollections();
    const claim = await claims.findOne({ _id: objectId });
    return claim ? jsonData(serializeClaim(claim)) : jsonError("Claim not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Claim not found.", 404);

    const input = await readJson(request, updateClaimSchema);
    const { items, claims } = await getCollections();
    const existing = await claims.findOne({ _id: objectId });
    if (!existing) return jsonError("Claim not found.", 404);

    if (input.status === "approved") {
      await Promise.all([
        items.updateOne(
          { _id: existing.itemId },
          { $set: { status: "returned", updatedAt: new Date() } },
        ),
        claims.updateMany(
          { itemId: existing.itemId, _id: { $ne: objectId }, status: "pending" },
          { $set: { status: "rejected", updatedAt: new Date() } },
        ),
      ]);
    }

    const claim = await claims.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    return claim ? jsonData(serializeClaim(claim)) : jsonError("Claim not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export const PUT = PATCH;

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Claim not found.", 404);

    const { claims } = await getCollections();
    const result = await claims.deleteOne({ _id: objectId });
    return result.deletedCount
      ? jsonData({ id, deleted: true })
      : jsonError("Claim not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
