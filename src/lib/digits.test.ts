import { describe, expect, test } from "bun:test";
import { fromAnyDigits, groupDigits, groupLakh, groupWestern, toBanglaDigits } from "./digits";

describe("digits", () => {
  test("toBanglaDigits converts Latin digits", () => {
    expect(toBanglaDigits("16.50")).toBe("১৬.৫০");
  });

  test("fromAnyDigits converts Bangla digits and passes Latin through", () => {
    expect(fromAnyDigits("১৬.৫০")).toBe("16.50");
    expect(fromAnyDigits("16.50")).toBe("16.50");
  });

  test("round trip preserves value", () => {
    expect(fromAnyDigits(toBanglaDigits("12345"))).toBe("12345");
  });
});

describe("grouping", () => {
  test("groupLakh: last 3, then pairs", () => {
    expect(groupLakh("1234567")).toBe("12,34,567");
    expect(groupLakh("12345")).toBe("12,345");
    expect(groupLakh("1234")).toBe("1,234");
    expect(groupLakh("123")).toBe("123");
    expect(groupLakh("12")).toBe("12");
    expect(groupLakh("435.6")).toBe("435.6");
    expect(groupLakh("১২৩৪৫৬৭")).toBe("১২,৩৪,৫৬৭");
  });

  test("groupWestern", () => {
    expect(groupWestern("1234567")).toBe("1,234,567");
    expect(groupWestern("12345")).toBe("12,345");
    expect(groupWestern("123")).toBe("123");
    expect(groupWestern("435.6")).toBe("435.6");
  });

  test("groupDigits locale dispatch", () => {
    expect(groupDigits("1234567", "bn")).toBe("12,34,567");
    expect(groupDigits("1234567", "en")).toBe("1,234,567");
  });
});
