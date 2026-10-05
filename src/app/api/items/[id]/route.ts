import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  serializeItem,
} from "@/lib/api";
import { ACTIVE_ITEM_FILTER } from "@/lib/items";
import { updateItemSchema } from "@/lib/validation";
import { requireUser, AuthError } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireUser();
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Item not found.", 404);

    const { items } = await getCollections();
    const item = await items.findOne({ _id: objectId, ...ACTIVE_ITEM_FILTER });
    return item ? jsonData(serializeItem(item)) : jsonError("Item not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const currentUser = await requireUser();
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Item not found.", 404);

    const body = await request.json();
    const input = updateItemSchema.parse(body);
    const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };
    if (input.occurredAt) updates.occurredAt = new Date(input.occurredAt);

    const { users, items } = await getCollections();
    const existing = await items.findOne({ _id: objectId, ...ACTIVE_ITEM_FILTER });
    if (!existing) return jsonError("Item not found.", 404);
    if (currentUser.role !== "admin" && existing.reporterId.toHexString() !== currentUser.id) throw new AuthError(403, "You can only edit your own reports.");
    if (currentUser.role !== "admin" && ((input.status && input.status !== existing.status) || (input.reporterId && input.reporterId !== currentUser.id))) throw new AuthError(403, "Only an administrator can change a report's status or reporter.");
    if (input.reporterId) {
      const reporterId = parseId(input.reporterId);
      if (!reporterId) return jsonError("Reporter not found.", 404);
      const reporter = await users.findOne({ _id: reporterId }, { projection: { _id: 1 } });
      if (!reporter) return jsonError("Reporter not found.", 404);
      updates.reporterId = reporterId;
    }

    const item = await items.findOneAndUpdate(
      { _id: objectId, ...ACTIVE_ITEM_FILTER },
      { $set: updates },
      { returnDocument: "after" },
    );

    return item ? jsonData(serializeItem(item)) : jsonError("Item not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const currentUser = await requireUser();
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("Item not found.", 404);

    const { items, claims } = await getCollections();
    const existing = await items.findOne({ _id: objectId, ...ACTIVE_ITEM_FILTER });
    if (!existing) return jsonError("Item not found.", 404);
    if (currentUser.role !== "admin" && existing.reporterId.toHexString() !== currentUser.id) throw new AuthError(403, "You can only delete your own reports.");
    const claim = await claims.findOne({ itemId: objectId }, { projection: { _id: 1 } });
    if (claim) {
      return jsonError("This item has claims. Delete those claims first.", 409);
    }

    const item = await items.findOneAndUpdate(
      { _id: objectId, ...ACTIVE_ITEM_FILTER },
      { $set: { recordStatus: "DELETED", updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    return item ? jsonData({ id, deleted: true }) : jsonError("Item not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
