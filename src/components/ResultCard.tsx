import { useState } from "react";
import { Share, Text, View, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Check, Copy, Share2 } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../constants/theme";
import { t } from "../lib/i18n";
import { hapticSuccess, hapticTick } from "../lib/haptics";
import type { DeedResult } from "../lib/deed";

type Props = {
  readonly deed: DeedResult;
};

/** Three tiers: big chain, exact p/q + 2dp area, deed sentence + strip, then actions. */
export default function ResultCard({ deed }: Props) {
  const { colors } = useThemeColors();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    hapticSuccess();
    await Clipboard.setStringAsync(deed.sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    hapticTick();
    try {
      await Share.share({ message: deed.sentence });
    } catch {
      // user cancelled share sheet; nothing to do
    }
  };

  const stripLabel = (unit: "shoto" | "katha" | "bigha" | "acre"): string => t(`unit_${unit}`);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${t("result")}: ${deed.chainText}, ${deed.glyphText}, ${deed.areaText} ${t("unit_shoto")}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.outlineVariant,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing[4],
        gap: spacing[3],
      }}
    >
      {/* Tier 1 — chain display */}
      <View style={{ alignItems: "center", gap: spacing[0] }}>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {t("result")}
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: 28,
            lineHeight: 36,
            fontWeight: "700",
            textAlign: "center",
            fontFamily: typography.fonts.bengali,
          }}
        >
          {deed.chainText}
        </Text>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 13,
            textAlign: "center",
            fontFamily: typography.fonts.bengali,
            letterSpacing: 2,
          }}
        >
          {t("deed_glyphs")}: {deed.glyphText}
        </Text>
      </View>

      {/* Tier 2 — exact fraction + 2dp area */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "baseline",
          gap: spacing[4],
        }}
      >
        <Text
          style={{
            color: colors.onSurface,
            fontSize: 20,
            fontWeight: "600",
            fontFamily: typography.fonts.bengali,
          }}
        >
          {deed.ratioText} {t("ratio_share")}
        </Text>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: 40,
            fontWeight: "700",
            fontFamily: typography.fonts.display,
          }}
        >
          {deed.areaText}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.onSurfaceVariant,
            }}
          >
            {" "}
            {t("unit_shoto")}
          </Text>
        </Text>
      </View>

      {/* Tier 3 — deed sentence + conversion strip */}
      <View
        style={{
          backgroundColor: colors.surfaceVariant,
          borderRadius: radius.md,
          padding: spacing[3],
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          borderStyle: "dashed",
        }}
      >
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.8,
            marginBottom: spacing[1],
          }}
        >
          {t("deed_format")}
        </Text>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: 15,
            lineHeight: 22,
            fontFamily: typography.fonts.bengali,
          }}
        >
          {deed.sentence}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: colors.outlineVariant,
        }}
      >
        {deed.strip.map((item, index) => (
          <View
            key={item.unit}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: spacing[2],
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: colors.outlineVariant,
            }}
          >
            <Text
              style={{
                color: colors.onSurface,
                fontSize: 16,
                fontWeight: "700",
                fontFamily: typography.fonts.bengali,
              }}
            >
              {item.value}
            </Text>
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {stripLabel(item.unit)}
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: spacing[2] }}>
        <Pressable
          onPress={onCopy}
          accessibilityRole="button"
          accessibilityLabel={t("copy")}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: radius.full,
            backgroundColor: colors.secondaryContainer,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[1],
            paddingHorizontal: spacing[3],
          }}
        >
          {copied ? (
            <Check color={colors.onSecondaryContainer} size={18} />
          ) : (
            <Copy color={colors.onSecondaryContainer} size={18} />
          )}
          <Text
            style={{
              color: colors.onSecondaryContainer,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {t("copy")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={t("share")}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[1],
            paddingHorizontal: spacing[3],
          }}
        >
          <Share2 color={colors.onPrimary} size={18} />
          <Text
            style={{
              color: colors.onPrimary,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {t("share")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
