import { describe, expect, test } from "bun:test";
import glossary from "./glossary.json";

describe("glossary data", () => {
  test("has the frozen term set (9 khatian + 6 symbol guide)", () => {
    expect(glossary.terms.map((t) => t.id)).toEqual([
      "cs_khatian",
      "sa_khatian",
      "rs_khatian",
      "bs_khatian",
      "dag",
      "mouja",
      "namjari",
      "deed",
      "khatian",
      "ana_glyphs",
      "sym_kora",
      "sym_kranti",
      "gonda_note",
      "til_note",
      "sixteen_ana",
    ]);
  });

  test("every term has unique id and all required bn/en fields", () => {
    const ids = glossary.terms.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const term of glossary.terms) {
      expect(term.term_bn.length).toBeGreaterThan(0);
      expect(term.term_en.length).toBeGreaterThan(0);
      expect(term.code.length).toBeGreaterThan(0);
      expect(term.def_bn.length).toBeGreaterThan(0);
      expect(term.def_en.length).toBeGreaterThan(0);
    }
  });

  test("symbol guide terms carry the actual glyphs", () => {
    const byId = new Map(glossary.terms.map((t) => [t.id, t.code]));
    expect(byId.get("ana_glyphs")).toContain("⁄");
    expect(byId.get("sym_kora")).toContain("৸");
    expect(byId.get("sym_kranti")).toContain("৴৴");
    expect(glossary.terms.find((t) => t.id === "sixteen_ana")?.def_bn).toContain("১৭,২৮০");
  });
});
