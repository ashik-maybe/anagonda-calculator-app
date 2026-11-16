import { cmp, frac, ZERO, type Fraction } from "./fraction";
import { partsToTil, WHOLE_TIL, type AnaParts } from "./share";

export const MAX_OWNERS = 10;

export type SumState = "under" | "equal" | "over";

/** Σ of owner shares as a fraction of the whole (exact). Empty list -> ZERO. */
export function sumShares(list: readonly Partial<AnaParts>[]): Fraction {
  if (list.length === 0) return ZERO;
  const acc = list.reduce(
    (acc, p) =>
      acc +
      partsToTil({
        ana: p.ana ?? 0,
        gonda: p.gonda ?? 0,
        kora: p.kora ?? 0,
        kranti: p.kranti ?? 0,
        til: p.til ?? 0,
      }),
    0n,
  );
  return frac(acc, WHOLE_TIL);
}

export function sumState(sum: Fraction): SumState {
  const c = cmp(sum, frac(1));
  return c < 0 ? "under" : c > 0 ? "over" : "equal";
}

export type OwnerShareRow = {
  readonly name: string;
  readonly chainText: string;
  readonly areaText: string; // shoto, 2dp, locale digits, NO unit label appended
};

export type ShareTextOptions = {
  readonly totalText: string; // e.g. "১০০.০০"
  readonly sumChainText: string; // e.g. "১৬ আনা"
  readonly state: SumState;
  readonly locale: "bn" | "en";
  readonly unitLabel: string; // "শতাংশ" / "shoto"
  readonly ownerCount: string; // "{n}" replaced
};

/**
 * Ledger share text (spec format):
 *   "<totalText> <unitLabel> — <sumChainText>"
 *   "<name> — <chainText> — <areaText> <unitLabel> — ✓|✗"
 *   ...
 *   "<sumChainText> ${checkMarker}"
 * Check marker: ✓ when state === "equal", ✗ when "over", … when "under".
 * Join lines with "\n". Names with empty string -> ownerCount (with {n} -> index replaced, locale digits if bn).
 */
export function buildBontonShareText(
  rows: readonly OwnerShareRow[],
  opts: ShareTextOptions,
): string {
  const { totalText, sumChainText, state, locale, unitLabel, ownerCount } = opts;

  const checkMarker = state === "equal" ? "✓" : state === "over" ? "✗" : "…";

  const digitize = (n: number): string => {
    if (locale === "bn") {
      const bangla = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return String(n).replace(/[0-9]/g, (d) => bangla[Number(d)]);
    }
    return String(n);
  };

  const lines: string[] = [];
  lines.push(`${totalText} ${unitLabel} — ${sumChainText}`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let displayName = row.name;
    if (displayName === "") {
      displayName = ownerCount.replace("{n}", digitize(i + 1));
      if (displayName === "") {
        displayName = "-owner";
      }
    }
    lines.push(`${displayName} — ${row.chainText} — ${row.areaText} ${unitLabel} — ${checkMarker}`);
  }

  lines.push(`${sumChainText} ${checkMarker}`);

  return lines.join("\n");
}
