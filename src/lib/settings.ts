import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { setLocale, type Locale } from "./i18n";
import { setThemePreference, type ThemePreference } from "../constants/theme";
import { setHapticsEnabled } from "./haptics";

const KEY_LOCALE = "settings:locale";
const KEY_THEME = "settings:theme";
const KEY_HAPTICS = "settings:haptics";

export type StoredSettings = { locale: Locale; theme: ThemePreference; haptics: boolean };

/** Reads the persisted locale, tolerating missing or corrupt values. */
function parseLocale(raw: string | null): Locale {
  return raw === "en" ? "en" : "bn";
}

/** Reads the persisted theme, defaulting to "system" on missing or corrupt values. */
function parseTheme(raw: string | null): ThemePreference {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

/** Reads the persisted haptics flag; absent or unknown values default to on. */
function parseHaptics(raw: string | null): boolean {
  if (raw === null) return true;
  return raw === "true" || raw === "1";
}

/** Reads all three keys in parallel, validates, applies to i18n/theme/haptics stores, returns the applied values. Never throws — storage failure falls back to defaults. */
export async function loadSettings(): Promise<StoredSettings> {
  let stored: [string | null, string | null, string | null] = [null, null, null];
  try {
    stored = await Promise.all([
      AsyncStorage.getItem(KEY_LOCALE),
      AsyncStorage.getItem(KEY_THEME),
      AsyncStorage.getItem(KEY_HAPTICS),
    ]);
  } catch {
    // storage unavailable — apply defaults
  }
  const settings: StoredSettings = {
    locale: parseLocale(stored[0]),
    theme: parseTheme(stored[1]),
    haptics: parseHaptics(stored[2]),
  };
  setLocale(settings.locale);
  setThemePreference(settings.theme);
  setHapticsEnabled(settings.haptics);
  applyAppearance(settings.theme);
  return settings;
}

/** Best-effort native chrome follow; in-app override (useThemeColors) is authoritative. */
function applyAppearance(theme: ThemePreference): void {
  try {
    // RN 0.88 ColorSchemeOverride is "light" | "dark" | "auto" | "unspecified" — no null.
    // "auto" is documented as "removes any override and follows the system default".
    Appearance.setColorScheme(theme === "system" ? "auto" : theme);
  } catch {
    // never crash — chrome follows the system default without this call
  }
}

/** Applies the locale in memory first (UI is instant), then best-effort persists it. Never throws. */
export async function saveLocale(locale: Locale): Promise<void> {
  setLocale(locale);
  try {
    await AsyncStorage.setItem(KEY_LOCALE, locale);
  } catch {
    // never crash — value already applied in memory
  }
}

/** Applies the theme in memory and to native chrome first (UI is instant), then best-effort persists it. Never throws. */
export async function saveTheme(theme: ThemePreference): Promise<void> {
  setThemePreference(theme);
  applyAppearance(theme);
  try {
    await AsyncStorage.setItem(KEY_THEME, theme);
  } catch {
    // never crash — value already applied in memory
  }
}

/** Applies the haptics flag in memory first (UI is instant), then best-effort persists it. Never throws. */
export async function saveHapticsEnabled(value: boolean): Promise<void> {
  setHapticsEnabled(value);
  try {
    await AsyncStorage.setItem(KEY_HAPTICS, JSON.stringify(value));
  } catch {
    // never crash — value already applied in memory
  }
}
