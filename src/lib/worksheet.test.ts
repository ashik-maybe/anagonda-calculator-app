import { describe, expect, test } from "bun:test";
import { frac, ZERO, type Fraction } from "./fraction";
import { plotLabel, totalArea, type Plot } from "./worksheet";

const plot = (id: string, areaSqft: Fraction, shape: Plot["shape"] = "rectangle"): Plot => ({
  id,
  shape,
  areaSqft,
});

describe("worksheet", () => {
  test("empty worksheet totals zero", () => {
    expect(totalArea([])).toEqual(ZERO);
  });

  test("sums two plots exactly", () => {
    const plots = [plot("a", frac(100)), plot("b", frac(250))];
    expect(totalArea(plots)).toEqual(frac(350));
  });

  test("removing a plot drops its area from the total", () => {
    const plots = [plot("a", frac(100)), plot("b", frac(250))];
    const remaining = plots.filter((p) => p.id !== "a");
    expect(totalArea(remaining)).toEqual(frac(250));
  });

  test("labels a plot with the localized shape name", () => {
    const p = plot("a", frac(100), "rightTriangle");
    expect(plotLabel(p, "en")).toBe("Right triangle");
    expect(plotLabel(p, "bn")).toBe("সমকোণী ত্রিভুজ");
  });
});
