import { useColorScheme } from "react-native";
import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  background: string;
  onBackground: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  warn: string;
  onWarn: string;
  warnContainer: string;
  onWarnContainer: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
};
export const colorsLight: ThemeColors = {
  primary: "#006A4E",
  onPrimary: "#FFFFFF",
  primaryContainer: "#BFE8CC",
  onPrimaryContainer: "#00381B",
  secondary: "#4A6350",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#D5E4D9",
  onSecondaryContainer: "#0E1F14",
  surface: "#FBFDF9",
  surfaceVariant: "#E2E8E0",
  onSurface: "#122016",
  onSurfaceVariant: "#404A42",
  background: "#FBFDF9",
  onBackground: "#122016",
  outline: "#6E7A70",
  outlineVariant: "#C4CFC5",
  error: "#B3261E",
  onError: "#FFFFFF",
  errorContainer: "#F9DEDC",
  onErrorContainer: "#410E0B",
  success: "#16632E",
  onSuccess: "#FFFFFF",
  successContainer: "#B8E6C5",
  onSuccessContainer: "#00391B",
  warn: "#7A4B00",
  onWarn: "#FFFFFF",
  warnContainer: "#FFE0A3",
  onWarnContainer: "#4A3200",
  scrim: "#000000",
  inverseSurface: "#2F3A32",
  inverseOnSurface: "#F1F5F0",
  inversePrimary: "#A7E3B8",
};
export const colorsDark: ThemeColors = {
  primary: "#8FD6A6",
  onPrimary: "#00391D",
  primaryContainer: "#00512B",
  onPrimaryContainer: "#80E2A3",
  secondary: "#B7CCBC",
  onSecondary: "#16281B",
  secondaryContainer: "#2E4536",
  onSecondaryContainer: "#D5E4D9",
  surface: "#0E1611",
  surfaceVariant: "#1D2820",
  onSurface: "#DEEFE1",
  onSurfaceVariant: "#A7B8AA",
  background: "#0E1611",
  onBackground: "#DEEFE1",
  outline: "#7C8B7F",
  outlineVariant: "#3A463D",
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#8C1D18",
  onErrorContainer: "#FFD8D3",
  success: "#8FD6A6",
  onSuccess: "#00391D",
  successContainer: "#00512B",
  onSuccessContainer: "#80E2A3",
  warn: "#FFB84D",
  onWarn: "#3F2D00",
  warnContainer: "#5A4100",
  onWarnContainer: "#FFE0A3",
  scrim: "#000000",
  inverseSurface: "#DEEFE1",
  inverseOnSurface: "#0E1611",
  inversePrimary: "#006A4E",
};
export const spacing = [4, 8, 12, 16, 24, 32] as const;
export const radius = { sm: 8, md: 16, lg: 24, full: 9999 } as const;
export const typography = {
  sizes: [12, 14, 16, 20, 28, 40] as const,
  fonts: { display: "BalooDa2", bengali: "NotoSansBengali", latin: "NotoSans" },
  // Bengali matras need air; never go below 1.5 on Bengali body text.
  lineHeights: { tight: 1.2, body: 1.6, loose: 1.8 } as const,
} as const;
export const motion = { fast: 120, base: 180, slow: 240 } as const;
export function useThemeColors(): { colors: ThemeColors; isDark: boolean } {
  const preference = useThemePreference();
  const scheme = useColorScheme();
  const isDark = preference === "system" ? scheme === "dark" : preference === "dark";
  return { colors: isDark ? colorsDark : colorsLight, isDark };
}

// Manual theme override store (persisted by src/lib/settings.ts).
let themePreference: ThemePreference = "system";
const themeSubs = new Set<() => void>();

export function getThemePreference(): ThemePreference {
  return themePreference;
}

export function setThemePreference(preference: ThemePreference): void {
  themePreference = preference;
  themeSubs.forEach((fn) => fn());
}

function useThemePreference(): ThemePreference {
  useSyncExternalStore(
    (cb) => {
      themeSubs.add(cb);
      return () => themeSubs.delete(cb);
    },
    () => themePreference,
  );
  return themePreference;
}
