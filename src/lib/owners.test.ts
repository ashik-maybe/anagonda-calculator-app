import { describe, expect, test } from "bun:test";
import { add, frac, ZERO } from "./fraction";
import {
  sumShares,
  sumState,
  buildBontonShareText,
  type OwnerShareRow,
  type ShareTextOptions,
} from "./owners";

describe("sumShares", () => {
  test("empty list -> ZERO", () => {
    expect(sumShares([])).toEqual(ZERO);
  });

  test("16 ana = whole", () => {
    expect(sumShares([{ ana: 8 }, { ana: 8 }])).toEqual(frac(1));
  });

  test("10 ana = 5/8", () => {
    expect(sumShares([{ ana: 5 }, { ana: 5 }])).toEqual(frac(5, 8));
  });

  test("20 ana = 5/4", () => {
    expect(sumShares([{ ana: 20 }, { ana: 0 }])).toEqual(frac(5, 4));
  });

  test("3 owners of 4.5 ana each = 27/32", () => {
    const parts = { ana: 4, gonda: 10, kora: 0, kranti: 0, til: 0 };
    expect(sumShares([parts, parts, parts])).toEqual(frac(27, 32));
  });
});

describe("sumState", () => {
  test("ZERO -> under", () => {
    expect(sumState(ZERO)).toBe("under");
  });

  test("1/2 -> under", () => {
    expect(sumState(frac(1, 2))).toBe("under");
  });

  test("1 -> equal", () => {
    expect(sumState(frac(1))).toBe("equal");
  });

  test("1/2 + 1/2 -> equal", () => {
    expect(sumState(add(frac(1, 2), frac(1, 2)))).toBe("equal");
  });

  test("5/4 -> over", () => {
    expect(sumState(frac(5, 4))).toBe("over");
  });
});

describe("buildBontonShareText", () => {
  test("bn locale with empty name", () => {
    const rows: OwnerShareRow[] = [
      { name: "করিম", chainText: "৮ আনা", areaText: "৫০.০০" },
      { name: "", chainText: "৮ আনা", areaText: "৫০.০০" },
    ];
    const opts: ShareTextOptions = {
      totalText: "১০০.০০",
      sumChainText: "১৬ আনা",
      state: "equal",
      locale: "bn",
      unitLabel: "শতাংশ",
      ownerCount: "মালিক {n}",
    };
    const result = buildBontonShareText(rows, opts);
    expect(result).toBe(
      "১০০.০০ শতাংশ — ১৬ আনা\nকরিম — ৮ আনা — ৫০.০০ শতাংশ — ✓\nমালিক ২ — ৮ আনা — ৫০.০০ শতাংশ — ✓\n১৬ আনা ✓",
    );
  });

  test("under state", () => {
    const rows: OwnerShareRow[] = [
      { name: "করিম", chainText: "৫ আনা", areaText: "৩১.২৫" },
      { name: "রহিম", chainText: "৫ আনা", areaText: "৩১.২৫" },
    ];
    const opts: ShareTextOptions = {
      totalText: "১০০.০০",
      sumChainText: "১০ আনা",
      state: "under",
      locale: "bn",
      unitLabel: "শতাংশ",
      ownerCount: "মালিক {n}",
    };
    const result = buildBontonShareText(rows, opts);
    expect(result.endsWith("১০ আনা …")).toBe(true);
  });

  test("over state", () => {
    const rows: OwnerShareRow[] = [
      { name: "করিম", chainText: "১০ আনা", areaText: "৬২.৫০" },
      { name: "রহিম", chainText: "১০ আনা", areaText: "৬২.৫০" },
    ];
    const opts: ShareTextOptions = {
      totalText: "১০০.০০",
      sumChainText: "২০ আনা",
      state: "over",
      locale: "bn",
      unitLabel: "শতাংশ",
      ownerCount: "মালিক {n}",
    };
    const result = buildBontonShareText(rows, opts);
    expect(result.endsWith("২০ আনা ✗")).toBe(true);
  });

  test("en locale", () => {
    const rows: OwnerShareRow[] = [
      { name: "Karim", chainText: "8 Ana", areaText: "50.00" },
      { name: "", chainText: "8 Ana", areaText: "50.00" },
    ];
    const opts: ShareTextOptions = {
      totalText: "100.00",
      sumChainText: "16 Ana",
      state: "equal",
      locale: "en",
      unitLabel: "shoto",
      ownerCount: "Owner {n}",
    };
    const result = buildBontonShareText(rows, opts);
    expect(result).toBe(
      "100.00 shoto — 16 Ana\nKarim — 8 Ana — 50.00 shoto — ✓\nOwner 2 — 8 Ana — 50.00 shoto — ✓\n16 Ana ✓",
    );
  });
});
