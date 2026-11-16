import { describe, expect, test } from "bun:test";
import { frac, parseDecimal } from "./fraction";
import { DEFAULT_RATES } from "./units";
import { convertTable, parseInput } from "./convert";
import { toBanglaDigits } from "./digits";

describe("convert.parseInput", () => {
  test("parses latin and bangla digits", () => {
    expect(parseInput("12.5")).toEqual(parseDecimal("12.5"));
    expect(parseInput(toBanglaDigits("12.5"))).toEqual(parseDecimal("12.5"));
  });
  test("rejects empty and negative", () => {
    expect(parseInput("")).toBeNull();
    expect(parseInput("-3")).toBeNull();
    expect(parseInput("abc")).toBeNull();
  });
  test("accepts zero", () => {
    expect(parseInput("0")).toEqual(frac(0));
  });
  test("accepts lakh-style commas (latin and bangla digits)", () => {
    expect(parseInput("1,440")).toEqual(frac(1440));
    expect(parseInput("1,44,000")).toEqual(frac(144000));
    expect(parseInput("12,34,56,789")).toEqual(frac(123456789));
    expect(parseInput("১,৪৪০")).toEqual(frac(1440));
    expect(parseInput("১,৪৪,০০০")).toEqual(frac(144000));
  });
  test("accepts grouped decimals", () => {
    expect(parseInput("1,44,000.5")).toEqual(parseDecimal("144000.5"));
  });
  test("accepts a simple fraction a/b", () => {
    expect(parseInput("1/2")).toEqual(frac(1, 2));
    expect(parseInput("১/২")).toEqual(frac(1, 2));
    expect(parseInput("3/4")).toEqual(frac(3, 4));
    expect(parseInput(" 1 / 2 ")).toEqual(frac(1, 2));
  });
  test("rejects malformed commas and fractions", () => {
    expect(parseInput("1,")).toBeNull();
    expect(parseInput(",1")).toBeNull();
    expect(parseInput("1,,440")).toBeNull();
    expect(parseInput("1234,5")).toBeNull();
    expect(parseInput("১,৪৪,০")).toBeNull();
    expect(parseInput("1/0")).toBeNull();
    expect(parseInput("1/2/3")).toBeNull();
    expect(parseInput("/2")).toBeNull();
    expect(parseInput("1/")).toBeNull();
    expect(parseInput("-1/2")).toBeNull();
    expect(parseInput("1,4,,4")).toBeNull();
  });
});

describe("convert.convertTable", () => {
  test("1 acre = 100 shatak", () => {
    const v = parseInput("1")!;
    const rows = convertTable(v, "acre", DEFAULT_RATES, "en");
    const shatak = rows.find((r) => r.unit === "shatak");
    expect(shatak?.value).toBe("100.00");
  });
  test("1 bigha in shoto (exact)", () => {
    const v = parseInput("1")!;
    const rows = convertTable(v, "bigha", DEFAULT_RATES, "en");
    const shoto = rows.find((r) => r.unit === "shoto");
    // 14400 / 435.6
    expect(shoto?.value).toBe("33.06");
  });
  test("round trip acre -> shatak -> acre", () => {
    const v = parseInput("2")!;
    const rows = convertTable(v, "acre", DEFAULT_RATES, "en");
    const shatakVal = rows.find((r) => r.unit === "shatak")!.value;
    const back = convertTable(parseInput(shatakVal)!, "shatak", DEFAULT_RATES, "en");
    const acre = back.find((r) => r.unit === "acre")!.value;
    expect(acre).toBe("2.00");
  });
  test("bn locale uses bangla digits", () => {
    const v = parseInput("1")!;
    const rows = convertTable(v, "acre", DEFAULT_RATES, "bn");
    const acre = rows.find((r) => r.unit === "acre")!.value;
    expect(acre).toBe("১.০০");
  });
});
