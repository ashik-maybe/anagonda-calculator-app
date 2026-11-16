import { describe, expect, test } from "bun:test";
import { eq, frac, div, mul, ZERO } from "./fraction";
import { unitFactor, DEFAULT_RATES } from "./units";
import {
  decomposeArea,
  decomposeShare,
  formatChain,
  formatShareChain,
  reverseShare,
  sqftToKathaBighaShoto,
  type ChainLabels,
} from "./decomposition";

const EN: ChainLabels = { ana: "ana", gonda: "gonda", kora: "kora", kranti: "kranti", til: "til" };
const BN: ChainLabels = { ana: "আনা", gonda: "গন্ডা", kora: "কড়া", kranti: "ক্রান্তি", til: "তিল" };

describe("decomposeShare", () => {
  test("chain-integral golden vectors", () => {
    expect(decomposeShare(frac(1, 2))).toEqual({
      ana: 8,
      gonda: 0,
      kora: 0,
      kranti: 0,
      til: 0,
      remainderTil: ZERO,
    });
    expect(decomposeShare(frac(3, 32))).toEqual({
      ana: 1,
      gonda: 10,
      kora: 0,
      kranti: 0,
      til: 0,
      remainderTil: ZERO,
    });
    expect(decomposeShare(frac(1, 76800))).toEqual({
      ana: 0,
      gonda: 0,
      kora: 0,
      kranti: 0,
      til: 1,
      remainderTil: ZERO,
    });
    expect(decomposeShare(frac(1, 3))).toEqual({
      ana: 5,
      gonda: 6,
      kora: 2,
      kranti: 2,
      til: 0,
      remainderTil: ZERO,
    });
    expect(decomposeShare(ZERO)).toEqual({
      ana: 0,
      gonda: 0,
      kora: 0,
      kranti: 0,
      til: 0,
      remainderTil: ZERO,
    });
  });

  test("non-integral remainder is exact", () => {
    const d = decomposeShare(frac(1, 7)); // 76800/7 = 10971 3/7 til
    expect(d).toMatchObject({ ana: 2, gonda: 5, kora: 2, kranti: 2, til: 11 });
    expect(eq(d.remainderTil, frac(3, 7))).toBe(true);
  });

  test("share > 1 carries into whole ana", () => {
    const d = decomposeShare(frac(1089, 250)); // 4.356 = 334,540.8 til
    expect(d).toMatchObject({ ana: 69, gonda: 13, kora: 3, kranti: 2, til: 0 });
    expect(eq(d.remainderTil, frac(4, 5))).toBe(true);
  });

  test("rejects negative share", () => {
    expect(() => decomposeShare(frac(-1, 2))).toThrow(RangeError);
  });
});

describe("reverseShare", () => {
  test("50 shoto of 100 -> 8 ana", () => {
    const r = reverseShare(frac(50), "shoto", frac(100));
    expect(r.areaShoto).toEqual(frac(50));
    expect(r.share).toEqual(frac(1, 2));
    expect(r.chain.ana).toBe(8);
    expect(eq(r.chain.remainderTil, ZERO)).toBe(true);
  });

  test("1 acre of 100 shoto -> whole (16 ana)", () => {
    const r = reverseShare(frac(1), "acre", frac(100));
    expect(r.areaShoto).toEqual(frac(100));
    expect(r.chain.ana).toBe(16);
  });

  test("435.6 shoto of 100 -> 4.356 (chain + 4/5 til remainder)", () => {
    const r = reverseShare(frac(2178, 5), "shoto", frac(100));
    expect(eq(r.share, frac(1089, 250))).toBe(true);
    expect(r.chain).toMatchObject({ ana: 69, gonda: 13, kora: 3, kranti: 2, til: 0 });
    expect(eq(r.chain.remainderTil, frac(4, 5))).toBe(true);
  });

  test("conversion plumbing threads unit factors", () => {
    const r = reverseShare(frac(1), "sqm", frac(1));
    expect(eq(r.share, div(unitFactor("sqm"), unitFactor("shoto")))).toBe(true);
  });

  test("zero total throws", () => {
    expect(() => reverseShare(frac(1), "shoto", ZERO)).toThrow(RangeError);
  });
});

