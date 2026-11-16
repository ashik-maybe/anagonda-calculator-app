import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useThemeColors,
  getThemePreference,
  spacing,
  radius,
  typography,
  type ThemePreference,
} from "../../../constants/theme";
import { t, useLocale, type Locale } from "../../../lib/i18n";
import { saveLocale, saveTheme, saveHapticsEnabled } from "../../../lib/settings";
import { hapticTick, hapticsEnabled } from "../../../lib/haptics";
import { SegmentedControl } from "../../../components/SegmentedControl";

type CardColors = ReturnType<typeof useThemeColors>["colors"];

function Card({ children }: { children: ReactNode }) {
  const { colors } = useThemeColors();
  const styles = makeCardStyles(colors);
  return <View style={styles.card}>{children}</View>;
}

export default function SettingsScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  // SegmentedControl does not subscribe to the theme store, so mirror it locally.
  const [theme, setTheme] = useState<ThemePreference>(() => getThemePreference());
  const [haptics, setHaptics] = useState<boolean>(() => hapticsEnabled());
  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.caption}>{t("theme")}</Text>
        <SegmentedControl
          accessibilityLabel={t("theme")}
          segments={[
            { key: "system", label: t("system") },
            { key: "light", label: t("light") },
            { key: "dark", label: t("dark") },
          ]}
          value={theme}
          onChange={(key) => {
            const next = key as ThemePreference;
            setTheme(next);
            void saveTheme(next);
            hapticTick();
          }}
        />
      </Card>

      <Card>
        <Text style={styles.caption}>{t("language")}</Text>
        <SegmentedControl
          accessibilityLabel={t("language")}
          segments={[
            { key: "bn", label: "বাংলা" },
            { key: "en", label: "English" },
          ]}
          value={locale}
          onChange={(key) => {
            void saveLocale(key as Locale);
            hapticTick();
          }}
        />
      </Card>

      <Card>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t("haptics")}</Text>
          <Switch
            value={haptics}
            onValueChange={(value) => {
              setHaptics(value);
              void saveHapticsEnabled(value);
              if (value) hapticTick();
            }}
            trackColor={{ false: colors.outlineVariant, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel={t("haptics")}
          />
        </View>
      </Card>

      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            try {
              await AsyncStorage.removeItem("onboarding:done");
            } catch {
              // ignore
            }
            router.replace("/onboarding");
          }}
          style={({ pressed }) => ({
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={[styles.rowText, { textAlign: "center" }]}>{t("onboarding_replay")}</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

function makeCardStyles(colors: CardColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      gap: spacing[2],
      padding: spacing[3],
    },
  });
}

function makeStyles(colors: CardColors) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      gap: spacing[3],
      padding: spacing[3],
      paddingBottom: spacing[5],
    },
    caption: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
      fontWeight: "600",
      letterSpacing: 1,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing[2],
      justifyContent: "space-between",
      minHeight: 56,
    },
    rowText: {
      color: colors.onSurface,
      flex: 1,
      fontFamily: typography.fonts.bengali,
      fontSize: 15,
    },
  });
}
