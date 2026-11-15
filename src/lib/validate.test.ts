import { describe, expect, it } from "bun:test";
import {
  parseChainPart,
  parseTotalShoto,
  validateHisab,
  isHisabValid,
  type ChainKey,
  type HisabErrors,
} from "./validate";

const allEmptyChain: Record<ChainKey, string> = {
  ana: "",
  gonda: "",
  kora: "",
  kranti: "",
  til: "",
};

describe("parseTotalShoto", () => {
  it("returns null for empty input", () => {
    expect(parseTotalShoto("")).toBeNull();
  });
});

describe("parseChainPart", () => {
  it("parses empty as 0", () => {
    expect(parseChainPart("")).toBe(0);
  });
  it("parses plain integers", () => {
    expect(parseChainPart("20")).toBe(20);
  });
  it("parses Bangla digits", () => {
    expect(parseChainPart("২")).toBe(2);
  });
  it("rejects negatives", () => {
    expect(parseChainPart("-1")).toBeNull();
  });
  it("rejects fractions", () => {
    expect(parseChainPart("1.5")).toBeNull();
  });
  it("rejects non-safe integers", () => {
    expect(parseChainPart("99999999999999999999")).toBeNull();
  });
});

describe("validateHisab total", () => {
  it("err_required when total empty", () => {
    expect(validateHisab("", allEmptyChain).total).toBe("err_required");
  });
  it("null when total is a positive number", () => {
    expect(validateHisab("100", allEmptyChain).total).toBeNull();
  });
  it("err_positive when total is zero", () => {
    expect(validateHisab("0", allEmptyChain).total).toBe("err_positive");
  });
  it("err_positive when total is Bangla zero", () => {
    expect(validateHisab("০", allEmptyChain).total).toBe("err_positive");
  });
  it("accepts fractional shoto", () => {
    expect(validateHisab("100.5", allEmptyChain).total).toBeNull();
  });
  it("accepts Bangla digits", () => {
    expect(validateHisab("১০০", allEmptyChain).total).toBeNull();
  });
  it("err_positive when total is not numeric", () => {
    expect(validateHisab("abc", allEmptyChain).total).toBe("err_positive");
  });
});

describe("validateHisab chain parts", () => {
  it("parses Bangla digits as integers", () => {
    expect(validateHisab("100", { ...allEmptyChain, ana: "১৬" }).chain.ana).toBeUndefined();
  });
  it("err_positive for fractional chain part", () => {
    expect(validateHisab("100", { ...allEmptyChain, ana: "1.5" }).chain.ana).toBe("err_positive");
  });
  it("err_positive for non-numeric chain part", () => {
    expect(validateHisab("100", { ...allEmptyChain, gonda: "x" }).chain.gonda).toBe("err_positive");
  });
  it("empty chain part means 0 (no error)", () => {
    expect(validateHisab("100", allEmptyChain).chain.til).toBeUndefined();
  });
});

describe("isHisabValid", () => {
  it("true when no errors", () => {
    const errors: HisabErrors = { total: null, chain: {} };
    expect(isHisabValid(errors)).toBe(true);
  });
  it("false when total required", () => {
    const errors: HisabErrors = { total: "err_required", chain: {} };
    expect(isHisabValid(errors)).toBe(false);
  });
  it("false when a chain part errors", () => {
    const errors: HisabErrors = { total: null, chain: { kora: "err_positive" } };
    expect(isHisabValid(errors)).toBe(false);
  });
});
