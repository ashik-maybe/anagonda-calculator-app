import bnDict from "../i18n/bn.json";
import enDict from "../i18n/en.json";
import { add, ZERO, type Fraction } from "./fraction";
import { shapeKey, type ShapeId } from "./shapes";
import type { Locale } from "./i18n";

/** One measured plot in the in-memory worksheet. */
export type Plot = { id: string; shape: ShapeId; areaSqft: Fraction };

const dicts: Record<Locale, Record<string, string>> = {
  bn: bnDict as Record<string, string>,
  en: enDict as Record<string, string>,
};

/** Exact sum of every plot's area, in square feet. Empty worksheet is zero. */
export function totalArea(plots: readonly Plot[]): Fraction {
  return plots.reduce((sum, plot) => add(sum, plot.areaSqft), ZERO);
}

/** Localized shape name for a worksheet row; deterministic per locale. */
export function plotLabel(plot: Plot, locale: Locale): string {
  const key = `shape_${shapeKey(plot.shape)}`;
  return dicts[locale][key] ?? dicts.en[key] ?? key;
}
