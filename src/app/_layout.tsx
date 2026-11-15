import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { I18nProvider } from "../lib/i18n";
import { useAppFonts } from "../lib/fonts";
import { useThemeColors } from "../constants/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loaded = useAppFonts();
  const { colors } = useThemeColors();

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <I18nProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </I18nProvider>
  );
}
