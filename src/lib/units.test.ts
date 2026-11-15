import { describe, expect, test } from "bun:test";
import { eq, frac, mul, ONE } from "./fraction";
import {
  absoluteUnitIds,
  CHAIN_FT,
  CHAIN_LINKS,
  convert,
  DEFAULT_RATES,
  GUNIA_LINKS_PER_MILE,
  GUNIA_SCALE_LINKS_PER_INCH,
  guniaInchToLinks,
  LINK_FT,
  SHARE_CHAIN,
  unitFactor,
} from "./units";

describe("units", () => {
  test("every absolute row factor parses at import and yields a positive non-zero factor", () => {
    expect(absoluteUnitIds.length).toBe(14);
    for (const id of absoluteUnitIds) {
      const f = unitFactor(id);
      expect(f.num > 0n).toBe(true);
      expect(f.den > 0n).toBe(true);
    }
  });

  test("kani-scale absolute chain is internally consistent", () => {
    expect(eq(unitFactor("kani"), frac(17280))).toBe(true);
    expect(eq(unitFactor("kani"), mul(unitFactor("gonda"), frac(20)))).toBe(true);
    expect(eq(unitFactor("gonda"), mul(unitFactor("kora"), frac(4)))).toBe(true);
    expect(eq(unitFactor("kora"), mul(unitFactor("kranti"), frac(3)))).toBe(true);
    expect(eq(unitFactor("kranti"), mul(unitFactor("til"), frac(20)))).toBe(true);
  });

  test("bigha is 20 katha under default rates", () => {
    expect(eq(unitFactor("bigha"), mul(unitFactor("katha"), frac(20)))).toBe(true);
  });

  test("standard absolute factors", () => {
    expect(eq(unitFactor("shatak"), unitFactor("shoto"))).toBe(true);
    expect(eq(unitFactor("shoto"), frac(2178, 5))).toBe(true);
    expect(eq(unitFactor("acre"), mul(unitFactor("shoto"), frac(100)))).toBe(true);
    expect(eq(unitFactor("hectare"), mul(unitFactor("sqm"), frac(10000)))).toBe(true);
    expect(eq(unitFactor("sqyard"), frac(9))).toBe(true);
    expect(eq(unitFactor("sqft"), ONE)).toBe(true);
  });

  test("chain constants reconcile with acre and shoto", () => {
    expect(eq(mul(mul(LINK_FT, LINK_FT), frac(100000)), unitFactor("acre"))).toBe(true);
    expect(eq(mul(mul(LINK_FT, LINK_FT), frac(1000)), unitFactor("shoto"))).toBe(true);
  });

  test("convert round trips are exact", () => {
    expect(eq(convert(frac(1), "shoto", "sqft"), frac(2178, 5))).toBe(true);
    expect(eq(convert(convert(frac(1), "kani", "sqft"), "sqft", "kani"), ONE)).toBe(true);
    const hectare = convert(frac(1), "acre", "hectare");
    expect(eq(convert(hectare, "hectare", "acre"), ONE)).toBe(true);
    // Deviation from the spec vector: convert(frac(9), "sqyard", "sqft") is 81
    // sqft by contract, so the intended 1 sqyard -> 9 sqft vector is used.
    expect(eq(convert(frac(1), "sqyard", "sqft"), frac(9))).toBe(true);
  });

  test("custom katha/bigha rates override defaults and leak nowhere", () => {
    const rates = { kathaSqft: frac(800), bighaSqft: frac(15000) };
    expect(eq(unitFactor("katha", rates), frac(800))).toBe(true);
    expect(eq(convert(frac(1), "bigha", "sqft", rates), frac(15000))).toBe(true);
    expect(eq(convert(frac(1), "shoto", "sqft", rates), frac(2178, 5))).toBe(true);
    expect(eq(unitFactor("bigha", rates), mul(unitFactor("katha", rates), frac(20)))).toBe(false);
    expect(eq(unitFactor("katha"), DEFAULT_RATES.kathaSqft)).toBe(true);
  });

  test("gunia scale lookup", () => {
    expect(guniaInchToLinks(16)).toBe(500);
    expect(guniaInchToLinks(80)).toBe(100);
    expect(guniaInchToLinks(12)).toBe(null);
  });

  test("share chain constants", () => {
    // Deviation from the spec vector: the contract nests the ana-share
    // factors under perAna, so SHARE_CHAIN.til is perAna.til.
    expect(SHARE_CHAIN.perAna.til).toBe(4800);
    expect(SHARE_CHAIN.whole).toBe(16);
  });

  test("chain and gunia constants", () => {
    expect(eq(CHAIN_FT, frac(66))).toBe(true);
    expect(CHAIN_LINKS).toBe(100);
    expect(eq(GUNIA_LINKS_PER_MILE, frac(8000))).toBe(true);
    expect(GUNIA_SCALE_LINKS_PER_INCH).toEqual({ "16": 500, "32": 250, "64": 125, "80": 100 });
  });
});
