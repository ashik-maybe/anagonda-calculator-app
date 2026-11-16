import { describe, expect, test } from "bun:test";
import {
  ANA_GLYPHS,
  KORA_GLYPHS,
  KRANTI_GLYPHS,
  anaGlyph,
  koraGlyph,
  krantiGlyph,
} from "../data/glyphs";

describe("glyphs data", () => {
  test("16 ana glyphs, 1..16, unique", () => {
    expect(ANA_GLYPHS.length).toBe(16);
    const anas = ANA_GLYPHS.map((g) => g.ana);
    expect(new Set(anas).size).toBe(16);
    expect(Math.min(...anas)).toBe(1);
    expect(Math.max(...anas)).toBe(16);
  });
  test("3 kora glyphs, 3 kranti? 2 kranti glyphs", () => {
    expect(KORA_GLYPHS.length).toBe(3);
    expect(KRANTI_GLYPHS.length).toBe(2);
  });
  test("helpers resolve", () => {
    expect(anaGlyph(1)).toBe("⁄");
    expect(anaGlyph(16)).toBe("১৬");
    expect(anaGlyph(0)).toBeNull();
    expect(koraGlyph(2)).toBe("৷৷");
    expect(krantiGlyph(1)).toBe("৴");
  });
});
