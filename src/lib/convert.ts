import { fromAnyDigits } from "./digits";
import { formatLand } from "./deed";
import { div, parseDecimal, type Fraction } from "./fraction";
import { absoluteUnitIds, convert as convertUnit, type Rates } from "./units";
import type { AbsoluteUnitId } from "./units";

export type UnitId = AbsoluteUnitId;

/** Grouped integer part (lakh or western style): "1,440", "1,44,000", "12,340,000". */
const GROUPED_INT = /^\d{1,3}(,\d{2}|,\d{3})*$/;

export function parseInput(raw: string): Fraction | null {
  const cleaned = fromAnyDigits(raw).trim();
  if (cleaned === "") return null;
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");
    if (parts.length !== 2) return null;
    const a = parseDecimal(parts[0]);
    const b = parseDecimal(parts[1]);
    if (!a || !b || b.num === 0n) return null;
    const f = div(a, b);
    if (f.num < 0n) return null;
    return f;
  }
  if (cleaned.includes(",")) {
    const m = /^(\d+(?:,\d+)*)(?:\.(\d*))?$/.exec(cleaned);
    if (!m) return null;
    if (!GROUPED_INT.test(m[1])) return null;
    return parseInput(`${m[1].replace(/,/g, "")}${m[2] === undefined ? "" : `.${m[2]}`}`);
  }
  const f = parseDecimal(cleaned);
  if (!f) return null;
  if (f.num < 0n) return null;
  return f;
}

export function convertTable(
  value: Fraction,
  from: UnitId,
  rates: Rates,
  locale: "bn" | "en",
  kaniSqft?: Fraction,
): { unit: UnitId; value: string }[] {
  return absoluteUnitIds.map((unit) => {
    const converted = convertUnit(value, from, unit, rates, kaniSqft);
    return { unit, value: formatLand(converted, 2, locale) };
  });
}
