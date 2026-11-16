import { fromAnyDigits } from "./digits";
import { formatLand } from "./deed";
import { parseDecimal, type Fraction } from "./fraction";
import { absoluteUnitIds, convert as convertUnit, type Rates } from "./units";
import type { AbsoluteUnitId } from "./units";

export type UnitId = AbsoluteUnitId;

export function parseInput(raw: string): Fraction | null {
  const cleaned = fromAnyDigits(raw).trim();
  if (cleaned === "") return null;
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
): { unit: UnitId; value: string }[] {
  return absoluteUnitIds.map((unit) => {
    const converted = convertUnit(value, from, unit, rates);
    return { unit, value: formatLand(converted, 2, locale) };
  });
}
