import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nProvider } from "../lib/i18n";
import { loadSettings } from "../lib/settings";
import { useAppFonts } from "../lib/fonts";
import { useThemeColors } from "../constants/theme";
import { RatesProvider } from "../components/RatesProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loaded = useAppFonts();
  const { colors } = useThemeColors();
  const router = useRouter();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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
    let active = true;
    AsyncStorage.getItem("onboarding:done")
      .then((v) => {
        if (active) {
          setNeedsOnboarding(v !== "true");
          setOnboardingChecked(true);
        }
      })
      .catch(() => {
        if (active) setOnboardingChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loaded && settingsLoaded && onboardingChecked) {
      void SplashScreen.hideAsync();
      if (needsOnboarding) router.replace("/onboarding");
    }
  }, [loaded, settingsLoaded, onboardingChecked, needsOnboarding, router]);

  if (!loaded || !settingsLoaded || !onboardingChecked) {
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
          <Stack.Screen name="onboarding" />
        </Stack>
      </RatesProvider>
    </I18nProvider>
  );
}
