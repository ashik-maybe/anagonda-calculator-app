import { describe, expect, test } from "bun:test";
import { fromAnyDigits, toBanglaDigits } from "./digits";

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
