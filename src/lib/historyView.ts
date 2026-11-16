import bnDict from "../i18n/bn.json";
import enDict from "../i18n/en.json";
import { buildDeedResult, formatLand, type DeedResult } from "./deed";
import { decomposeShare, formatChain, formatShareChain, type ChainLabels } from "./decomposition";
import { toBanglaDigits } from "./digits";
import {
  cmp,
  frac,
  parseDecimal,
  toDecimalString,
  toRatioString,
  ZERO,
  type Fraction,
} from "./fraction";
import { SHAPE_ORDER, shapeKey, type ShapeId } from "./shapes";
import type { HistoryEntry } from "./storage";
import { convert } from "./units";

// Deterministic per call: no global locale state, so tests are stable.
const dicts = {
  bn: bnDict as Record<string, string>,
  en: enDict as Record<string, string>,
};
const localize = (locale: "bn" | "en", key: string): string =>
  dicts[locale][key] ?? dicts.en[key] ?? key;

const digitsFor = (locale: "bn" | "en", s: string): string =>
  locale === "bn" ? toBanglaDigits(s) : s;

const asFraction = (v: unknown): Fraction | null => {
  if (typeof v !== "object" || v === null) return null;
  const { num, den } = v as { num?: unknown; den?: unknown };
  if (typeof num !== "string" || typeof den !== "string") return null;
  try {
    return frac(BigInt(num), BigInt(den));
  } catch {
    return null;
  }
};

/**
 * Rebuild the exact-fraction deed view model from a stored history row.
 * Returns null on any malformed (hand-edited / legacy) row — callers render
 * a generic fallback instead of crashing.
 */
export function entryToDeed(entry: HistoryEntry, locale: "bn" | "en"): DeedResult | null {
  try {
    const input = JSON.parse(entry.inputJson) as { totalShoto?: unknown };
    const result = JSON.parse(entry.resultJson) as {
      share?: unknown;
      area?: unknown;
    };
    if (typeof input.totalShoto !== "string") return null;
    const total = parseDecimal(input.totalShoto);
    if (!total || total.num <= 0n) return null;
    const share = asFraction(result.share);
    const area = asFraction(result.area);
    if (!share || !area) return null;
    return buildDeedResult(
      { totalShoto: total, share, shareArea: area, chain: decomposeShare(share) },
      locale,
    );
  } catch {
    return null;
  }
}

