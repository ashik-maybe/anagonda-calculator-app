import { buildDeedResult, type DeedResult } from "./deed";
import { decomposeShare } from "./decomposition";
import { frac, parseDecimal, type Fraction } from "./fraction";
import type { HistoryEntry } from "./storage";

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
