import { fromAnyDigits } from "./digits";

/**
 * Exact rational arithmetic (BigInt). The only numeric representation in
 * the domain pipeline: no float ever touches a share, area, or conversion.
 * Invariant: den > 0, gcd(|num|, den) = 1, zero is 0/1.
 */
export type Fraction = { readonly num: bigint; readonly den: bigint };

const abs = (x: bigint): bigint => (x < 0n ? -x : x);

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

/** Construct a normalized fraction. Throws RangeError on den === 0. */
export function frac(num: bigint | number, den: bigint | number = 1n): Fraction {
  let n = BigInt(num);
  let d = BigInt(den);
  if (d === 0n) throw new RangeError("frac: denominator must not be zero");
  if (n === 0n) return { num: 0n, den: 1n };
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { num: n / g, den: d / g };
}

export const ZERO: Fraction = frac(0);
export const ONE: Fraction = frac(1);

export const fromInt = (n: bigint | number): Fraction => frac(n);

export const add = (a: Fraction, b: Fraction): Fraction =>
  frac(a.num * b.den + b.num * a.den, a.den * b.den);

export const sub = (a: Fraction, b: Fraction): Fraction =>
  frac(a.num * b.den - b.num * a.den, a.den * b.den);

export const neg = (a: Fraction): Fraction => frac(-a.num, a.den);

export const mul = (a: Fraction, b: Fraction): Fraction => frac(a.num * b.num, a.den * b.den);

export const div = (a: Fraction, b: Fraction): Fraction => {
  if (b.num === 0n) throw new RangeError("div: division by zero");
  return frac(a.num * b.den, a.den * b.num);
};

export const inv = (a: Fraction): Fraction => div(ONE, a);

/** -1 / 0 / 1 by value. */
export const cmp = (a: Fraction, b: Fraction): number => {
  const lhs = a.num * b.den;
  const rhs = b.num * a.den;
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
};

export const eq = (a: Fraction, b: Fraction): boolean => cmp(a, b) === 0;
export const isZero = (a: Fraction): boolean => a.num === 0n;
export const isPositive = (a: Fraction): boolean => a.num > 0n;

/**
 * Parse a decimal string exactly ("435.6" -> 4356/10). Accepts both Latin
 * and Bangla digits (rule: parsers accept both digit sets).
 * Returns null on any malformed input; never throws on bad data.
 */
export function parseDecimal(input: string): Fraction | null {
  const s = fromAnyDigits(input).trim();
  const m = /^([+-]?)(\d+)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[2] === undefined && m[3] === undefined)) return null;
  const sign = m[1] === "-" ? -1n : 1n;
  const intPart = m[2] ?? "0";
  const fracPart = m[3] ?? "";
  const den = 10n ** BigInt(fracPart.length);
  const num = BigInt(intPart) * den + (fracPart === "" ? 0n : BigInt(fracPart));
  return frac(sign * num, den);
}

/** Integer square root (floor). Throws RangeError on negative input. */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new RangeError("isqrt: negative input");
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/** True iff f >= 0 and f is the square of a rational. */
export function isPerfectSquareFraction(f: Fraction): boolean {
  if (f.num < 0n) return false;
  const sn = isqrt(f.num);
  const sd = isqrt(f.den);
  return sn * sn === f.num && sd * sd === f.den;
}

/** Format an integer scaled by 10^dp as a fixed-point string, half-up on magnitude. */
export function formatScaled(scaled: bigint, dp: number): string {
  const neg = scaled < 0n;
  const mag = neg ? -scaled : scaled;
  const pow = 10n ** BigInt(dp);
  const intPart = mag / pow;
  const fracPart = (mag % pow).toString().padStart(dp, "0");
  return `${neg ? "-" : ""}${intPart}${dp > 0 ? "." + fracPart : ""}`;
}

/** Exact decimal expansion of a rational, rounded half-away-from-zero at dp. */
export function toDecimalString(f: Fraction, dp = 2): string {
  const neg = f.num < 0n;
  const n = neg ? -f.num : f.num;
  const pow = 10n ** BigInt(dp);
  const q = (n * pow) / f.den;
  const r = (n * pow) % f.den;
  const rounded = 2n * r >= f.den ? q + 1n : q;
  return formatScaled(neg ? -rounded : rounded, dp);
}

/**
 * Exact decimal expansion of sqrt(f) at dp places, rounded half-away-from-zero.
 * Uses only BigInt; pi/sqrt enter display only, never the pipeline.
 */
export function sqrtToDecimalString(f: Fraction, dp = 2): string {
  if (f.num < 0n) throw new RangeError("sqrtToDecimalString: negative input");
  const pow = 10n ** BigInt(dp);
  const t = f.num * f.den * pow * pow; // S^2 where S = sqrt(f) * 10^dp * den
  const root = isqrt(t); // floor(S)
  let low = root / f.den; // tentative floor(f * 10^dp)
  if ((low + 1n) * f.den * (low + 1n) * f.den <= t) low += 1n;
  // Round half-up: f*10^dp >= low + 1/2  <=>  4*t >= den^2*(2*low+1)^2
  const twoLowPlusOne = 2n * low + 1n;
  if (4n * t >= f.den * f.den * twoLowPlusOne * twoLowPlusOne) low += 1n;
  return formatScaled(low, dp);
}

/** "p/q" (or plain integer string when den === 1). For deed-card exact display. */
export function toRatioString(f: Fraction): string {
  return f.den === 1n ? f.num.toString() : `${f.num}/${f.den}`;
}
