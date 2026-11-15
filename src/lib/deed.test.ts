import { describe, expect, it } from "bun:test";
import {
  buildDeedResult,
  conversionStrip,
  formatLand,
  type DeedResult,
  type StripUnit,
} from "./deed";
import { decomposeShare } from "./decomposition";
import { frac, mul, type Fraction } from "./fraction";
import type { Rates } from "./units";

const totalShoto: Fraction = frac(100);
const share: Fraction = frac(1, 2);
const shareArea: Fraction = frac(50);
const chain = decomposeShare(share);

const buildResult = (locale: "bn" | "en", rates?: Rates): DeedResult =>
  buildDeedResult({ totalShoto, share, shareArea, chain, rates }, locale);

const stripValue = (result: DeedResult, unit: StripUnit): string | undefined =>
  result.strip.find((item) => item.unit === unit)?.value;

// 50 shoto = 50 * 435.6 = 21780 sqft. conversionStrip takes a shoto value and
// converts via the shoto factor before dividing by each unit factor.
const shareAreaShoto: Fraction = frac(50);

describe("buildDeedResult bn", () => {
  it("formats the greedy chain", () => {
    expect(buildResult("bn").chainText).toBe("৮ আনা");
  });
  it("formats the exact share ratio", () => {
    expect(buildResult("bn").ratioText).toBe("১/২");
  });
  it("formats the share area", () => {
    expect(buildResult("bn").areaText).toBe("৫০.০০");
  });
  it("formats the total", () => {
    expect(buildResult("bn").totalText).toBe("১০০.০০");
  });
  it("renders the deed sentence", () => {
    expect(buildResult("bn").sentence).toBe("মোট ১০০.০০ শতাংশের ৮ আনা = ৫০.০০ শতাংশ (১/২ অংশ)");
  });
  it("strip katha: 21780 sqft / 720 = 30.25", () => {
    expect(stripValue(buildResult("bn"), "katha")).toBe("৩০.২৫");
  });
  it("strip acre: 21780 sqft / 43560 = 0.50", () => {
    expect(stripValue(buildResult("bn"), "acre")).toBe("০.৫০");
  });
  it("strip bigha: 21780 sqft / 14400 = 1.51", () => {
    expect(stripValue(buildResult("bn"), "bigha")).toBe("১.৫১");
  });
  it("strip shoto echoes the input", () => {
    expect(stripValue(buildResult("bn"), "shoto")).toBe("৫০.০০");
  });
  it("custom rates override the strip bigha factor", () => {
    const rates: Rates = { kathaSqft: frac(800), bighaSqft: frac(15000) };
    expect(stripValue(buildResult("bn", rates), "bigha")).toBe("১.৪৫");
  });
});

describe("buildDeedResult en", () => {
  it("formats the chain with English labels", () => {
    // DEVIATION: spec said "8 ana"; en.json "ana" label is "Ana".
    expect(buildResult("en").chainText).toBe("8 Ana");
  });
  it("formats the ratio in Latin digits", () => {
    expect(buildResult("en").ratioText).toBe("1/2");
  });
  it("renders the English deed sentence", () => {
    // DEVIATION: spec said "8 ana of ..."; current label capitalizes "Ana".
    expect(buildResult("en").sentence).toBe("8 Ana of 100.00 shoto = 50.00 shoto (1/2 share)");
  });
  it("strip katha in en locale", () => {
    expect(stripValue(buildResult("en"), "katha")).toBe("30.25");
  });
});

describe("conversionStrip (shoto input)", () => {
  it("converts 50 shoto to katha/bigha/acre with default rates", () => {
    const strip = conversionStrip(shareAreaShoto);
    expect(strip.find((item) => item.unit === "katha")?.value).toBe("৩০.২৫");
    expect(strip.find((item) => item.unit === "bigha")?.value).toBe("১.৫১");
    expect(strip.find((item) => item.unit === "acre")?.value).toBe("০.৫০");
    expect(strip.find((item) => item.unit === "shoto")?.value).toBe("৫০.০০");
  });
  it("honors custom rates", () => {
    const rates: Rates = { kathaSqft: frac(800), bighaSqft: frac(15000) };
    const strip = conversionStrip(shareAreaShoto, rates, "bn");
    expect(strip.find((item) => item.unit === "bigha")?.value).toBe("১.৪৫");
  });
});

describe("formatLand", () => {
  it("groups lakh-style with Bangla digits", () => {
    expect(formatLand(frac(12345678, 100), 2, "bn")).toBe("১,২৩,৪৫৬.৭৮");
  });
});

describe("ratio display for 3/32", () => {
  const result = (locale: "bn" | "en"): DeedResult =>
    buildDeedResult(
      {
        totalShoto,
        share: frac(3, 32),
        shareArea: mul(totalShoto, frac(3, 32)),
        chain: decomposeShare(frac(3, 32)),
      },
      locale,
    );
  it("renders ৩/৩২ in bn", () => {
    expect(result("bn").ratioText).toBe("৩/৩২");
  });
  it("renders 3/32 in en", () => {
    expect(result("en").ratioText).toBe("3/32");
  });
});