/** Preformatted date for the row meta line; locale-correct script + calendar. */
export function formatEntryDate(createdAt: number, locale: "bn" | "en"): string {
  const tag = locale === "bn" ? "bn-BD" : "en-US";
  return new Date(createdAt).toLocaleDateString(tag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type HistoryRowView = {
  readonly title: string;
  readonly subtitle: string;
};

const chainLabels = (locale: "bn" | "en"): ChainLabels => ({
  ana: localize(locale, "ana"),
  gonda: localize(locale, "gonda"),
  kora: localize(locale, "kora"),
  kranti: localize(locale, "kranti"),
  til: localize(locale, "til"),
});

/** "মালিক ১" (bn) / "owner 1" (en): substitutes {n} or appends the count. */
const ownerCountText = (locale: "bn" | "en", n: number): string => {
  const count = digitsFor(locale, String(n));
  const template = localize(locale, "owner_count");
  return template.includes("{n}") ? template.replace("{n}", count) : `${template} ${count}`;
};

const fallbackRow = (locale: "bn" | "en"): HistoryRowView => ({
  title: localize(locale, "history"),
  subtitle: localize(locale, "history_empty"),
});

const hishabRow = (entry: HistoryEntry, locale: "bn" | "en"): HistoryRowView => {
  const deed = entryToDeed(entry, locale);
  if (!deed) return fallbackRow(locale);
  return {
    title: deed.chainText,
    subtitle: `${deed.areaText} ${localize(locale, "unit_shoto")} · ${deed.ratioText}`,
  };
};

const bontonRow = (entry: HistoryEntry, locale: "bn" | "en"): HistoryRowView => {
  try {
    const input = JSON.parse(entry.inputJson) as { totalShoto?: unknown; owners?: unknown };
    const result = JSON.parse(entry.resultJson) as { sum?: unknown; owners?: unknown };
    if (typeof input.totalShoto !== "string") return fallbackRow(locale);
    const total = parseDecimal(input.totalShoto);
    if (!total || total.num <= 0n) return fallbackRow(locale);
    const sum = asFraction(result.sum);
    if (!sum) return fallbackRow(locale);

    const labels = chainLabels(locale);
    const resultOwners = Array.isArray(result.owners) ? result.owners : null;
    const inputOwners = Array.isArray(input.owners) ? input.owners : null;
    const chains = resultOwners
      ? resultOwners.map((o) => {
          const share = asFraction((o as { share?: unknown } | null)?.share);
          return share ? formatChain(decomposeShare(share), labels, locale) : null;
        })
      : null;
    if (chains !== null && chains.some((chain) => chain === null)) return fallbackRow(locale);

    const ownerCount = chains !== null ? chains.length : (inputOwners?.length ?? 0);
    if (ownerCount === 0) return fallbackRow(locale);

    return {
      title: formatShareChain(sum, labels, locale),
      subtitle: `${ownerCountText(locale, ownerCount)} · ${formatLand(total, 2, locale)} ${localize(
        locale,
        "unit_shoto",
      )}`,
    };
  } catch {
    return fallbackRow(locale);
  }
};

const reverseRow = (entry: HistoryEntry, locale: "bn" | "en"): HistoryRowView => {
  try {
    const input = JSON.parse(entry.inputJson) as {
      area?: unknown;
      unit?: unknown;
      totalShoto?: unknown;
    };
    const result = JSON.parse(entry.resultJson) as { share?: unknown; area?: unknown };
    if (
      typeof input.area !== "string" ||
      typeof input.unit !== "string" ||
      typeof input.totalShoto !== "string"
    ) {
      return fallbackRow(locale);
    }
    const total = parseDecimal(input.totalShoto);
    if (!total || total.num <= 0n) return fallbackRow(locale);
    const share = asFraction(result.share);
    const area = asFraction(result.area);
    if (!share || !area) return fallbackRow(locale);

    const labels = chainLabels(locale);
    return {
      title: formatShareChain(share, labels, locale),
      subtitle: `${digitsFor(locale, toRatioString(share))} · ${digitsFor(
        locale,
        toDecimalString(area, 2),
      )} ${localize(locale, "unit_shoto")}`,
    };
  } catch {
    return fallbackRow(locale);
  }
};

const porimapRow = (entry: HistoryEntry, locale: "bn" | "en"): HistoryRowView => {
  try {
    const input = JSON.parse(entry.inputJson) as { shape?: unknown };
    const result = JSON.parse(entry.resultJson) as { area?: unknown };
    const shape = input.shape;
    if (typeof shape !== "string" || !SHAPE_ORDER.includes(shape as ShapeId)) {
      return fallbackRow(locale);
    }
    if (typeof result.area !== "string") return fallbackRow(locale);
    const area = parseDecimal(result.area);
    if (!area || cmp(area, ZERO) < 0) return fallbackRow(locale);

    return {
      title: `${localize(locale, "shape_" + shapeKey(shape as ShapeId))}: ${formatLand(area, 2, locale)} ${localize(
        locale,
        "unit_sqft",
      )}`,
      subtitle: `${formatLand(convert(area, "sqft", "sqm"), 2, locale)} ${localize(
        locale,
        "unit_sqm",
      )}`,
    };
  } catch {
    return fallbackRow(locale);
  }
};

/**
 * Uniform history row rendering for every stored mode.
 * hishab: deed-based row; bonton: ledger-sum based row; reverse: share chain.
 * locale-keyed; never throws (fallback row on malformed data).
 */
export function entryToRow(entry: HistoryEntry, locale: "bn" | "en"): HistoryRowView {
  if (entry.mode === "porimap") return porimapRow(entry, locale);
  if (entry.mode === "reverse") return reverseRow(entry, locale);
  return entry.mode === "bonton" ? bontonRow(entry, locale) : hishabRow(entry, locale);
}
