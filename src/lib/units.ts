import raw from "../data/units.json";
import { div, frac, mul, parseDecimal, type Fraction } from "./fraction";

export type AbsoluteUnitId =
  | "sqft"
  | "shoto"
  | "katha"
  | "chotak"
  | "bigha"
  | "acre"
  | "hectare"
  | "sqm"
  | "sqyard"
  | "sqhat"
  | "sqlink"
  | "kani"
  | "gonda"
  | "kora"
  | "kranti"
  | "til"
  | "shatak";

export type Rates = {
  readonly kathaSqft: Fraction;
  readonly bighaSqft: Fraction;
};

export const DEFAULT_RATES: Rates = {
  kathaSqft: frac(720),
  bighaSqft: frac(14400),
};

export const SHARE_CHAIN = {
  whole: 16,
  perAna: { gonda: 20, kora: 80, kranti: 240, til: 4800 },
} as const;

export const absoluteUnitIds: readonly AbsoluteUnitId[] = raw.absolute.map(
  (row) => row.id as AbsoluteUnitId,
);

function parseStrict(s: string): Fraction {
  const f = parseDecimal(s);
  if (!f) throw new Error("units.json: unparseable factor " + s);
  return f;
}

// Parse every base factor once at module load: a malformed units.json fails
// fast here instead of on first use.
const baseFactors = new Map<AbsoluteUnitId, Fraction>(
  raw.absolute
    .filter((row) => typeof row.sqft === "string")
    .map((row) => [row.id as AbsoluteUnitId, parseStrict(row.sqft as string)]),
);

export const CHAIN_FT: Fraction = parseStrict(raw.chain.ft);
export const CHAIN_LINKS: number = raw.chain.links;
export const LINK_FT: Fraction = parseStrict(raw.chain.linkFt);
export const GUNIA_LINKS_PER_MILE: Fraction = parseStrict(raw.gunia.linksPerMile);
export const GUNIA_SCALE_LINKS_PER_INCH: Readonly<Record<string, number>> =
  raw.gunia.scaleLinksPerInch;

export function unitFactor(
  id: AbsoluteUnitId,
  rates: Rates = DEFAULT_RATES,
  kaniSqft?: Fraction,
): Fraction {
  // Kani has two conventions in use (17,280 sqft / 17,424 sqft); callers may override.
  if (id === "kani" && kaniSqft) return kaniSqft;
  const row = raw.absolute.find((r) => r.id === id) as
    | { id: string; rateId?: string; divideBy?: number }
    | undefined;
  if (!row) throw new RangeError("unitFactor: unknown unit id " + id);
  if (row.divideBy) {
    const baseId = row.rateId as AbsoluteUnitId;
    return div(unitFactor(baseId, rates), frac(row.divideBy));
  }
  if (row.rateId === "katha") return rates.kathaSqft;
  if (row.rateId === "bigha") return rates.bighaSqft;
  const factor = baseFactors.get(id);
  if (!factor) throw new RangeError("unitFactor: missing factor for " + id);
  return factor;
}

export function convert(
  value: Fraction,
  from: AbsoluteUnitId,
  to: AbsoluteUnitId,
  rates: Rates = DEFAULT_RATES,
  kaniSqft?: Fraction,
): Fraction {
  return div(mul(value, unitFactor(from, rates, kaniSqft)), unitFactor(to, rates, kaniSqft));
}

export function guniaInchToLinks(inchScale: number): number | null {
  const links = GUNIA_SCALE_LINKS_PER_INCH[String(inchScale)];
  return links === undefined ? null : links;
}
