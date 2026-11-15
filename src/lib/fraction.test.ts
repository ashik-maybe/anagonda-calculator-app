import { describe, expect, test } from "bun:test";
import {
  add,
  cmp,
  div,
  eq,
  frac,
  isPerfectSquareFraction,
  isqrt,
  mul,
  neg,
  ONE,
  parseDecimal,
  sqrtToDecimalString,
  sub,
  toDecimalString,
  ZERO,
} from "./fraction";

describe("fraction", () => {
  test("frac normalizes sign and reduces", () => {
    expect(frac(2, -4)).toEqual({ num: -1n, den: 2n });
    expect(frac(6, 9)).toEqual({ num: 2n, den: 3n });
    expect(frac(0, 5)).toEqual({ num: 0n, den: 1n });
  });

  test("frac throws on zero denominator", () => {
    expect(() => frac(1, 0)).toThrow(RangeError);
  });

  test("arithmetic exactness incl. til edges", () => {
    const til = frac(1, 4800);
    expect(add(til, til)).toEqual(frac(1, 2400));
    // 20 til = 1 kranti, 80 kora-til sums etc. stay exact
    let acc = ZERO;
    for (let i = 0; i < 4800; i++) acc = add(acc, til);
    expect(acc).toEqual(ONE);
    expect(mul(frac(3, 4), frac(4, 3))).toEqual(ONE);
    expect(sub(frac(1, 2), frac(1, 3))).toEqual(frac(1, 6));
    expect(div(frac(1, 2), frac(3, 4))).toEqual(frac(2, 3));
    expect(neg(frac(2, 3))).toEqual(frac(-2, 3));
  });

  test("cmp and eq", () => {
    expect(cmp(frac(1, 3), frac(1, 2))).toBe(-1);
    expect(cmp(frac(2, 4), frac(1, 2))).toBe(0);
    expect(cmp(frac(5, 2), frac(2, 1))).toBe(1);
    expect(eq(frac(10, 20), frac(1, 2))).toBe(true);
    expect(eq(ONE, ZERO)).toBe(false);
  });

  test("parseDecimal is exact and accepts both digit sets", () => {
    expect(parseDecimal("435.6")).toEqual(frac(2178, 5));
    expect(parseDecimal("3.6")).toEqual(frac(18, 5));
    expect(parseDecimal("10.7639")).toEqual(frac(107639, 10000));
    expect(parseDecimal("১৬")).toEqual(frac(16, 1));
    expect(parseDecimal("৪৩৫.৬")).toEqual(frac(2178, 5));
    expect(parseDecimal("16")).toEqual(frac(16, 1));
    expect(parseDecimal("0")).toEqual(ZERO);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("1.2.3")).toBeNull();
  });

  test("toDecimalString rounds half away from zero at dp", () => {
    expect(toDecimalString(frac(1, 2), 2)).toBe("0.50");
    expect(toDecimalString(frac(1, 8), 2)).toBe("0.13"); // 0.125 -> half away from zero
    expect(toDecimalString(frac(2178, 5), 2)).toBe("435.60");
    expect(toDecimalString(frac(107639, 10000), 4)).toBe("10.7639");
    expect(toDecimalString(frac(-1, 2), 2)).toBe("-0.50");
    expect(toDecimalString(frac(-1, 8), 2)).toBe("-0.13");
    expect(toDecimalString(frac(1, 3), 2)).toBe("0.33");
  });

  test("isqrt and perfect-square detection", () => {
    expect(isqrt(0n)).toBe(0n);
    expect(isqrt(1n)).toBe(1n);
    expect(isqrt(15n)).toBe(3n);
    expect(isqrt(16n)).toBe(4n);
    expect(isqrt(135n)).toBe(11n);
    expect(isPerfectSquareFraction(frac(36, 1))).toBe(true);
    expect(isPerfectSquareFraction(frac(135, 16))).toBe(false);
    expect(isPerfectSquareFraction(frac(9, 4))).toBe(true);
    expect(isPerfectSquareFraction(neg(ONE))).toBe(false);
  });

  test("sqrtToDecimalString exact at display dp", () => {
    expect(sqrtToDecimalString(frac(36, 1), 2)).toBe("6.00");
    expect(sqrtToDecimalString(frac(2, 1), 2)).toBe("1.41");
    expect(sqrtToDecimalString(frac(2, 1), 6)).toBe("1.414214");
    expect(sqrtToDecimalString(frac(135, 16), 4)).toBe("2.9047"); // ~2.9047375
    expect(sqrtToDecimalString(frac(0, 1), 2)).toBe("0.00");
    expect(sqrtToDecimalString(frac(1, 4), 3)).toBe("0.500");
  });
});
