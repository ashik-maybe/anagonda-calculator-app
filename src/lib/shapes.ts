import {
  add,
  isPerfectSquareFraction,
  isqrt,
  mul,
  parseDecimal,
  sqrtToDecimalString,
  sub,
  toDecimalString,
  toRatioString,
  type Fraction,
} from "./fraction";

function parseStrictPi(): Fraction {
  const f = parseDecimal("3.14159265358979323846264338327950288");
  if (!f) throw new Error("pi constant unparseable");
  return f;
}

/** pi as an exact rational constant; a float never touches the pipeline. */
const PI: Fraction = parseStrictPi();

export type ShapeError = "non_positive" | "invalid_triangle";

export type ShapeArea =
  | { readonly kind: "exact"; readonly value: Fraction }
  | { readonly kind: "sqrt"; readonly radicand: Fraction }
  | { readonly kind: "pi"; readonly coefficient: Fraction };

export type ShapeResult =
  | { readonly ok: true; area: ShapeArea }
  | { readonly ok: false; error: ShapeError };

export type ShapeSpec =
  | { readonly kind: "quad"; l1: Fraction; l2: Fraction; w1: Fraction; w2: Fraction }
  | { readonly kind: "square"; side: Fraction }
  | { readonly kind: "trapezium"; a: Fraction; b: Fraction; h: Fraction }
  | { readonly kind: "heron"; a: Fraction; b: Fraction; c: Fraction }
  | { readonly kind: "right"; a: Fraction; b: Fraction }
  | { readonly kind: "circle"; r: Fraction }
  | { readonly kind: "semicircle"; r: Fraction };

const HALF: Fraction = { num: 1n, den: 2n };

/** den > 0 by invariant, so sign lives in num. */
const positive = (f: Fraction): boolean => f.num > 0n;

const gt = (a: Fraction, b: Fraction): boolean => a.num * b.den > b.num * a.den;

const nonPositive = (): ShapeResult => ({ ok: false, error: "non_positive" });

export function quadArea(l1: Fraction, l2: Fraction, w1: Fraction, w2: Fraction): ShapeResult {
  if (!positive(l1) || !positive(l2) || !positive(w1) || !positive(w2)) return nonPositive();
  const avgLength = mul(add(l1, l2), HALF);
  const avgWidth = mul(add(w1, w2), HALF);
  return { ok: true, area: { kind: "exact", value: mul(avgLength, avgWidth) } };
}

export function squareArea(side: Fraction): ShapeResult {
  if (!positive(side)) return nonPositive();
  return { ok: true, area: { kind: "exact", value: mul(side, side) } };
}

export function trapeziumArea(a: Fraction, b: Fraction, h: Fraction): ShapeResult {
  if (!positive(a) || !positive(b) || !positive(h)) return nonPositive();
  return { ok: true, area: { kind: "exact", value: mul(mul(add(a, b), HALF), h) } };
}

export function heronArea(a: Fraction, b: Fraction, c: Fraction): ShapeResult {
  if (!positive(a) || !positive(b) || !positive(c)) return nonPositive();
  if (!gt(add(a, b), c) || !gt(add(a, c), b) || !gt(add(b, c), a)) {
    return { ok: false, error: "invalid_triangle" };
  }
  const s = mul(add(add(a, b), c), HALF);
  const product = mul(mul(mul(s, sub(s, a)), sub(s, b)), sub(s, c));
  if (isPerfectSquareFraction(product)) {
    const value: Fraction = { num: isqrt(product.num), den: isqrt(product.den) };
    return { ok: true, area: { kind: "exact", value } };
  }
  return { ok: true, area: { kind: "sqrt", radicand: product } };
}

export function rightArea(a: Fraction, b: Fraction): ShapeResult {
  if (!positive(a) || !positive(b)) return nonPositive();
  return { ok: true, area: { kind: "exact", value: mul(mul(a, b), HALF) } };
}

export function circleArea(r: Fraction): ShapeResult {
  if (!positive(r)) return nonPositive();
  return { ok: true, area: { kind: "pi", coefficient: mul(r, r) } };
}

export function semicircleArea(r: Fraction): ShapeResult {
  if (!positive(r)) return nonPositive();
  return { ok: true, area: { kind: "pi", coefficient: mul(mul(r, r), HALF) } };
}

export function shapeArea(s: ShapeSpec): ShapeResult {
  switch (s.kind) {
    case "quad":
      return quadArea(s.l1, s.l2, s.w1, s.w2);
    case "square":
      return squareArea(s.side);
    case "trapezium":
      return trapeziumArea(s.a, s.b, s.h);
    case "heron":
      return heronArea(s.a, s.b, s.c);
    case "right":
      return rightArea(s.a, s.b);
    case "circle":
      return circleArea(s.r);
    case "semicircle":
      return semicircleArea(s.r);
  }
}

export function areaToDecimal(area: ShapeArea, dp = 2): string {
  switch (area.kind) {
    case "exact":
      return toDecimalString(area.value, dp);
    case "sqrt":
      return sqrtToDecimalString(area.radicand, dp);
    case "pi":
      return toDecimalString(mul(area.coefficient, PI), dp);
  }
}

export function areaToRatioString(area: ShapeArea): string {
  switch (area.kind) {
    case "exact":
      return toRatioString(area.value);
    case "sqrt":
      return `sqrt(${toRatioString(area.radicand)})`;
    case "pi":
      return `${toRatioString(area.coefficient)}π`;
  }
}
