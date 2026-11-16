import { fromAnyDigits } from "./digits";
import { parseDecimal, type Fraction } from "./fraction";

/** Chain field keys, largest unit first. */
export const CHAIN_KEYS = ["ana", "gonda", "kora", "kranti", "til"] as const;
export type ChainKey = (typeof CHAIN_KEYS)[number];

/** i18n keys for inline errors; never alert boxes. */
export type HisabErrors = {
  readonly total: string | null;
  readonly chain: Partial<Record<ChainKey, string | null>>;
};

/**
 * Parse the total-shoto field. Empty string or unparseable input returns
 * null; non-positive values return the parsed value and callers map them
 * to "err_positive". Bengali and Latin digits both accepted.
 */
export function parseTotalShoto(raw: string): Fraction | null {
  const s = fromAnyDigits(raw).trim();
  if (s === "") return null;
  return parseDecimal(s);
}

/**
 * Parse one chain field. Empty is 0 (parts are optional). Anything that
 * is not a non-negative integer (Bangla or Latin) returns null.
 */
export function parseChainPart(raw: string): number | null {
  const s = fromAnyDigits(raw).trim();
  if (s === "") return 0;
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

export function validateHisab(total: string, chain: Record<ChainKey, string>): HisabErrors {
  let totalError: string | null = null;
  const trimmed = fromAnyDigits(total).trim();
  if (trimmed === "") {
    totalError = "err_required";
  } else {
    const parsed = parseDecimal(trimmed);
    if (parsed === null || parsed.num <= 0n) {
      totalError = "err_positive";
    }
  }

  const chainErrors: Partial<Record<ChainKey, string | null>> = {};
  for (const key of CHAIN_KEYS) {
    const raw = chain[key] ?? "";
    if (raw.trim() !== "" && parseChainPart(raw) === null) {
      chainErrors[key] = "err_positive";
    }
  }
  return { total: totalError, chain: chainErrors };
}

/**
 * Validate only the five chain fields (per-owner rows in the ledger).
 * Empty parts are allowed (0); non-integer / out-of-range input maps to
 * "err_positive". Returns undefined entries for valid fields.
 */
export function validateChain(
  chain: Record<ChainKey, string>,
): Partial<Record<ChainKey, string | null>> {
  const errors: Partial<Record<ChainKey, string | null>> = {};
  for (const key of CHAIN_KEYS) {
    const raw = chain[key] ?? "";
    if (raw.trim() !== "" && parseChainPart(raw) === null) {
      errors[key] = "err_positive";
    }
  }
  return errors;
}

export function isHisabValid(errors: HisabErrors): boolean {
  if (errors.total !== null) return false;
  return Object.values(errors.chain).every((e) => e == null);
}
