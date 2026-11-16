import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, typography, useThemeColors } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import { TonalButton } from "../components/TonalButton";

const ONBOARDING_KEY = "onboarding:done";

export default function OnboardingScreen() {
  const { colors } = useThemeColors();
  useLocale();
  const { width } = useWindowDimensions();
  const [checked, setChecked] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw === "true" || raw === "1" || raw === "done") {
          setShouldRedirect(true);
          router.replace("/(tabs)/hissa");
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // storage unavailable - still proceed
    }
    router.replace("/(tabs)/hissa");
  };

  if (!checked || shouldRedirect) {
    return null;
  }

  const slides = [
    {
      title: t("onboarding_slide1_title"),
      body: t("onboarding_slide1_body"),
      glyphs: "\u2044  \u09F5  \u09F6  \u09F7",
    },
    {
      title: t("onboarding_slide2_title"),
      body: t("onboarding_slide2_body"),
      glyphs: null,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <Text style={[styles.title, { color: colors.onBackground }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{slide.body}</Text>
            {slide.glyphs ? (
              <View style={styles.glyphRow}>
                <Text style={[styles.glyphs, { color: colors.primary }]}>{slide.glyphs}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <TonalButton label={t("onboarding_skip")} variant="outlined" onPress={finish} />
        <TonalButton label={t("onboarding_start")} variant="filled" onPress={finish} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pager: { flex: 1 },
  slide: {
    alignItems: "center",
    flex: 1,
    gap: spacing[4],
    justifyContent: "center",
    paddingHorizontal: spacing[5],
  },
  title: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[4],
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[2],
    lineHeight: 24,
    textAlign: "center",
  },
  glyphRow: { marginTop: spacing[2] },
  glyphs: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[5],
    letterSpacing: 8,
  },
  actions: {
    gap: spacing[2],
    padding: spacing[4],
    paddingBottom: spacing[5],
  },
});
