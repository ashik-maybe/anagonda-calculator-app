import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Info } from "lucide-react-native";
import raw from "../../data/units.json";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { formatLand } from "../../lib/deed";
import { parseDecimal } from "../../lib/fraction";
import { entryToDeed, formatEntryDate } from "../../lib/historyView";
import { listHistory, type HistoryEntry } from "../../lib/storage";
import { hapticTick } from "../../lib/haptics";
import { TonalButton } from "../../components/TonalButton";

/** Day-rotating unit fact from the cited unit table (no timers, no network). */
function dailyFact(locale: "bn" | "en"): { label: string; value: string } | null {
  const rows = raw.absolute;
  const row = rows[Math.floor(Date.now() / 86_400_000) % rows.length];
  const factor = parseDecimal(row.sqft);
  if (!factor) return null;
  return {
    label: t(`unit_${row.id}`),
    value: formatLand(factor, 2, locale),
  };
}

export default function HomeScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const [last, setLast] = useState<HistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLast(listHistory("hishab")[0] ?? null);
    }, []),
  );

  const openHisab = (prefill?: string): void => {
    hapticTick();
    router.push(
      prefill
        ? { pathname: "/(tabs)/hishab", params: { prefill } }
        : { pathname: "/(tabs)/hishab", params: {} },
    );
  };

  const deed = last ? entryToDeed(last, locale) : null;
  const fact = dailyFact(locale);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3], gap: spacing[3] }}
    >
      {last && deed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("home_last_result")}: ${deed.chainText}`}
          onPress={() => openHisab(last.inputJson)}
          style={({ pressed }) => ({
            backgroundColor: colors.primaryContainer,
            borderRadius: radius.lg,
            padding: spacing[4],
            gap: spacing[1],
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: colors.onPrimaryContainer,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 0.8,
            }}
          >
            {t("home_last_result")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing[2],
            }}
          >
            <View style={{ flex: 1, gap: spacing[0] }}>
              <Text
                style={{
                  color: colors.onPrimaryContainer,
                  fontSize: 20,
                  fontWeight: "700",
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {deed.chainText}
              </Text>
              <Text
                style={{
                  color: colors.onPrimaryContainer,
                  fontSize: 13,
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {deed.areaText} {t("unit_shoto")} · {formatEntryDate(last.createdAt, locale)}
              </Text>
            </View>
            <ChevronRight color={colors.onPrimaryContainer} size={24} />
          </View>
        </Pressable>
      ) : (
        <View
          style={{
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.lg,
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 14,
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("home_empty")}
          </Text>
          <TonalButton label={t("home_cta")} onPress={() => openHisab()} />
        </View>
      )}

      {fact ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing[3],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
          }}
        >
          <Info color={colors.primary} size={18} />
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 13,
              fontFamily: typography.fonts.bengali,
              flex: 1,
            }}
          >
            {fact.label} = {fact.value} {t("unit_sqft")}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
