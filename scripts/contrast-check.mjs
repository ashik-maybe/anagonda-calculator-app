/**
 * WCAG contrast gate for the app's theme tokens.
 *
 * Reads src/constants/theme.ts directly (single source of truth for colors),
 * computes every text/bg token pair's contrast ratio in both schemes, and
 * fails the build when a body-text pair is below 4.5:1.
 *
 * Usage: bun run scripts/contrast-check.mjs   (exit 0 = pass, exit 1 = fail)
 */
import { readFileSync } from "node:fs";

const THEME_PATH = new URL("../src/constants/theme.ts", import.meta.url);

/** @param {string} hex @returns {[number, number, number]} */
const hexToRgb = (hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

/** @param {string} hex */
const relativeLuminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** @param {string} fg @param {string} bg */
const contrast = (fg, bg) => {
  const [l1, l2] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Parses one `export const colorsLight: ThemeColors = { … };` block.
 * @param {string} source @param {string} name @returns {Record<string, string>} */
function parseBlock(source, name) {
  const match = source.match(new RegExp(`export const ${name}[^=]*= \\{([\\s\\S]*?)\\n\\};`));
  if (match === null) {
    throw new Error(`contrast-check: token block "${name}" not found`);
  }
  /** @type {Record<string, string>} */
  const tokens = {};
  for (const [, key, value] of match[1].matchAll(/(\w+): "(#[0-9A-Fa-f]{6})"/g)) {
    tokens[key] = value;
  }
  return tokens;
}

const source = readFileSync(THEME_PATH, "utf8");
const light = parseBlock(source, "colorsLight");
const dark = parseBlock(source, "colorsDark");

/** Body-text pairs: foreground token rendered on background token. */
const TEXT_PAIRS = [
  ["onPrimary", "primary"],
  ["onPrimaryContainer", "primaryContainer"],
  ["onSecondary", "secondary"],
  ["onSecondaryContainer", "secondaryContainer"],
  ["onSurface", "surface"],
  ["onSurfaceVariant", "surface"],
  ["onSurfaceVariant", "surfaceVariant"],
  ["onSurface", "surfaceVariant"],
  ["onBackground", "background"],
  ["onError", "error"],
  ["onErrorContainer", "errorContainer"],
  ["onSuccess", "success"],
  ["onSuccessContainer", "successContainer"],
  ["onWarn", "warn"],
  ["onWarnContainer", "warnContainer"],
  ["inverseOnSurface", "inverseSurface"],
  ["onSurfaceVariant", "background"],
];

/** Link/brand text pairs — also body size, same 4.5:1 bar. */
const LINK_PAIRS = [
  ["primary", "background"],
  ["primary", "surface"],
  ["primary", "surfaceVariant"],
];

let failures = 0;

/** @param {string} fg @param {string} bg @param {string} kind */
const check = (fg, bg, kind) => {
  const lightRatio = contrast(light[fg], light[bg]);
  const darkRatio = contrast(dark[fg], dark[bg]);
  const ok = lightRatio >= 4.5 && darkRatio >= 4.5;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "OK" : "FAIL"} ${kind} ${fg}/${bg} light=${lightRatio.toFixed(2)} dark=${darkRatio.toFixed(2)}`,
  );
};

for (const [fg, bg] of TEXT_PAIRS) check(fg, bg, "text");
for (const [fg, bg] of LINK_PAIRS) check(fg, bg, "link");

console.log(
  `contrast-check: ${TEXT_PAIRS.length + LINK_PAIRS.length} pairs, ${failures} failure(s)`,
);
if (failures > 0) {
  process.exit(1);
}
