/**
 * Structured form of the ana/kora/kranti glyphs documented in the glossary
 * ("ana_glyphs", "sym_kora", "sym_kranti"). Used by the hisab result card
 * (document-comparable form) and the glyph keypad (tap-to-enter for users
 * who cannot read the glyphs).
 *
 * Source of truth: src/data/glossary.json. Keep these in sync.
 */

export type AnaGlyph = {
  /** 1..16 ana. */
  readonly ana: number;
  /** The glyph(s) written in a deed for that ana count. */
  readonly glyph: string;
  /** True when the entry is the numeral ১৬ rather than a glyph. */
  readonly isNumeral?: boolean;
};

export type KoraGlyph = {
  readonly kora: number;
  readonly glyph: string;
};

export type KrantiGlyph = {
  readonly kranti: number;
  readonly glyph: string;
};

export const ANA_GLYPHS: readonly AnaGlyph[] = [
  { ana: 1, glyph: "⁄" },
  { ana: 2, glyph: "৵" },
  { ana: 3, glyph: "৶" },
  { ana: 4, glyph: "৷" },
  { ana: 5, glyph: "৷⁄" },
  { ana: 6, glyph: "৷৵" },
  { ana: 7, glyph: "৷৶" },
  { ana: 8, glyph: "৷৷" },
  { ana: 9, glyph: "৷৷⁄" },
  { ana: 10, glyph: "৷৷৵" },
  { ana: 11, glyph: "৷৷৶" },
  { ana: 12, glyph: "৸" },
  { ana: 13, glyph: "৸⁄" },
  { ana: 14, glyph: "৸৵" },
  { ana: 15, glyph: "৸৶" },
  { ana: 16, glyph: "১৬", isNumeral: true },
];

export const KORA_GLYPHS: readonly KoraGlyph[] = [
  { kora: 1, glyph: "৷" },
  { kora: 2, glyph: "৷৷" },
  { kora: 3, glyph: "৸" },
];

export const KRANTI_GLYPHS: readonly KrantiGlyph[] = [
  { kranti: 1, glyph: "৴" },
  { kranti: 2, glyph: "৴৴" },
];

export function anaGlyph(ana: number): string | null {
  return ANA_GLYPHS.find((g) => g.ana === ana)?.glyph ?? null;
}

export function koraGlyph(kora: number): string | null {
  return KORA_GLYPHS.find((g) => g.kora === kora)?.glyph ?? null;
}

export function krantiGlyph(kranti: number): string | null {
  return KRANTI_GLYPHS.find((g) => g.kranti === kranti)?.glyph ?? null;
}
