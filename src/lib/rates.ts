import { getDb } from "./storage";
import { eq, parseDecimal, toDecimalString, type Fraction } from "./fraction";
import { DEFAULT_RATES, type Rates } from "./units";

/**
 * Parse a rate input ("720", "435.6", Bangla digits) into a positive
 * Fraction. Returns null on empty, malformed, zero, or negative input;
 * never throws.
 */
export function parseRate(input: string): Fraction | null {
  const f = parseDecimal(input);
  if (!f || f.num <= 0n) return null;
  return f;
}

/** True when both rates equal the built-in defaults. */
export function isDefaultRates(r: Rates): boolean {
  return eq(r.kathaSqft, DEFAULT_RATES.kathaSqft) && eq(r.bighaSqft, DEFAULT_RATES.bighaSqft);
}

/** Convenience: true when any rate differs from the defaults. */
export const isCustomRates: (r: Rates) => boolean = (r: Rates) => !isDefaultRates(r);

const isPositive = (f: Fraction): boolean => f.den > 0n && f.num > 0n;

/** Idempotent schema bootstrap for the rates singleton table. */
const ensureRatesTable = (): void => {
  getDb().execSync(
    `CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      katha_sqft TEXT NOT NULL,
      bigha_sqft TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );`,
  );
};

/**
 * Read the singleton rates row. Missing row or unparseable values fall back
 * to DEFAULT_RATES; never throws.
 */
export function getRates(): Rates {
  try {
    ensureRatesTable();
    const row = getDb().getFirstSync<{ katha_sqft: string; bigha_sqft: string }>(
      "SELECT katha_sqft, bigha_sqft FROM rates WHERE id = 1",
    );
    if (!row) return DEFAULT_RATES;
    const kathaSqft = parseDecimal(row.katha_sqft);
    const bighaSqft = parseDecimal(row.bigha_sqft);
    if (!kathaSqft || !bighaSqft || !isPositive(kathaSqft) || !isPositive(bighaSqft)) {
      return DEFAULT_RATES;
    }
    return { kathaSqft, bighaSqft };
  } catch {
    return DEFAULT_RATES;
  }
}

/** Upsert the singleton rates row. Throws RangeError on non-positive input. */
export function setRates(r: Rates): void {
  if (!isPositive(r.kathaSqft) || !isPositive(r.bighaSqft)) {
    throw new RangeError("setRates: rates must be positive");
  }
  ensureRatesTable();
  getDb().runSync(
    "INSERT OR REPLACE INTO rates (id, katha_sqft, bigha_sqft, updated_at) VALUES (1, ?, ?, ?)",
    [toDecimalString(r.kathaSqft, 6), toDecimalString(r.bighaSqft, 6), Date.now()],
  );
}

/** Delete the singleton rates row (reads fall back to defaults). */
export function resetRates(): void {
  ensureRatesTable();
  getDb().runSync("DELETE FROM rates WHERE id = 1");
}
