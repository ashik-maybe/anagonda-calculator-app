import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { I18nProvider } from "../lib/i18n";
import { useAppFonts } from "../lib/fonts";
import { useThemeColors } from "../constants/theme";
import { RatesProvider } from "../components/RatesProvider";

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
