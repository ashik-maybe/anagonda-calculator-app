import glossary from "../data/glossary.json";

export type GlossaryCategory = "record" | "landclass" | "share" | "tax" | "transfer";

export type Term = {
  id: string;
  term_bn: string;
  term_en: string;
  code: string;
  def_bn: string;
  def_en: string;
  category: GlossaryCategory;
  aliases?: string[];
};

export const GLOSSARY_CATEGORIES: { key: GlossaryCategory; labelKey: string }[] = [
  { key: "record", labelKey: "glossary_cat_record" },
  { key: "landclass", labelKey: "glossary_cat_landclass" },
  { key: "share", labelKey: "glossary_cat_share" },
  { key: "tax", labelKey: "glossary_cat_tax" },
  { key: "transfer", labelKey: "glossary_cat_transfer" },
];

const VALID_CATEGORIES = new Set<string>(GLOSSARY_CATEGORIES.map((c) => c.key));

export function categoryLabelKey(cat: GlossaryCategory): string {
  return GLOSSARY_CATEGORIES.find((c) => c.key === cat)?.labelKey ?? "glossary_cat_record";
}

const terms = glossary.terms as unknown as Term[];

export function allTerms(): Term[] {
  return terms;
}

export function termsByCategory(cat: GlossaryCategory): Term[] {
  return terms.filter((term) => term.category === cat);
}

export function searchTerms(q: string): Term[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return terms;
  return terms.filter((term) =>
    [term.term_bn, term.term_en, term.code, term.def_bn, term.def_en, ...(term.aliases ?? [])]
      .join("\n")
      .toLowerCase()
      .includes(needle),
  );
}

export function isValidCategory(category: string): category is GlossaryCategory {
  return VALID_CATEGORIES.has(category);
}
