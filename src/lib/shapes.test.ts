import { describe, expect, test } from "bun:test";
import { frac } from "./fraction";
import {
  areaToDecimal,
  areaToRatioString,
  circleArea,
  heronArea,
  quadArea,
  rightArea,
  semicircleArea,
  shapeArea,
  squareArea,
  trapeziumArea,
} from "./shapes";

describe("shapes", () => {
  test("square side 5 -> exact 25", () => {
    const r = squareArea(frac(5));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.area).toEqual({ kind: "exact", value: frac(25) });
    expect(areaToDecimal(r.area, 2)).toBe("25.00");
  });

  test("quad averages both axes", () => {
    const r = quadArea(frac(10), frac(14), frac(6), frac(10));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.area).toEqual({ kind: "exact", value: frac(96) });
    expect(areaToDecimal(r.area, 2)).toBe("96.00");
  });

  test("trapezium a=3 b=5 h=4 -> exact 16", () => {
    const r = trapeziumArea(frac(3), frac(5), frac(4));
    expect(r).toEqual({ ok: true, area: { kind: "exact", value: frac(16) } });
  });

  test("heron 3,4,5 -> exact 6 (perfect-square normalization)", () => {
    const r = heronArea(frac(3), frac(4), frac(5));
    expect(r).toEqual({ ok: true, area: { kind: "exact", value: frac(6) } });
  });

  test("heron 2,3,4 -> sqrt(135/16) symbolic, dp2 2.90", () => {
    const r = heronArea(frac(2), frac(3), frac(4));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.area.kind).toBe("sqrt");
    if (r.area.kind !== "sqrt") return;
    expect(r.area.radicand).toEqual(frac(135, 16));
    expect(areaToDecimal(r.area, 2)).toBe("2.90");
  });

  test("heron rejects invalid triangles", () => {
    expect(heronArea(frac(1), frac(1), frac(3))).toEqual({
      ok: false,
      error: "invalid_triangle",
    });
    expect(heronArea(frac(1), frac(2), frac(1))).toEqual({
      ok: false,
      error: "invalid_triangle",
    });
  });

  test("heron 5,5,5 -> sqrt kind, dp2 10.83", () => {
    const r = heronArea(frac(5), frac(5), frac(5));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.area.kind).toBe("sqrt");
    expect(areaToDecimal(r.area, 2)).toBe("10.83");
  });

  test("right 3,4 -> exact 6", () => {
    expect(rightArea(frac(3), frac(4))).toEqual({
      ok: true,
      area: { kind: "exact", value: frac(6) },
    });
  });

  test("circle r=1 -> pi coefficient 1, dp2 3.14", () => {
    const r = circleArea(frac(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.area).toEqual({ kind: "pi", coefficient: frac(1) });
    expect(areaToDecimal(r.area, 2)).toBe("3.14");
  });

  test("semicircle r=2 -> coefficient 2, dp2 6.28", () => {
    const r = semicircleArea(frac(2));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.area).toEqual({ kind: "pi", coefficient: frac(2) });
    expect(areaToDecimal(r.area, 2)).toBe("6.28");
  });

  test("non_positive on zero or negative dimension in every shape", () => {
    expect(squareArea(frac(0))).toEqual({ ok: false, error: "non_positive" });
    expect(circleArea(frac(-1))).toEqual({ ok: false, error: "non_positive" });
    expect(quadArea(frac(10), frac(14), frac(6), frac(0))).toEqual({
      ok: false,
      error: "non_positive",
    });
    expect(trapeziumArea(frac(3), frac(5), frac(0))).toEqual({
      ok: false,
      error: "non_positive",
    });
    expect(rightArea(frac(0), frac(4))).toEqual({ ok: false, error: "non_positive" });
    expect(heronArea(frac(0), frac(4), frac(5))).toEqual({
      ok: false,
      error: "non_positive",
    });
    expect(shapeArea({ kind: "semicircle", r: frac(-2) })).toEqual({
      ok: false,
      error: "non_positive",
    });
  });

  test("no NaN or Infinity for any valid kind", () => {
    const specs = [
      { kind: "quad", l1: frac(10), l2: frac(14), w1: frac(6), w2: frac(10) },
      { kind: "square", side: frac(5) },
      { kind: "trapezium", a: frac(3), b: frac(5), h: frac(4) },
      { kind: "heron", a: frac(3), b: frac(4), c: frac(5) },
      { kind: "right", a: frac(3), b: frac(4) },
      { kind: "circle", r: frac(1) },
      { kind: "semicircle", r: frac(2) },
    ] as const;
    for (const s of specs) {
      const r = shapeArea(s);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(areaToDecimal(r.area, 2)).toMatch(/^\d+\.\d{2}$/);
    }
  });

  test("pi is a rational constant: circle r=10 -> 314.16", () => {
    const r = circleArea(frac(10));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(areaToDecimal(r.area, 2)).toBe("314.16");
  });

  test("ratio strings stay symbolic", () => {
    expect(areaToRatioString({ kind: "exact", value: frac(25) })).toBe("25");
    expect(areaToRatioString({ kind: "exact", value: frac(3, 2) })).toBe("3/2");
    expect(areaToRatioString({ kind: "sqrt", radicand: frac(135, 16) })).toBe("sqrt(135/16)");
    expect(areaToRatioString({ kind: "pi", coefficient: frac(2) })).toBe("2π");
  });
});
