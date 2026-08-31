import { describe, expect, it } from "vitest";
import { ACTIVE_ITEM_FILTER } from "../src/lib/items";

describe("soft-deleted item filtering", () => {
  it("excludes deleted records while allowing active and legacy records", () => {
    expect(ACTIVE_ITEM_FILTER).toEqual({ recordStatus: { $ne: "DELETED" } });

    const isVisible = (recordStatus?: string) =>
      recordStatus === undefined || recordStatus !== ACTIVE_ITEM_FILTER.recordStatus.$ne;

    expect(isVisible("ACTIVE")).toBe(true);
    expect(isVisible()).toBe(true);
    expect(isVisible("DELETED")).toBe(false);
  });
});
