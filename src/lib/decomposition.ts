import bnDict from "../i18n/bn.json";
import enDict from "../i18n/en.json";
import { anaGlyph, koraGlyph, krantiGlyph } from "../data/glyphs";
import { toBanglaDigits } from "./digits";
import { formatLand } from "./deed";
import { frac, mul, div, sub, toRatioString, type Fraction } from "./fraction";
import {
  convert,
  unitFactor,
  DEFAULT_RATES,
  SHARE_CHAIN,
  type AbsoluteUnitId,
  type Rates,
} from "./units";
import { tilToParts, partsToTil, type AnaParts } from "./share";

/** Greedy largest-first decomposition of a share-of-whole into the ana chain. */
export type ChainDecomposition = AnaParts & {
  /** Leftover fraction of one til when the share is not chain-integral. */
  readonly remainderTil: Fraction;
};

const TIL_PER_WHOLE = SHARE_CHAIN.whole * SHARE_CHAIN.perAna.til; // 76800

export function decomposeShare(share: Fraction): ChainDecomposition {
  if (share.num < 0n) {
    throw new RangeError("decomposeShare: negative share");
  }
  const scaled = mul(share, frac(TIL_PER_WHOLE)); // exact til count
  const wholeTil = scaled.num / scaled.den; // floor for non-negative
  const remainderTil = sub(scaled, frac(wholeTil));
  return { ...tilToParts(wholeTil), remainderTil };
}

export type ReverseShareResult = {
  /** Area converted to shoto (exact). */
  readonly areaShoto: Fraction;
  /** A / T, exact fraction of the whole. */
  readonly share: Fraction;
  readonly chain: ChainDecomposition;
};

/**
 * বিপরীত: given an area in any absolute unit plus the target total T in
 * shoto, recover the share fraction and its greedy ana-chain form.
 * Throws RangeError when totalShoto is zero.
 */
export function reverseShare(
  area: Fraction,
  unit: AbsoluteUnitId,
  totalShoto: Fraction,
  rates: Rates = DEFAULT_RATES,
): ReverseShareResult {
  if (totalShoto.num === 0n) {
    throw new RangeError("reverseShare: total must not be zero");
  }
  const areaShoto = convert(area, unit, "shoto", rates);
  const share = div(areaShoto, totalShoto);
  return { areaShoto, share, chain: decomposeShare(share) };
}

export type SqftBreakdown = {
  readonly bigha: number;
  readonly katha: number;
  readonly shoto: number;
  readonly remainderSqft: Fraction;
};

/** Greedy sqft -> bigha / katha / shoto / remainder (rates-aware). */
export function sqftToKathaBighaShoto(sqft: Fraction, rates: Rates = DEFAULT_RATES): SqftBreakdown {
  if (sqft.num < 0n) {
    throw new RangeError("sqftToKathaBighaShoto: negative area");
  }
  let rem = sqft;
  const take = (factor: Fraction): number => {
    const n = div(rem, factor);
    const whole = n.num / n.den;
    rem = sub(rem, mul(frac(whole), factor));
    return Number(whole);
  };
  const bigha = take(rates.bighaSqft);
  const katha = take(rates.kathaSqft);
  const shoto = take(unitFactor("shoto"));
  return { bigha, katha, shoto, remainderSqft: rem };
}

export type AreaDecomposition = {
  /** Greedy bigha count, 2dp, locale digits. */
  readonly bigha: string;
  /** Greedy katha count (20 per bigha), 2dp, locale digits. */
  readonly katha: string;
  /** Greedy chotak count (16 per katha), 2dp, locale digits. */
  readonly chotak: string;
  /** Leftover square feet, 2dp, locale digits. */
  readonly sqft: string;
};

