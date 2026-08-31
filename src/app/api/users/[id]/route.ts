import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  serializeUser,
} from "@/lib/api";
import { ACTIVE_ITEM_FILTER } from "@/lib/items";
import { updateUserSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("User not found.", 404);

    const { users } = await getCollections();
    const user = await users.findOne({ _id: objectId });
    return user ? jsonData(serializeUser(user)) : jsonError("User not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("User not found.", 404);

    const body = await request.json();
    const input = updateUserSchema.parse(body);
    const { users } = await getCollections();
    const user = await users.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    return user ? jsonData(serializeUser(user)) : jsonError("User not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const objectId = parseId(id);
    if (!objectId) return jsonError("User not found.", 404);

    const { users, items, claims } = await getCollections();
    const [reportedItem, claim] = await Promise.all([
      items.findOne(
        { reporterId: objectId, ...ACTIVE_ITEM_FILTER },
        { projection: { _id: 1 } },
      ),
      claims.findOne({ claimantId: objectId }, { projection: { _id: 1 } }),
    ]);

    if (reportedItem || claim) {
      return jsonError(
        "This user is linked to an item or claim. Delete those records first.",
        409,
      );
    }

    const result = await users.deleteOne({ _id: objectId });
    return result.deletedCount
      ? jsonData({ id, deleted: true })
      : jsonError("User not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
