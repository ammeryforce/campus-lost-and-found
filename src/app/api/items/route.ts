import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  serializeItem,
} from "@/lib/api";
import { ACTIVE_ITEM_FILTER } from "@/lib/items";
import { createItemSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { items } = await getCollections();
    const documents = await items
      .find(ACTIVE_ITEM_FILTER)
      .sort({ occurredAt: -1 })
      .limit(200)
      .toArray();

    return jsonData(documents.map(serializeItem));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createItemSchema.parse(body);
    const reporterId = parseId(input.reporterId);
    if (!reporterId) return jsonError("Reporter not found.", 404);

    const { users, items } = await getCollections();
    const reporter = await users.findOne({ _id: reporterId }, { projection: { _id: 1 } });
    if (!reporter) return jsonError("Reporter not found.", 404);

    const now = new Date();
    const document = {
      ...input,
      recordStatus: "ACTIVE" as const,
      reporterId,
      occurredAt: new Date(input.occurredAt),
      createdAt: now,
      updatedAt: now,
    };
    const result = await items.insertOne(document);

    return jsonData(serializeItem({ ...document, _id: result.insertedId }), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