/** Greedy sqft -> bigha (20 katha) / katha (16 chotak) / chotak / remainder, rates-aware. */
export function decomposeArea(
  areaSqft: Fraction,
  rates: Rates,
  locale: "bn" | "en",
): AreaDecomposition {
  if (areaSqft.num < 0n) {
    throw new RangeError("decomposeArea: negative area");
  }
  let rem = areaSqft;
  const take = (factor: Fraction): Fraction => {
    const n = div(rem, factor);
    const whole = n.num / n.den; // floor for non-negative
    rem = sub(rem, mul(frac(whole), factor));
    return frac(whole);
  };
  const bigha = take(rates.bighaSqft);
  const katha = take(rates.kathaSqft);
  const chotak = take(unitFactor("chotak", rates));
  return {
    bigha: formatLand(bigha, 2, locale),
    katha: formatLand(katha, 2, locale),
    chotak: formatLand(chotak, 2, locale),
    sqft: formatLand(rem, 2, locale),
  };
}

export type ChainLabels = {
  readonly ana: string;
  readonly gonda: string;
  readonly kora: string;
  readonly kranti: string;
  readonly til: string;
};

export type DigitLocale = "bn" | "en";

const digitize = (n: number, locale: DigitLocale): string =>
  locale === "bn" ? toBanglaDigits(n) : String(n);

const dicts = {
  bn: bnDict as Record<string, string>,
  en: enDict as Record<string, string>,
};
const localize = (locale: DigitLocale, key: string): string =>
  dicts[locale][key] ?? dicts.en[key] ?? key;

const digitsFor = (locale: DigitLocale, s: string): string =>
  locale === "bn" ? toBanglaDigits(s) : s;

/** Document-style glyph form (ana glyph + numeric gonda + kora/kranti glyphs + til number). */
export function chainGlyphText(d: ChainDecomposition, locale: DigitLocale = "bn"): string {
  const glyphParts: string[] = [];
  const ag = anaGlyph(d.ana);
  if (ag) glyphParts.push(ag);
  else if (d.ana === 0) glyphParts.push(`${digitsFor(locale, "0")} ${localize(locale, "ana")}`);
  if (d.gonda > 0)
    glyphParts.push(`${digitsFor(locale, String(d.gonda))} ${localize(locale, "gonda")}`);
  const kg = koraGlyph(d.kora);
  if (kg) glyphParts.push(kg);
  else if (d.kora > 0)
    glyphParts.push(`${digitsFor(locale, String(d.kora))} ${localize(locale, "kora")}`);
  const krg = krantiGlyph(d.kranti);
  if (krg) glyphParts.push(krg);
  else if (d.kranti > 0)
    glyphParts.push(`${digitsFor(locale, String(d.kranti))} ${localize(locale, "kranti")}`);
  if (d.til > 0) glyphParts.push(`${digitsFor(locale, String(d.til))} ${localize(locale, "til")}`);
  return glyphParts.join(" ");
}

/**
 * Exact ana-chain display string, largest unit first, zero components
 * omitted (ana shown even when zero so an empty share reads "0 ana").
 * Non-chain-integral shares append the leftover til fraction in parens.
 */
export function formatChain(
  d: ChainDecomposition,
  labels: ChainLabels,
  locale: DigitLocale = "bn",
): string {
  const comps: string[] = [];
  const push = (v: number, label: string) => {
    if (v > 0 || comps.length === 0) {
      comps.push(`${digitize(v, locale)} ${label}`);
    }
  };
  push(d.ana, labels.ana);
  push(d.gonda, labels.gonda);
  push(d.kora, labels.kora);
  push(d.kranti, labels.kranti);
  push(d.til, labels.til);
  if (d.remainderTil.num !== 0n) {
    comps.push(`+ ${toRatioString(d.remainderTil)} ${labels.til}`);
  }
  return comps.join(" ");
}

/** Convenience: decompose and format in one call. */
export function formatShareChain(
  share: Fraction,
  labels: ChainLabels,
  locale: DigitLocale = "bn",
): string {
  return formatChain(decomposeShare(share), labels, locale);
}

export { partsToTil };
