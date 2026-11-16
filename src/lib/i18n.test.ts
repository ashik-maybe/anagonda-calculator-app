import { describe, expect, test } from "bun:test";
import bnRaw from "../i18n/bn.json";
import enRaw from "../i18n/en.json";
import { absoluteUnitIds } from "./units";
import { SHAPE_ORDER, SHAPE_FIELDS, shapeKey } from "./shapes";

const bn = bnRaw as Record<string, string>;
const en = enRaw as Record<string, string>;

describe("i18n dictionaries", () => {
  test("bn and en key sets are identical", () => {
    const bnKeys = Object.keys(bn);
    const enKeys = Object.keys(en);
    expect(bnKeys.length).toBe(enKeys.length);
    expect(bnKeys.every((k) => k in en)).toBe(true);
  });

  test("every shape has a display-name key in both locales", () => {
    for (const id of SHAPE_ORDER) {
      const key = `shape_${shapeKey(id)}`;
      expect(key in bn, `${key} missing in bn`).toBe(true);
      expect(key in en, `${key} missing in en`).toBe(true);
    }
  });

  test("every shape field has a display-name key in both locales", () => {
    const seen = new Set<string>();
    for (const id of SHAPE_ORDER) {
      for (const field of SHAPE_FIELDS[id]) {
        seen.add(field);
      }
    }
    for (const field of seen) {
      const key = `field_${field}`;
      expect(key in bn, `${key} missing in bn`).toBe(true);
      expect(key in en, `${key} missing in en`).toBe(true);
    }
  });

  test("every absolute unit has a display-name key in both locales", () => {
    for (const id of absoluteUnitIds) {
      const key = `unit_${id}`;
      expect(key in bn, `${key} missing in bn`).toBe(true);
      expect(key in en, `${key} missing in en`).toBe(true);
      expect(typeof bn[key]).toBe("string");
      expect(typeof en[key]).toBe("string");
    }
  });

  test("source and disclaimer keys present", () => {
    for (const key of [
      "unit_source",
      "unit_as_of",
      "deed_document_governs",
      "rate_default",
      "rate_custom",
    ]) {
      expect(key in bn).toBe(true);
      expect(key in en).toBe(true);
    }
  });

  test("no empty strings", () => {
    for (const [locale, dict] of [
      ["bn", bn],
      ["en", en],
    ] as const) {
      for (const [k, v] of Object.entries(dict)) {
        expect(v.trim().length > 0, `${locale}:${k} empty`).toBe(true);
      }
    }
  });
});
