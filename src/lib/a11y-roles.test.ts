import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// iOS native map of accepted accessibilityRole values (React Native RCTViewManager.m).
// React Native's TS type ends in `| string`, so the compiler cannot catch invalid roles.
// This test is the guard: scan every source file for accessibilityRole="..." and assert
// membership in this set. iOS rejects unknown roles at runtime ("Invalid accessibility
// role value: <role>"), which crashes the whole screen in Expo Go.
const VALID_IOS_ROLES = new Set([
  "none",
  "button",
  "dropdownlist",
  "togglebutton",
  "link",
  "search",
  "image",
  "keyboardkey",
  "text",
  "adjustable",
  "imagebutton",
  "header",
  "summary",
  "alert",
  "checkbox",
  "combobox",
  "menu",
  "menubar",
  "menuitem",
  "progressbar",
  "radio",
  "radiogroup",
  "scrollbar",
  "spinbutton",
  "switch",
  "tab",
  "tabbar",
  "tablist",
  "timer",
  "list",
  "toolbar",
  "grid",
  "pager",
  "scrollview",
  "horizontalscrollview",
  "viewgroup",
  "webview",
  "drawerlayout",
  "slidingdrawer",
  "iconmenu",
  "columnheader",
  "complementary",
  "contentinfo",
  "definition",
  "dialog",
  "directory",
  "document",
  "feed",
  "figure",
  "form",
  "group",
  "heading",
  "horizontalscrollview",
  "img",
  "key",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "meter",
  "navigation",
  "note",
  "option",
  "presentation",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "searchbox",
  "selected",
  "separator",
  "slider",
  "status",
  "table",
  "tabpanel",
  "term",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") continue;
      walk(full, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe("accessibilityRole values", () => {
  test("every accessibilityRole in src/ is accepted by iOS native", () => {
    const root = join(process.cwd(), "src");
    const offenders: string[] = [];
    for (const file of walk(root)) {
      const src = readFileSync(file, "utf8");
      const re = /accessibilityRole=["'`]([A-Za-z]+)["'`]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        if (!VALID_IOS_ROLES.has(m[1])) {
          offenders.push(`${file}: ${m[1]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
