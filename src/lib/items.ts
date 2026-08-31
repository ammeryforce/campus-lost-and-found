import type { Filter } from "mongodb";
import type { ItemDocument } from "@/lib/types";

/**
 * MongoDB's $ne operator also matches documents where the field is absent,
 * keeping item records created before recordStatus was added visible.
 */
export const ACTIVE_ITEM_FILTER = {
  recordStatus: { $ne: "DELETED" },
} satisfies Filter<ItemDocument>;
