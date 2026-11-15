import { describe, expect, it } from "bun:test";
import { entryToDeed, formatEntryDate } from "./historyView";
import type { HistoryEntry } from "./storage";

const row = (
  totalShoto: string,
  share: { num: string; den: string },
  area: { num: string; den: string },
): HistoryEntry => ({
  id: 7,
  mode: "hishab",
  inputJson: JSON.stringify({ mode: "hishab", totalShoto, parts: { ana: 8 } }),
  resultJson: JSON.stringify({ share, area }),
  createdAt: 1_700_000_000_000,
});

describe("entryToDeed", () => {
  it("rebuilds the deed view model from a stored row (bn)", () => {
    const deed = entryToDeed(row("100", { num: "1", den: "2" }, { num: "50", den: "1" }), "bn");
    expect(deed).not.toBeNull();
    expect(deed?.chainText).toBe("৮ আনা");
    expect(deed?.areaText).toBe("৫০.০০");
    expect(deed?.ratioText).toBe("১/২");
  });

  it("works for en locale with Latin digits", () => {
    const deed = entryToDeed(row("100", { num: "1", den: "2" }, { num: "50", den: "1" }), "en");
    expect(deed?.chainText).toBe("8 Ana");
    expect(deed?.areaText).toBe("50.00");
  });

  it("rejects malformed rows instead of throwing", () => {
    const broken: HistoryEntry = {
      id: 1,
      mode: "hishab",
      inputJson: "not json",
      resultJson: "{}",
      createdAt: 0,
    };
    expect(entryToDeed(broken, "bn")).toBeNull();
  });

  it("rejects non-positive totals and missing fractions", () => {
    expect(entryToDeed(row("-5", { num: "1", den: "2" }, { num: "1", den: "2" }), "bn")).toBeNull();
    expect(
      entryToDeed(row("100", { num: "x", den: "2" }, { num: "50", den: "1" }), "bn"),
    ).toBeNull();
  });
});

describe("formatEntryDate", () => {
  it("renders bn-BD with Bangla digits", () => {
    expect(formatEntryDate(1_700_000_000_000, "bn")).toMatch(/[০-৯]/);
  });

  it("renders en-US with Latin digits", () => {
    expect(formatEntryDate(1_700_000_000_000, "en")).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
  });
});
