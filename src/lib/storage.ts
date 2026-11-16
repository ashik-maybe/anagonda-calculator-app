import * as SQLite from "expo-sqlite";

/** One history row. inputJson/resultJson hold exact rational strings ({num,den}), never floats. */
export type HistoryEntry = {
  readonly id: number;
  readonly mode: string;
  readonly inputJson: string;
  readonly resultJson: string;
  readonly createdAt: number;
};
export const HISTORY_CAP = 50;

// ---- pure helpers (bun-tested) ----
export function historyKey(mode: string, inputJson: string): string {
  return `${mode}|${inputJson}`;
}
/** Keep the newest `cap` entries. rows must be sorted by createdAt ASC (ties: id ASC). */
export function trimToCap(
  rows: readonly HistoryEntry[],
  cap: number = HISTORY_CAP,
): HistoryEntry[] {
  if (rows.length <= cap) return [...rows];
  return rows.slice(rows.length - cap);
}
export function findDuplicate(
  rows: readonly HistoryEntry[],
  mode: string,
  inputJson: string,
): boolean {
  const key = historyKey(mode, inputJson);
  return rows.some((r) => historyKey(r.mode, r.inputJson) === key);
}

// ---- native layer (not unit-tested in bun) ----
let db: SQLite.SQLiteDatabase | null = null;
/** Shared connection for sibling stores (rates). Creates history table on first use. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("anagonda.db");
    db.execSync(
      `CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL,
        input_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );`,
    );
  }
  return db;
}
const SELECT_COLS =
  "id, mode, input_json AS inputJson, result_json AS resultJson, created_at AS createdAt";
export type HistoryInsert = {
  readonly mode: string;
  readonly inputJson: string;
  readonly resultJson: string;
  readonly createdAt?: number;
};
export function insertHistory(entry: HistoryInsert): { id: number; deduped: boolean } {
  const d = getDb();
  const existing = d.getAllSync<HistoryEntry>(
    `SELECT ${SELECT_COLS} FROM history WHERE mode = ? AND input_json = ? LIMIT 1`,
    [entry.mode, entry.inputJson],
  );
  if (existing.length > 0) return { id: existing[0].id, deduped: true };
  const createdAt = entry.createdAt ?? Date.now();
  const res = d.runSync(
    "INSERT INTO history (mode, input_json, result_json, created_at) VALUES (?, ?, ?, ?)",
    [entry.mode, entry.inputJson, entry.resultJson, createdAt],
  );
  d.runSync(
    "DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY created_at DESC, id DESC LIMIT ?)",
    [HISTORY_CAP],
  );
  return { id: Number(res.lastInsertRowId), deduped: false };
}
export function listHistory(mode?: string): HistoryEntry[] {
  const d = getDb();
  return mode
    ? d.getAllSync<HistoryEntry>(
        `SELECT ${SELECT_COLS} FROM history WHERE mode = ? ORDER BY created_at DESC, id DESC`,
        [mode],
      )
    : d.getAllSync<HistoryEntry>(
        `SELECT ${SELECT_COLS} FROM history ORDER BY created_at DESC, id DESC`,
      );
}
export function deleteHistory(id: number): void {
  getDb().runSync("DELETE FROM history WHERE id = ?", [id]);
}
export function clearHistory(): void {
  getDb().runSync("DELETE FROM history");
}
export function historyCount(): number {
  const row = getDb().getFirstSync<{ n: number }>("SELECT COUNT(*) AS n FROM history");
  return row?.n ?? 0;
}
