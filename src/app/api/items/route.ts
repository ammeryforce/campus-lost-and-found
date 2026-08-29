import type { Filter } from "mongodb";
import { getCollections } from "@/lib/database";
import {
  escapeRegex,
  handleApiError,
  jsonData,
  jsonError,
  parseId,
  readJson,
  serializeItem,
} from "@/lib/api";
import type { ItemDocument } from "@/lib/types";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "@/lib/types";
import { createItemSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const filter: Filter<ItemDocument> = {};

    if (status && ITEM_STATUSES.includes(status as (typeof ITEM_STATUSES)[number])) {
      filter.status = status as ItemDocument["status"];
    }
    if (category && ITEM_CATEGORIES.includes(category as (typeof ITEM_CATEGORIES)[number])) {
      filter.category = category as ItemDocument["category"];
    }
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: pattern }, { description: pattern }, { location: pattern }];
    }

    const { items } = await getCollections();
    const documents = await items.find(filter).sort({ occurredAt: -1 }).limit(200).toArray();
    return jsonData(documents.map(serializeItem));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await readJson(request, createItemSchema);
    const reporterId = parseId(input.reporterId);
    if (!reporterId) return jsonError("Reporter not found.", 404);

    const { users, items } = await getCollections();
    const reporter = await users.findOne({ _id: reporterId }, { projection: { _id: 1 } });
    if (!reporter) return jsonError("Reporter not found.", 404);

    const now = new Date();
    const document = {
      ...input,
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
