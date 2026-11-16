import { useEffect, useState } from "react";
import { Stack, useRouter, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nProvider, t } from "../lib/i18n";
import { loadSettings } from "../lib/settings";
import { useAppFonts } from "../lib/fonts";
import { useThemeColors } from "../constants/theme";
import { RatesProvider } from "../components/RatesProvider";
import { TonalButton } from "../components/TonalButton";

SplashScreen.preventAutoHideAsync();

/** Route-level fallback shown when a render error escapes the tree. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.error, fontSize: 20, fontWeight: "700", textAlign: "center" }}>
        {t("err_generic")}
      </Text>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, textAlign: "center" }}>
        {error.message}
      </Text>
      <TonalButton label={t("retry")} onPress={() => void retry()} />
    </View>
  );
}

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