describe("sqftToKathaBighaShoto", () => {
  test("15000 sqft greedy with defaults", () => {
    const b = sqftToKathaBighaShoto(frac(15000));
    expect(b).toMatchObject({ bigha: 1, katha: 0, shoto: 1 });
    expect(eq(b.remainderSqft, frac(822, 5))).toBe(true); // 15000-14400-435.6
  });

  test("custom katha rate respected", () => {
    const b = sqftToKathaBighaShoto(frac(1000), { kathaSqft: frac(800), bighaSqft: frac(15000) });
    expect(b).toMatchObject({ bigha: 0, katha: 1, shoto: 0 });
    expect(eq(b.remainderSqft, frac(200))).toBe(true);
  });

  test("zero in, zero out", () => {
    const b = sqftToKathaBighaShoto(ZERO);
    expect(b).toMatchObject({ bigha: 0, katha: 0, shoto: 0 });
    expect(eq(b.remainderSqft, ZERO)).toBe(true);
  });

  test("rejects negative input", () => {
    expect(() => sqftToKathaBighaShoto(frac(-1))).toThrow(RangeError);
  });
});

describe("decomposeArea", () => {
  test("1 acre -> 3 bigha 8 chotak (43560 = 3*14400 + 8*45)", () => {
    const d = decomposeArea(frac(43560), DEFAULT_RATES, "en");
    expect(d).toEqual({ bigha: "3.00", katha: "0.00", chotak: "8.00", sqft: "0.00" });
  });

  test("1 bigha -> 20 katha -> 320 chotak (factor chain)", () => {
    expect(decomposeArea(frac(14400), DEFAULT_RATES, "en")).toEqual({
      bigha: "1.00",
      katha: "0.00",
      chotak: "0.00",
      sqft: "0.00",
    });
    expect(eq(unitFactor("bigha"), mul(unitFactor("katha"), frac(20)))).toBe(true);
    expect(eq(unitFactor("katha"), mul(unitFactor("chotak"), frac(16)))).toBe(true);
    expect(eq(unitFactor("bigha"), mul(unitFactor("chotak"), frac(320)))).toBe(true);
  });

  test("mixed breakdown with sqft remainder", () => {
    // 15000 - 14400 = 600 -> 0 katha, 13 chotak (13*45=585), 15 sqft left
    const d = decomposeArea(frac(15000), DEFAULT_RATES, "en");
    expect(d).toEqual({ bigha: "1.00", katha: "0.00", chotak: "13.00", sqft: "15.00" });
  });

  test("katha-only area decomposes without bigha", () => {
    expect(decomposeArea(frac(720), DEFAULT_RATES, "en")).toEqual({
      bigha: "0.00",
      katha: "1.00",
      chotak: "0.00",
      sqft: "0.00",
    });
    expect(decomposeArea(frac(45), DEFAULT_RATES, "en")).toEqual({
      bigha: "0.00",
      katha: "0.00",
      chotak: "1.00",
      sqft: "0.00",
    });
  });

  test("bn locale uses bangla digits", () => {
    expect(decomposeArea(frac(43560), DEFAULT_RATES, "bn")).toEqual({
      bigha: "৩.০০",
      katha: "০.০০",
      chotak: "৮.০০",
      sqft: "০.০০",
    });
  });

  test("custom rates respected", () => {
    const rates = { bighaSqft: frac(14400), kathaSqft: frac(800) };
    // 1000 sqft -> 1 katha (800), rem 200 -> chotak = 800/16 = 50 sqft, 4 chotak = 200
    const d = decomposeArea(frac(1000), rates, "en");
    expect(d).toEqual({ bigha: "0.00", katha: "1.00", chotak: "4.00", sqft: "0.00" });
  });

  test("rejects negative area", () => {
    expect(() => decomposeArea(frac(-1), DEFAULT_RATES, "en")).toThrow(RangeError);
  });
});

describe("formatChain", () => {
  test("largest-first, zero components omitted", () => {
    expect(formatChain(decomposeShare(frac(1, 2)), EN, "en")).toBe("8 ana");
    expect(formatChain(decomposeShare(frac(3, 32)), EN, "en")).toBe("1 ana 10 gonda");
    expect(formatChain(decomposeShare(ZERO), EN, "en")).toBe("0 ana");
  });

  test("exact remainder rendered as p/q in parens", () => {
    expect(formatChain(decomposeShare(frac(1, 7)), EN, "en")).toBe(
      "2 ana 5 gonda 2 kora 2 kranti 11 til + 3/7 til",
    );
  });

  test("bn locale renders Bangla digits", () => {
    expect(formatChain(decomposeShare(frac(3, 32)), BN, "bn")).toBe("১ আনা ১০ গন্ডা");
    expect(formatChain(decomposeShare(frac(1, 2)), BN, "bn")).toBe("৮ আনা");
  });

  test("formatShareChain equals decompose+format", () => {
    expect(formatShareChain(frac(1, 7), EN, "en")).toBe(
      formatChain(decomposeShare(frac(1, 7)), EN, "en"),
    );
  });
});
