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

const VALID_LIVE_REGIONS = new Set(["none", "polite", "assertive"]);
const VALID_IMPORTANT = new Set(["auto", "yes", "no", "no-hide-descendants"]);

// ARIA Role union (RN `role` prop) — a broad superset; keep a known set.
const VALID_ARIA_ROLES = new Set([
  "alert",
  "alertdialog",
  "application",
  "article",
  "banner",
  "button",
  "cell",
  "checkbox",
  "columnheader",
  "combobox",
  "complementary",
  "contentinfo",
  "definition",
  "dialog",
  "directory",
  "document",
  "feed",
  "figure",
  "form",
  "grid",
  "group",
  "heading",
  "img",
  "link",
  "list",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "menu",
  "menubar",
  "menuitem",
  "meter",
  "navigation",
  "none",
  "note",
  "option",
  "presentation",
  "progressbar",
  "radio",
  "radiogroup",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "scrollbar",
  "searchbox",
  "separator",
  "slider",
  "spinbutton",
  "status",
  "summary",
  "switch",
  "tab",
  "table",
  "tablist",
  "tabpanel",
  "term",
  "timer",
  "toolbar",
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

function scanProp(prop: string, allowed: Set<string>): string[] {
  const root = join(process.cwd(), "src");
  const offenders: string[] = [];
  const re = new RegExp(`${prop}=["'\`]([A-Za-z-]+)["'\`]`, "g");
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if (!allowed.has(m[1])) offenders.push(`${file}: ${m[1]}`);
    }
  }
  return offenders;
}

describe("accessibility native prop values", () => {
  test("accessibilityRole values are accepted by iOS native", () => {
    const offenders = scanProp("accessibilityRole", VALID_IOS_ROLES);
    expect(offenders).toEqual([]);
  });
  test("role values are valid ARIA roles", () => {
    const offenders = scanProp("role", VALID_ARIA_ROLES);
    expect(offenders).toEqual([]);
  });
  test("accessibilityLiveRegion values are valid", () => {
    const offenders = scanProp("accessibilityLiveRegion", VALID_LIVE_REGIONS);
    expect(offenders).toEqual([]);
  });
  test("importantForAccessibility values are valid", () => {
    const offenders = scanProp("importantForAccessibility", VALID_IMPORTANT);
    expect(offenders).toEqual([]);
  });
});
