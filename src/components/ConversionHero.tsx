import { useEffect, useState } from "react";
import { Pressable, Share, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Check, Copy, Share2 } from "lucide-react-native";
import { useThemeColors, radius, spacing } from "../constants/theme";
import { t } from "../lib/i18n";
import { BnText } from "./BnText";
import { NumText } from "./NumText";
import { convert, type AbsoluteUnitId, type Rates } from "../lib/units";
import { decomposeArea } from "../lib/decomposition";
import { formatLand } from "../lib/deed";
import { hapticSuccess, hapticTick } from "../lib/haptics";
import type { Fraction } from "../lib/fraction";

type Props = {
  readonly from: AbsoluteUnitId;
  readonly to: AbsoluteUnitId;
  readonly value: Fraction | null;
  readonly rates: Rates;
  readonly locale: "bn" | "en";
};

const TRADITIONAL_SET: ReadonlySet<string> = new Set([
  "shoto",
  "katha",
  "chotak",
  "bigha",
  "acre",
  "kani",
  "gonda",
  "kora",
  "kranti",
  "til",
  "shatak",
]);

/** Primary conversion result: big formatted value, decomposition chips, copy/share. */
export function ConversionHero({ from, to, value, rates, locale }: Props) {
  const { colors } = useThemeColors();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!value) {
    return null;
  }

  const result = convert(value, from, to, rates);
  const resultText = formatLand(result, 2, locale);
  const sentence = `${resultText} ${t(`unit_${to}`)}`;
  const decomposition = TRADITIONAL_SET.has(to) ? decomposeArea(result, rates, locale) : null;

  const onCopy = async () => {
    hapticSuccess();
    try {
      await Clipboard.setStringAsync(sentence);
      setCopied(true);
    } catch {
      // clipboard unavailable (web) — ignore
    }
  };

  const onShare = async () => {
    hapticTick();
    try {
      await Share.share({ message: sentence });
    } catch {
      // user cancelled the share sheet; nothing to do
    }
  };

  const chips: readonly { readonly unit: string; readonly value: string }[] = decomposition
    ? [
        { unit: "bigha", value: decomposition.bigha },
        { unit: "katha", value: decomposition.katha },
        { unit: "chotak", value: decomposition.chotak },
        { unit: "sqft", value: decomposition.sqft },
      ]
    : [];

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${t(`unit_${from}`)} → ${sentence}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.outlineVariant,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing[4],
        gap: spacing[3],
      }}
    >
      {/* Big result */}
      <View style={{ alignItems: "center", gap: spacing[1] }}>
        <NumText
          size={40}
          style={{ color: colors.primary, fontWeight: "700", textAlign: "center" }}
          accessibilityLiveRegion="polite"
        >
          {resultText}
        </NumText>
        <BnText variant="label" style={{ color: colors.onSurfaceVariant }}>
          {t(`unit_${to}`)}
        </BnText>
      </View>

      {/* Traditional decomposition chips */}
      {chips.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing[1],
            justifyContent: "center",
          }}
        >
          {chips.map((chip) => (
            <View
              key={chip.unit}
              style={{
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.md,
                minWidth: 72,
                alignItems: "center",
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
              }}
            >
              <NumText size={15} style={{ color: colors.onSurface, fontWeight: "700" }}>
                {chip.value}
              </NumText>
              <BnText variant="caption" style={{ color: colors.onSurfaceVariant }}>
                {t(`unit_${chip.unit}`)}
              </BnText>
            </View>
          ))}
        </View>
      ) : null}

      {/* Copy / share */}
      <View style={{ flexDirection: "row", gap: spacing[2], justifyContent: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("copy")}
          onPress={() => void onCopy()}
          style={({ pressed }) => [
            {
              alignItems: "center",
              backgroundColor: colors.surfaceVariant,
              borderRadius: radius.full,
              flexDirection: "row",
              gap: spacing[1],
              minHeight: 44,
              paddingHorizontal: spacing[3],
            },
            pressed && { backgroundColor: colors.surface },
          ]}
        >
          {copied ? (
            <Check color={colors.success} size={18} />
          ) : (
            <Copy color={colors.onSurfaceVariant} size={18} />
          )}
          <BnText variant="label" style={{ color: colors.onSurface }}>
            {t("copy")}
          </BnText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("share")}
          onPress={() => void onShare()}
          style={({ pressed }) => [
            {
              alignItems: "center",
              backgroundColor: colors.surfaceVariant,
              borderRadius: radius.full,
              flexDirection: "row",
              gap: spacing[1],
              minHeight: 44,
              paddingHorizontal: spacing[3],
            },
            pressed && { backgroundColor: colors.surface },
          ]}
        >
          <Share2 color={colors.onSurfaceVariant} size={18} />
          <BnText variant="label" style={{ color: colors.onSurface }}>
            {t("share")}
          </BnText>
        </Pressable>
      </View>
    </View>
  );
}
