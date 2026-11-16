import { describe, expect, it } from "bun:test";
import { t } from "./i18n";
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
      expect(r.glyphText).toBe("৷৷");
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

  describe("reverse row (mode reverse)", () => {
    const reverseEntry = (): HistoryEntry => ({
      id: 99,
      mode: "reverse",
      inputJson: JSON.stringify({
        mode: "reverse",
        area: "50",
        unit: "shoto",
        totalShoto: "100",
      }),
      resultJson: JSON.stringify({
        share: { num: "1", den: "2" },
        area: { num: "50", den: "1" },
      }),
      createdAt: 1_700_000_000_000,
    });

    it("renders share chain title and ratio · area subtitle (bn)", () => {
      const r = entryToRow(reverseEntry(), "bn");
      expect(r.title).toBe("৮ আনা");
      expect(r.subtitle).toContain("১/২ · ৫০.০০");
      expect(r.glyphText).toBe("৷৷");
    });

    it("renders share chain title and ratio · area subtitle (en)", () => {
      const r = entryToRow(reverseEntry(), "en");
      expect(r.title).toBe("8 Ana");
      expect(r.subtitle).toBe("1/2 · 50.00 Shoto");
      expect(r.glyphText).toBe("৷৷");
    });

    it("falls back for malformed reverse input JSON", () => {
      const broken: HistoryEntry = {
        id: 1,
        mode: "reverse",
        inputJson: "not json",
        resultJson: "{}",
        createdAt: 0,
      };
      const r = entryToRow(broken, "bn");
      expect(r.title).toBeTruthy();
    });
  });

  describe("porimap row (mode porimap)", () => {
    const porimapEntry = (): HistoryEntry => ({
      id: 77,
      mode: "porimap",
      inputJson: JSON.stringify({
        mode: "porimap",
        shape: "square",
        inputs: { side: "12" },
      }),
      resultJson: JSON.stringify({ area: "144.0000000000" }),
      createdAt: 1_700_000_000_000,
    });

    it("renders shape title with sqft area (bn)", () => {
      const r = entryToRow(porimapEntry(), "bn");
      expect(r.title).toContain("বর্গ");
      expect(r.title).toContain("১৪৪.০০");
    });

    it("renders shape title with sqft area (en)", () => {
      const r = entryToRow(porimapEntry(), "en");
      expect(r.title).toContain("Square");
    });

    it("falls back for malformed porimap input JSON", () => {
      const broken: HistoryEntry = {
        id: 1,
        mode: "porimap",
        inputJson: "not json",
        resultJson: "{}",
        createdAt: 0,
      };
      const r = entryToRow(broken, "bn");
      expect(r.title).toBeTruthy();
    });
  });

  describe("convert row (mode convert)", () => {
    const convertEntry = (): HistoryEntry => ({
      id: 55,
      mode: "convert",
      inputJson: JSON.stringify({ value: "100", from: "shoto", to: "sqft" }),
      resultJson: JSON.stringify({ output: "43560" }),
      createdAt: 1_700_000_000_000,
    });

    it("renders 100 shoto → 43,560 sqft with Bangla digits (bn)", () => {
      const r = entryToRow(convertEntry(), "bn");
      expect(r.title).toBe("১০০.০০ শতাংশ → ৪৩,৫৬০.০০ বর্গফুট");
      expect(r.subtitle).toBe("যে একক থেকে: শতাংশ · যে এককে: বর্গফুট");
    });

    it("renders Latin digits for en locale", () => {
      const r = entryToRow(convertEntry(), "en");
      expect(r.title).toBe("100.00 Shoto → 43,560.00 Square foot");
      expect(r.subtitle).toBe("From: Shoto · To: Square foot");
    });

    it('falls back for malformed JSON (fallback title equals t("history"))', () => {
      const broken: HistoryEntry = {
        id: 1,
        mode: "convert",
        inputJson: "not json",
        resultJson: "{}",
        createdAt: 0,
      };
      const r = entryToRow(broken, "bn");
      expect(r.title).toBe(t("history"));
      expect(r.subtitle).toBeTruthy();
    });

    it("falls back for missing field", () => {
      const r = entryToRow(
        {
          ...convertEntry(),
          inputJson: JSON.stringify({ value: "100", from: "shoto" }),
        },
        "bn",
      );
      expect(r.title).toBe(t("history"));
    });

    it("falls back for unknown unit id", () => {
      const r = entryToRow(
        {
          ...convertEntry(),
          inputJson: JSON.stringify({ value: "100", from: "shoto", to: "nope" }),
        },
        "bn",
      );
      expect(r.title).toBe(t("history"));
    });

    it("falls back for non-positive or unparseable output", () => {
      const zeroOut = { ...convertEntry(), resultJson: JSON.stringify({ output: "0" }) };
      const badOut = { ...convertEntry(), resultJson: JSON.stringify({ output: "x" }) };
      const negVal = {
        ...convertEntry(),
        inputJson: JSON.stringify({ value: "-5", from: "shoto", to: "sqft" }),
      };
      expect(entryToRow(zeroOut, "bn").title).toBe(t("history"));
      expect(entryToRow(badOut, "bn").title).toBe(t("history"));
      expect(entryToRow(negVal, "bn").title).toBe(t("history"));
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
