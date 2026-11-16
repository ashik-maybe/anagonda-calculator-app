import {
  add,
  cmp,
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

export type ShapeId =
  | "quad"
  | "square"
  | "trapezoid"
  | "triangle"
  | "rightTriangle"
  | "circle"
  | "semicircle";

/** Outline/picker order; shared by the shape picker and history rows. */
export const SHAPE_ORDER: readonly ShapeId[] = [
  "quad",
  "square",
  "trapezoid",
  "triangle",
  "rightTriangle",
  "circle",
  "semicircle",
];

const FIELDS: Record<ShapeId, readonly string[]> = {
  quad: ["len_1", "len_2", "width_1", "width_2"],
  square: ["side"],
  trapezoid: ["side_a", "side_b", "height"],
  triangle: ["side_a", "side_b", "side_c"],
  rightTriangle: ["base", "height"],
  circle: ["radius"],
  semicircle: ["radius"],
};

/** Field ids the picker renders inputs for, per shape. */
export function shapeFields(shape: ShapeId): readonly string[] {
  return FIELDS[shape];
}

/** Strict triangle inequality; degenerate (equality) rejected. */
export function triangleValid(a: Fraction, b: Fraction, c: Fraction): boolean {
  return cmp(add(a, b), c) > 0 && cmp(add(a, c), b) > 0 && cmp(add(b, c), a) > 0;
}

const required = (v: Record<string, Fraction>, name: string): Fraction => {
  const value = v[name];
  if (value === undefined) {
    throw new RangeError(`shapeFromFields: missing field ${name}`);
  }
  return value;
};

/**
 * Map validated per-field Fractions to a ShapeSpec.
 * Caller validates positivity; this does not re-validate. A missing key throws
 * RangeError("shapeFromFields: missing field <x>") — caller contract broken.
 * Field names come from the FIELDS registry, identical to shapeFields ids.
 */
export function shapeFromFields(shape: ShapeId, v: Record<string, Fraction>): ShapeSpec {
  switch (shape) {
    case "quad":
      return {
        kind: "quad",
        l1: required(v, "len_1"),
        l2: required(v, "len_2"),
        w1: required(v, "width_1"),
        w2: required(v, "width_2"),
      };
    case "square":
      return { kind: "square", side: required(v, "side") };
    case "trapezoid":
      return {
        kind: "trapezium",
        a: required(v, "side_a"),
        b: required(v, "side_b"),
        h: required(v, "height"),
      };
    case "triangle":
      return {
        kind: "heron",
        a: required(v, "side_a"),
        b: required(v, "side_b"),
        c: required(v, "side_c"),
      };
    case "rightTriangle":
      return { kind: "right", a: required(v, "base"), b: required(v, "height") };
    case "circle":
      return { kind: "circle", r: required(v, "radius") };
    case "semicircle":
      return { kind: "semicircle", r: required(v, "radius") };
  }
}
