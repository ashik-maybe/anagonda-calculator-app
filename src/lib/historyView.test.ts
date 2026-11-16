import { describe, expect, it } from "bun:test";
import { entryToDeed, entryToRow, formatEntryDate } from "./historyView";
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

const bontonEntry = (
  totalShoto: string,
  inputOwners: unknown[],
  resultSum: { num: string; den: string },
  resultOwners?: unknown[],
): HistoryEntry => ({
  id: 42,
  mode: "bonton",
  inputJson: JSON.stringify({ mode: "bonton", totalShoto, owners: inputOwners }),
  resultJson: JSON.stringify({ sum: resultSum, owners: resultOwners }),
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

describe("entryToRow", () => {
  describe("hishab row (mode hishab)", () => {
    it("renders title from chainText and subtitle with area and ratio (bn)", () => {
      const r = entryToRow(row("100", { num: "1", den: "2" }, { num: "50", den: "1" }), "bn");
      expect(r.title).toBe("৮ আনা");
      expect(r.subtitle).toContain("৫০.০০");
      expect(r.subtitle).toContain("১/২");
    });

    it("renders fallback for malformed hishab entry", () => {
      const broken: HistoryEntry = {
        id: 1,
        mode: "hishab",
        inputJson: "not json",
        resultJson: "{}",
        createdAt: 0,
      };
      const r = entryToRow(broken, "bn");
      expect(r.title).toBeTruthy();
      expect(r.subtitle).toBeTruthy();
    });
  });

  describe("bonton row (mode bonton)", () => {
    it("renders sum as title and owner count with total in subtitle (bn)", () => {
      const r = entryToRow(
        bontonEntry(
          "100",
          [{ name: "করিম", parts: { ana: "8", gonda: "0", kora: "0", kranti: "0", til: "0" } }],
          { num: "1", den: "1" },
          [{ share: { num: "1", den: "2" }, area: { num: "50", den: "1" } }],
        ),
        "bn",
      );
      expect(r.title).toBe("১৬ আনা");
      expect(r.subtitle).toBe("মালিক ১ · ১০০.০০ শতাংশ");
    });

    it("works for en locale with Latin digits", () => {
      const r = entryToRow(
        bontonEntry(
          "100",
          [{ name: "Karim", parts: { ana: "8", gonda: "0", kora: "0", kranti: "0", til: "0" } }],
          { num: "1", den: "1" },
          [{ share: { num: "1", den: "2" }, area: { num: "50", den: "1" } }],
        ),
        "en",
      );
      expect(r.title).toBe("16 Ana");
      expect(r.subtitle).toBe("Owner 1 · 100.00 Shoto");
    });

    it("falls back for malformed bonton row (bad JSON)", () => {
      const broken: HistoryEntry = {
        id: 1,
        mode: "bonton",
        inputJson: "not json",
        resultJson: "{}",
        createdAt: 0,
      };
      const r = entryToRow(broken, "bn");
      expect(r.title).toBeTruthy();
      expect(r.subtitle).toBeTruthy();
    });

    it("falls back for missing totalShoto", () => {
      const r = entryToRow(
        bontonEntry("", [], { num: "1", den: "1" }, [
          { share: { num: "1", den: "2" }, area: { num: "50", den: "1" } },
        ]),
        "bn",
      );
      expect(r.title).toBeTruthy();
    });

    it("falls back for zero or negative total", () => {
      const r = entryToRow(
        bontonEntry("0", [], { num: "1", den: "1" }, [
          { share: { num: "1", den: "2" }, area: { num: "50", den: "1" } },
        ]),
        "bn",
      );
      expect(r.title).toBeTruthy();
    });

    it("falls back for missing sum fraction", () => {
      const r = entryToRow(
        bontonEntry("100", [], { num: "x", den: "1" }, [
          { share: { num: "1", den: "2" }, area: { num: "50", den: "1" } },
        ]),
        "bn",
      );
      expect(r.title).toBeTruthy();
    });

    it("falls back for malformed owner share", () => {
      const r = entryToRow(
        bontonEntry("100", [], { num: "1", den: "1" }, [
          { share: { num: "x", den: "2" }, area: { num: "50", den: "1" } },
        ]),
        "bn",
      );
      expect(r.title).toBeTruthy();
    });
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
