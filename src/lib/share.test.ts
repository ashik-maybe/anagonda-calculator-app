import { describe, expect, test } from "bun:test";
import { eq, frac, ONE, ZERO } from "./fraction";
import {
  checkSumShares,
  normalizeParts,
  partsToTil,
  shareArea,
  shareFraction,
  shareWeight,
  sumParts,
  tilToParts,
  ZERO_PARTS,
  WHOLE_TIL,
  type AnaParts,
} from "./share";

describe("share engine", () => {
  test("partsToTil exact weights", () => {
    expect(partsToTil({ ana: 1, gonda: 0, kora: 0, kranti: 0, til: 0 })).toBe(4800n);
    expect(partsToTil({ ...ZERO_PARTS, gonda: 1 })).toBe(240n);
    expect(partsToTil({ ...ZERO_PARTS, kora: 1 })).toBe(60n);
    expect(partsToTil({ ...ZERO_PARTS, kranti: 1 })).toBe(20n);
    expect(partsToTil({ ...ZERO_PARTS, til: 1 })).toBe(1n);
    expect(partsToTil({ ana: 1, gonda: 10, kora: 5, kranti: 2, til: 3 })).toBe(
      4800n + 2400n + 300n + 40n + 3n,
    );
  });

  test("tilToParts decomposes greedily", () => {
    expect(tilToParts(WHOLE_TIL)).toEqual({ ana: 16, gonda: 0, kora: 0, kranti: 0, til: 0 });
    expect(tilToParts(7543n)).toEqual({ ana: 1, gonda: 11, kora: 1, kranti: 2, til: 3 });
    expect(tilToParts(0n)).toEqual(ZERO_PARTS);
    expect(tilToParts(partsToTil({ ana: 1, gonda: 10, kora: 5, kranti: 2, til: 3 }))).toEqual(
      normalizeParts({ ana: 1, gonda: 10, kora: 5, kranti: 2, til: 3 }),
    );
  });

  test("normalizeParts carries up the chain", () => {
    expect(normalizeParts({ ...ZERO_PARTS, til: 9600 })).toEqual({
      ana: 2,
      gonda: 0,
      kora: 0,
      kranti: 0,
      til: 0,
    });
    expect(normalizeParts({ ...ZERO_PARTS, gonda: 21 })).toEqual({
      ana: 1,
      gonda: 1,
      kora: 0,
      kranti: 0,
      til: 0,
    });
    expect(normalizeParts({ ...ZERO_PARTS, kora: 80 })).toEqual({
      ana: 1,
      gonda: 0,
      kora: 0,
      kranti: 0,
      til: 0,
    });
  });

  test("shareFraction golden vectors", () => {
    expect(shareFraction({ ana: 8, gonda: 0, kora: 0, kranti: 0, til: 0 })).toEqual(frac(1, 2));
    expect(shareFraction({ ana: 1, gonda: 10, kora: 0, kranti: 0, til: 0 })).toEqual(frac(3, 32));
    expect(shareFraction({ ...ZERO_PARTS, til: 1 })).toEqual(frac(1, 76800));
    expect(shareFraction(ZERO_PARTS)).toEqual(ZERO);
    expect(shareFraction({ ana: 16, gonda: 0, kora: 0, kranti: 0, til: 0 })).toEqual(ONE);
  });

  test("shareArea exact", () => {
    expect(shareArea(frac(100), { ana: 8, gonda: 0, kora: 0, kranti: 0, til: 0 })).toEqual(
      frac(50),
    );
    expect(shareArea(frac(100), { ana: 1, gonda: 10, kora: 0, kranti: 0, til: 0 })).toEqual(
      frac(75, 8),
    );
    expect(shareArea(frac(2178, 5), { ana: 16, gonda: 0, kora: 0, kranti: 0, til: 0 })).toEqual(
      frac(2178, 5),
    );
  });

  test("sumParts and checkSumShares detect Σ≠16", () => {
    const a: AnaParts = { ana: 8, gonda: 0, kora: 0, kranti: 0, til: 0 };
    const b: AnaParts = { ana: 7, gonda: 0, kora: 0, kranti: 0, til: 0 };
    expect(sumParts([a, a])).toEqual({ ana: 16, gonda: 0, kora: 0, kranti: 0, til: 0 });
    expect(sumParts([a, b])).toEqual({ ana: 15, gonda: 0, kora: 0, kranti: 0, til: 0 });
    expect(sumParts([])).toEqual(ZERO_PARTS);

    const over: AnaParts = { ana: 9, gonda: 0, kora: 0, kranti: 0, til: 0 };
    expect(checkSumShares([a, a]).isWhole).toBe(true);
    expect(checkSumShares([a, a]).overflowTil).toBe(0n);
    expect(checkSumShares([over, a]).isWhole).toBe(false);
    expect(checkSumShares([over, a]).overflowTil).toBe(4800n);
    expect(checkSumShares([b, b]).overflowTil).toBe(-9600n);
  });

  test("shareWeight for bars", () => {
    expect(shareWeight({ ana: 8, gonda: 0, kora: 0, kranti: 0, til: 0 })).toEqual(frac(1, 2));
    expect(shareWeight(ZERO_PARTS)).toEqual(ZERO);
    expect(eq(shareWeight({ ana: 16, gonda: 0, kora: 0, kranti: 0, til: 0 }), ONE)).toBe(true);
  });

  test("rejects negative and fractional parts", () => {
    expect(() => partsToTil({ ...ZERO_PARTS, ana: -1 })).toThrow(RangeError);
    expect(() => partsToTil({ ...ZERO_PARTS, til: 1.5 })).toThrow(RangeError);
    expect(() => tilToParts(-1n)).toThrow(RangeError);
  });
});
