import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  serializeClaim,
} from "@/lib/api";
import { ACTIVE_ITEM_FILTER } from "@/lib/items";
import { updateClaimSchema } from "@/lib/validation";
import { requireUser, AuthError } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const currentUser = await requireUser();
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Claim not found.", 404);

    const { claims } = await getCollections();
    const claim = await claims.findOne({ _id: objectId });
    if (claim && currentUser.role !== "admin" && claim.claimantId.toHexString() !== currentUser.id) throw new AuthError(403, "You can only view your own claims.");
    return claim ? jsonData(serializeClaim(claim)) : jsonError("Claim not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const currentUser = await requireUser();
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Claim not found.", 404);

    const body = await request.json();
    const input = updateClaimSchema.parse(body);
    const { items, claims } = await getCollections();
    const existing = await claims.findOne({ _id: objectId });
    if (!existing) return jsonError("Claim not found.", 404);
    if (currentUser.role !== "admin" && existing.claimantId.toHexString() !== currentUser.id) throw new AuthError(403, "You can only edit your own claims.");
    if (currentUser.role !== "admin" && input.status) throw new AuthError(403, "Only an administrator can review claims.");

    if (input.status === "approved") {
      await Promise.all([
        items.updateOne(
          { _id: existing.itemId, ...ACTIVE_ITEM_FILTER },
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

export async function DELETE(_request: Request, context: Context) {
  try {
    const currentUser = await requireUser();
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Claim not found.", 404);

    const { claims } = await getCollections();
    const existing = await claims.findOne({ _id: objectId });
    if (!existing) return jsonError("Claim not found.", 404);
    if (currentUser.role !== "admin" && existing.claimantId.toHexString() !== currentUser.id) throw new AuthError(403, "You can only delete your own claims.");
    const result = await claims.deleteOne({ _id: objectId });
    return result.deletedCount
      ? jsonData({ id, deleted: true })
      : jsonError("Claim not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
