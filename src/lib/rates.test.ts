import { describe, expect, mock, test } from "bun:test";
import type { SQLQueryBindings } from "bun:sqlite";
import { Database } from "bun:sqlite";
import { eq, frac, type Fraction } from "./fraction";
import { DEFAULT_RATES } from "./units";

// storage.ts imports expo-sqlite, which transitively pulls react-native (unparsable in bun).
// Back the sync API with an in-memory SQLite database so the exact SQL in rates.ts
// (CREATE TABLE / INSERT OR REPLACE / SELECT / DELETE) still executes verbatim.
const mem = new Database(":memory:");
mock.module("expo-sqlite", () => ({
  openDatabaseSync: () => ({
    execSync: (sql: string) => mem.exec(sql),
    getAllSync: <T>(sql: string, params: SQLQueryBindings[] = []) =>
      mem.query<T, SQLQueryBindings[]>(sql).all(...params) as T[],
    getFirstSync: <T>(sql: string, params: SQLQueryBindings[] = []) =>
      mem.query<T | null, SQLQueryBindings[]>(sql).get(...params),
    runSync: (sql: string, params: SQLQueryBindings[] = []) => {
      const res = mem.run(sql, params);
      return { changes: res.changes, lastInsertRowId: Number(res.lastInsertRowid) };
    },
  }),
}));

const { getRates, isCustomRates, isDefaultRates, parseRate, resetRates, setRates } =
  await import("./rates");

const expectFrac = (actual: Fraction | null, expected: Fraction): void => {
  expect(actual).not.toBeNull();
  expect(eq(actual as Fraction, expected)).toBe(true);
};

describe("parseRate", () => {
  test("parses plain integers", () => {
    expectFrac(parseRate("720"), frac(720));
  });

  test("parses decimals exactly", () => {
    expectFrac(parseRate("435.6"), frac(4356, 10));
  });

  test("parses Bangla digits", () => {
    expectFrac(parseRate("৭২০.৫"), frac(7205, 10));
  });

  test("rejects zero", () => {
    expect(parseRate("0")).toBeNull();
  });

  test("rejects negatives", () => {
    expect(parseRate("-3")).toBeNull();
  });

  test("rejects non-numeric input", () => {
    expect(parseRate("abc")).toBeNull();
  });

  test("rejects empty input", () => {
    expect(parseRate("")).toBeNull();
  });
});

describe("isDefaultRates / isCustomRates", () => {
  test("defaults match DEFAULT_RATES", () => {
    expect(isDefaultRates(DEFAULT_RATES)).toBe(true);
    expect(isCustomRates(DEFAULT_RATES)).toBe(false);
  });

  test("custom rates differ", () => {
    const custom = { kathaSqft: frac(750), bighaSqft: frac(14400) };
    expect(isDefaultRates(custom)).toBe(false);
    expect(isCustomRates(custom)).toBe(true);
  });
});

// NOTE: these touch the rates table, so keep them LAST (idempotent if a prior
// run crashed between set and reset) and order them so other tests see defaults.
describe("setRates / getRates / resetRates round-trip", () => {
  test("setRates rejects non-positive input with RangeError", () => {
    expect(() => setRates({ kathaSqft: frac(0), bighaSqft: frac(14400) })).toThrow(RangeError);
    expect(isDefaultRates(getRates())).toBe(true);
  });

  test("persists custom rates then restores defaults (runs last: idempotent)", () => {
    setRates({ kathaSqft: frac(750), bighaSqft: frac(15000) });
    const stored = getRates();
    expect(eq(stored.kathaSqft, frac(750))).toBe(true);
    expect(eq(stored.bighaSqft, frac(15000))).toBe(true);
    resetRates();
    expect(isDefaultRates(getRates())).toBe(true);
  });
});
