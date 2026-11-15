import bnDict from "../i18n/bn.json";
import enDict from "../i18n/en.json";
import { formatChain, type ChainDecomposition, type ChainLabels } from "./decomposition";
import { groupDigits, toBanglaDigits } from "./digits";
import { div, mul, toDecimalString, toRatioString, type Fraction } from "./fraction";
import { unitFactor, DEFAULT_RATES, type Rates, type AbsoluteUnitId } from "./units";

// Deterministic per call: no global locale state, so tests are stable.
const dicts = {
  bn: bnDict as Record<string, string>,
  en: enDict as Record<string, string>,
};
const localize = (locale: "bn" | "en", key: string): string =>
  dicts[locale][key] ?? dicts.en[key] ?? key;

const digitsFor = (locale: "bn" | "en", s: string): string =>
  locale === "bn" ? toBanglaDigits(s) : s;

/** Format a fraction-of-shoto/decimal exactly at dp with locale digits + grouping. */
export function formatLand(f: Fraction, dp: number, locale: "bn" | "en"): string {
  return digitsFor(locale, groupDigits(toDecimalString(f, dp), locale));
}

export type StripUnit = Extract<AbsoluteUnitId, "shoto" | "katha" | "bigha" | "acre">;

export type ConversionStripItem = {
  readonly unit: StripUnit;
  /** 2dp, locale digits + grouping. */
  readonly value: string;
};

export type DeedResult = {
  /** "১০০.০০" (bn) / "100.00" (en): total shoto, 2dp, grouped. */
  readonly totalText: string;
  /** Greedy chain, locale digits, e.g. "৮ আনা ১০ গন্ডা". */
  readonly chainText: string;
  /** "১/২" / "1/2": exact p/q share of the whole. */
  readonly ratioText: string;
  /** Exact area 2dp, grouped, locale digits. */
  readonly areaText: string;
  readonly strip: readonly ConversionStripItem[];
  /** Full deed sentence for copy/share (text-only share). */
  readonly sentence: string;
};

export type DeedInput = {
  readonly totalShoto: Fraction;
  readonly share: Fraction;
  readonly shareArea: Fraction;
  readonly chain: ChainDecomposition;
  readonly rates?: Rates;
};

const STRIP_UNITS: readonly StripUnit[] = ["shoto", "katha", "bigha", "acre"];

export function conversionStrip(
  areaShoto: Fraction,
  rates: Rates = DEFAULT_RATES,
  locale: "bn" | "en" = "bn",
): ConversionStripItem[] {
  // Unit factors in units.json are square feet; go shoto -> sqft first.
  const sqft = mul(areaShoto, unitFactor("shoto"));
  return STRIP_UNITS.map((unit) => ({
    unit,
    value: formatLand(div(sqft, unitFactor(unit, rates)), 2, locale),
  }));
}

export function buildDeedResult(input: DeedInput, locale: "bn" | "en" = "bn"): DeedResult {
  const rates = input.rates ?? DEFAULT_RATES;
  const labels: ChainLabels = {
    ana: localize(locale, "ana"),
    gonda: localize(locale, "gonda"),
    kora: localize(locale, "kora"),
    kranti: localize(locale, "kranti"),
    til: localize(locale, "til"),
  };
  const totalText = formatLand(input.totalShoto, 2, locale);
  const chainText = formatChain(input.chain, labels, locale);
  const ratioText = digitsFor(locale, toRatioString(input.share));
  const areaText = formatLand(input.shareArea, 2, locale);
  const strip = conversionStrip(input.shareArea, rates, locale);
  const sentence = localize(locale, "deed_template")
    .replace("{total}", totalText)
    .replace("{chain}", chainText)
    .replace("{area}", areaText)
    .replace("{ratio}", ratioText);
  return { totalText, chainText, ratioText, areaText, strip, sentence };
}
