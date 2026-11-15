import { mul, frac, ZERO, type Fraction } from "./fraction";

/**
 * 16-ana share system. 1 ana = 20 gonda = 80 kora = 240 kranti = 4800 til;
 * 16 ana = one whole khatian entry = 76800 til.
 * This module is pure math on bigints; it never touches units of area
 * (see units.ts) and never formats text (see decomposition.ts).
 */
export type AnaParts = {
  readonly ana: number;
  readonly gonda: number;
  readonly kora: number;
  readonly kranti: number;
  readonly til: number;
};

export const ZERO_PARTS: AnaParts = { ana: 0, gonda: 0, kora: 0, kranti: 0, til: 0 };

export const WHOLE_TIL = 76800n; // 16 * 4800
const TIL_PER_ANA = 4800n;
const TIL_PER_GONDA = 240n;
const TIL_PER_KORA = 60n;
const TIL_PER_KRANTI = 20n;

/** Exact integer til weight of a chain. Throws on negative or non-integer parts. */
export function partsToTil(p: AnaParts): bigint {
  for (const v of [p.ana, p.gonda, p.kora, p.kranti, p.til]) {
    if (!Number.isInteger(v) || v < 0) {
      throw new RangeError("partsToTil: parts must be non-negative integers");
    }
  }
  return (
    BigInt(p.ana) * TIL_PER_ANA +
    BigInt(p.gonda) * TIL_PER_GONDA +
    BigInt(p.kora) * TIL_PER_KORA +
    BigInt(p.kranti) * TIL_PER_KRANTI +
    BigInt(p.til)
  );
}

/** Greedy, carry-normalizing decomposition of a til count. */
export function tilToParts(til: bigint): AnaParts {
  if (til < 0n) {
    throw new RangeError("tilToParts: negative input");
  }
  let rem = til;
  const ana = rem / TIL_PER_ANA;
  rem %= TIL_PER_ANA;
  const gonda = rem / TIL_PER_GONDA;
  rem %= TIL_PER_GONDA;
  const kora = rem / TIL_PER_KORA;
  rem %= TIL_PER_KORA;
  const kranti = rem / TIL_PER_KRANTI;
  rem %= TIL_PER_KRANTI;
  return {
    ana: Number(ana),
    gonda: Number(gonda),
    kora: Number(kora),
    kranti: Number(kranti),
    til: Number(rem),
  };
}

/** Carry-normalized parts (e.g. 21 til -> 1 kranti 1 til). */
export const normalizeParts = (p: AnaParts): AnaParts => tilToParts(partsToTil(p));

/** Fraction of the whole khatian entry (16 ana) for one owner. */
export const shareFraction = (parts: AnaParts): Fraction => frac(partsToTil(parts), WHOLE_TIL);

/** Exact area for one owner, given the total in shoto. */
export const shareArea = (totalShoto: Fraction, parts: AnaParts): Fraction =>
  mul(totalShoto, shareFraction(parts));

/** Sum of owner parts, carry-normalized (ana may exceed 16). */
export const sumParts = (list: readonly AnaParts[]): AnaParts =>
  tilToParts(list.reduce((acc, p) => acc + partsToTil(p), 0n));

export type ShareCheck = {
  readonly totalTil: bigint;
  readonly wholeTil: bigint;
  /** Signed excess over 16 ana, in til (negative = deficit). */
  readonly overflowTil: bigint;
  readonly isWhole: boolean;
};

/** Σ≠16 detection for the owners ledger. */
export function checkSumShares(list: readonly AnaParts[]): ShareCheck {
  const totalTil = list.reduce((acc, p) => acc + partsToTil(p), 0n);
  return {
    totalTil,
    wholeTil: WHOLE_TIL,
    overflowTil: totalTil - WHOLE_TIL,
    isWhole: totalTil === WHOLE_TIL,
  };
}

/** Exact til weight as a fraction of the whole (for share bars, 0..1). */
export const shareWeight = (parts: AnaParts): Fraction => {
  const til = partsToTil(parts);
  return til === 0n ? ZERO : frac(til, WHOLE_TIL);
};
