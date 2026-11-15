import { describe, expect, mock, test } from "bun:test";

// storage.ts imports expo-sqlite, which transitively pulls react-native (unparsable in bun).
// Pure helpers never touch the native layer, so a stub module is enough.
mock.module("expo-sqlite", () => ({
  openDatabaseSync: () => ({
    execSync: () => {},
    getAllSync: () => [],
    runSync: () => ({ lastInsertRowId: 0 }),
    getFirstSync: () => null,
  }),
}));

import type { HistoryEntry } from "./storage";

const { findDuplicate, historyKey, trimToCap } = await import("./storage");

const fakeRow = (id: number, createdAt: number): HistoryEntry => ({
  id,
  mode: "hishab",
  inputJson: `{"n":${id}}`,
  resultJson: `{"num":${id},"den":1}`,
  createdAt,
});

describe("trimToCap", () => {
  test("51 rows -> 50 kept, row 1 dropped, ascending order preserved", () => {
    const rows = Array.from({ length: 51 }, (_, i) => fakeRow(i + 1, i + 1));
    const kept = trimToCap(rows);
    expect(kept).toHaveLength(50);
    expect(kept[0].id).toBe(2);
    expect(kept[kept.length - 1].id).toBe(51);
    for (let i = 1; i < kept.length; i++) {
      expect(kept[i].createdAt).toBeGreaterThanOrEqual(kept[i - 1].createdAt);
    }
  });

  test("under cap returns an equal copy (not the same reference)", () => {
    const rows = Array.from({ length: 3 }, (_, i) => fakeRow(i + 1, i + 1));
    const kept = trimToCap(rows);
    expect(kept).toEqual(rows);
    expect(kept).not.toBe(rows);
  });
});

describe("findDuplicate", () => {
  const rows = [
    { id: 1, mode: "hishab", inputJson: '{"a":1}', resultJson: '{"num":1,"den":1}', createdAt: 1 },
  ];

  test("matches on mode + inputJson", () => {
    expect(findDuplicate(rows, "hishab", '{"a":1}')).toBe(true);
  });

  test("false for a different mode", () => {
    expect(findDuplicate(rows, "deed", '{"a":1}')).toBe(false);
  });

  test("false for a different inputJson", () => {
    expect(findDuplicate(rows, "hishab", '{"a":2}')).toBe(false);
  });

  test("false on empty rows", () => {
    expect(findDuplicate([], "hishab", '{"a":1}')).toBe(false);
  });
});

describe("historyKey", () => {
  test('stable "hishab|{"a":1}" shape', () => {
    expect(historyKey("hishab", '{"a":1}')).toBe('hishab|{"a":1}');
  });
});
