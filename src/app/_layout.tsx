import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { I18nProvider } from "../lib/i18n";
import { loadSettings } from "../lib/settings";
import { useAppFonts } from "../lib/fonts";
import { useThemeColors } from "../constants/theme";
import { RatesProvider } from "../components/RatesProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loaded = useAppFonts();
  const { colors } = useThemeColors();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadSettings()
      .catch(() => undefined)
      .finally(() => {
        if (active) setSettingsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loaded && settingsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, settingsLoaded]);

  if (!loaded || !settingsLoaded) {
    return null;
  }

  return (
    <I18nProvider>
      <RatesProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </RatesProvider>
    </I18nProvider>
  );
}
