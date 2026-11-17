import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import { saveLocale } from "../lib/settings";
import { hapticTick } from "../lib/haptics";
import { TonalButton } from "../components/TonalButton";

const ONBOARDING_KEY = "onboarding:done";

export default function OnboardingScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [checked, setChecked] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [page, setPage] = useState(0);

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

  const go = (tab: "hissa" | "land" | "convert"): void => {
    void AsyncStorage.setItem(ONBOARDING_KEY, "true").catch(() => {});
    router.replace(
      tab === "hissa" ? "/(tabs)/hissa" : tab === "land" ? "/(tabs)/land" : "/(tabs)/convert",
    );
  };

  const slides = [
    {
      title: t("onboarding_slide1_title"),
      body: t("onboarding_slide1_body"),
      glyphs: "\u2044  \u09F5  \u09F6  \u09F7",
      jobs: null,
    },
    {
      title: t("onboarding_slide2_title"),
      body: t("onboarding_slide2_body"),
      glyphs: null,
      jobs: null,
    },
    {
      title: t("onboarding_slide3_title"),
      body: t("onboarding_interactive_hint"),
      glyphs: null,
      jobs: [
        { key: "hissa" as const, label: t("onboarding_job_hisab") },
        { key: "land" as const, label: t("onboarding_job_measure") },
        { key: "convert" as const, label: t("onboarding_job_convert") },
      ],
    },
  ];

  const scrollToPage = (index: number) => {
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(nextPage);
  };

  if (!checked || shouldRedirect) {
    return null;
  }

  const isLast = page === slides.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        onMomentumScrollEnd={onMomentumScrollEnd}
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
            {slide.jobs ? (
              <View style={styles.jobList}>
                {slide.jobs.map((job) => (
                  <Pressable
                    key={job.key}
                    accessibilityRole="button"
                    accessibilityLabel={job.label}
                    onPress={() => go(job.key)}
                    style={({ pressed }) => [
                      styles.jobCard,
                      {
                        backgroundColor: pressed ? colors.primaryContainer : colors.surfaceVariant,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text style={[styles.jobLabel, { color: colors.onSurface }]}>{job.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={locale === "bn" ? "English" : "বাংলা"}
        onPress={() => {
          const next = locale === "bn" ? "en" : "bn";
          void saveLocale(next);
          hapticTick();
        }}
        style={[styles.langToggle, { top: spacing[2], right: spacing[2] }]}
      >
        <Text style={[styles.langLabel, { color: colors.onSurfaceVariant }]}>
          {locale === "bn" ? "English" : "বাংলা"}
        </Text>
      </Pressable>
      <View style={styles.dotsRow}>
        {slides.map((_, index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Slide ${index + 1}`}
            onPress={() => scrollToPage(index)}
            style={[
              styles.dot,
              {
                backgroundColor: index === page ? colors.primary : colors.outlineVariant,
                opacity: index === page ? 1 : 0.6,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.actions}>
        {isLast ? (
          <TonalButton label={t("onboarding_start")} variant="filled" onPress={finish} />
        ) : (
          <TonalButton
            label={t("onboarding_next")}
            variant="filled"
            onPress={() => scrollToPage(page + 1)}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("onboarding_skip")}
          onPress={finish}
          style={styles.skipButton}
        >
          <Text style={[styles.skipLabel, { color: colors.onSurfaceVariant }]}>
            {t("onboarding_skip")}
          </Text>
        </Pressable>
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
  jobList: {
    gap: spacing[2],
    marginTop: spacing[3],
    width: "100%",
  },
  jobCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  jobLabel: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[2],
    fontWeight: "600",
  },
  glyphRow: { marginTop: spacing[2] },
  glyphs: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[5],
    letterSpacing: 8,
  },
  dotsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    paddingBottom: spacing[2],
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  actions: {
    gap: spacing[2],
    padding: spacing[4],
    paddingBottom: spacing[5],
  },
  skipButton: {
    alignItems: "center",
    alignSelf: "center",
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  skipLabel: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[1],
    fontWeight: "500",
  },
  langToggle: {
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: spacing[3],
    position: "absolute",
  },
  langLabel: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[1],
    fontWeight: "500",
  },
});
