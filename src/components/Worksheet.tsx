import { useEffect, useRef, useState } from "react";
import { Pressable, Share, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Check, Copy, Share2, Trash2 } from "lucide-react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";
import { t, type Locale } from "../lib/i18n";
import { formatLand } from "../lib/deed";
import type { Fraction } from "../lib/fraction";
import { plotLabel, type Plot } from "../lib/worksheet";
import { SHAPE_ORDER } from "../lib/shapes";
import { hapticSuccess, hapticTick, hapticWarning } from "../lib/haptics";
import { ShapeGlyph } from "./ShapeGlyphs";
import { BnText } from "./BnText";
import { EmptyState } from "./EmptyState";
import { AreaCard } from "./AreaCard";

type Props = {
  readonly plots: readonly Plot[];
  readonly onRemove: (id: string) => void;
  readonly onClear: () => void;
  readonly total: Fraction;
  readonly locale: Locale;
  readonly onRestorePlot?: (plot: Plot, index: number) => void;
};

/** Worksheet ("খাতা") view: saved plots, running total, and a two-tap clear. */
export function Worksheet({ plots, onRemove, onClear, total, locale, onRestorePlot }: Props) {
  const { colors } = useThemeColors();
  const [armed, setArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ plot: Plot; index: number } | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (armTimer.current !== undefined) clearTimeout(armTimer.current);
      if (undoTimer.current !== undefined) clearTimeout(undoTimer.current);
      if (copyTimer.current !== undefined) clearTimeout(copyTimer.current);
    },
    [],
  );

  const handleClear = () => {
    if (!armed) {
      hapticWarning();
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (armTimer.current !== undefined) clearTimeout(armTimer.current);
    setArmed(false);
    onClear();
    hapticSuccess();
  };

  const summary = (): string =>
    `${t("worksheet_title")}\n` +
    plots
      .map((p) => `${plotLabel(p, locale)}: ${formatLand(p.areaSqft, 2, locale)} ${t("unit_sqft")}`)
      .join("\n") +
    `\n${t("worksheet_total")}: ${formatLand(total, 2, locale)} ${t("unit_sqft")}`;

  const handleCopy = () => {
    void Clipboard.setStringAsync(summary()).then(() => {
      hapticSuccess();
      setCopied(true);
      if (copyTimer.current !== undefined) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    hapticTick();
    Share.share({ message: summary() }).catch(() => {
      // user cancelled share sheet; nothing to do
    });
  };

  const handleRemove = (plot: Plot, index: number) => {
    if (undoTimer.current !== undefined) clearTimeout(undoTimer.current);
    setPendingRemoval({ plot, index });
    undoTimer.current = setTimeout(() => setPendingRemoval(null), 5000);
    onRemove(plot.id);
  };

  const handleRestore = () => {
    if (pendingRemoval === null) return;
    if (undoTimer.current !== undefined) clearTimeout(undoTimer.current);
    undoTimer.current = undefined;
    onRestorePlot?.(pendingRemoval.plot, pendingRemoval.index);
    setPendingRemoval(null);
    hapticTick();
  };

  const snackbar =
    pendingRemoval !== null ? (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[2],
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing[3],
        }}
      >
        <BnText
          variant="body"
          style={{
            flex: 1,
            color: colors.onSurface,
            fontFamily: typography.fonts.bengali,
          }}
        >
          {t("plot_removed")}
        </BnText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("undo")}
          onPress={handleRestore}
          style={({ pressed }) => ({
            minHeight: 36,
            paddingHorizontal: spacing[3],
            borderRadius: radius.md,
            backgroundColor: colors.primaryContainer,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <BnText
            variant="caption"
            style={{
              color: colors.onPrimaryContainer,
              fontWeight: "600",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("undo")}
          </BnText>
        </Pressable>
      </View>
    ) : null;

  if (plots.length === 0) {
    return (
      <View style={{ gap: spacing[2] }}>
        <EmptyState
          icon={<ShapeGlyph shape={SHAPE_ORDER[0]} size={28} color={colors.onSurfaceVariant} />}
          title={t("worksheet_title")}
          hint={t("porimap_empty_hint")}
        />
        {snackbar}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing[2] }}>
      <BnText
        variant="caption"
        style={{
          color: colors.onSurfaceVariant,
          fontWeight: "600",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {t("worksheet_title")}
      </BnText>

      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
          borderWidth: 1,
          borderRadius: radius.lg,
          paddingHorizontal: spacing[3],
        }}
      >
        {plots.map((plot, index) => (
          <View
            key={plot.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[2],
              paddingVertical: spacing[2],
              borderBottomWidth: index === plots.length - 1 ? 0 : 1,
              borderBottomColor: colors.outlineVariant,
            }}
          >
            <ShapeGlyph shape={plot.shape} size={22} color={colors.onSurfaceVariant} />
            <View style={{ flex: 1, gap: spacing[0] }}>
              <BnText
                variant="body"
                style={{
                  color: colors.onSurface,
                  fontWeight: "600",
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {plotLabel(plot, locale)}
              </BnText>
              <BnText
                variant="caption"
                style={{
                  color: colors.onSurfaceVariant,
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {formatLand(plot.areaSqft, 2, locale)} {t("unit_sqft")}
              </BnText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("worksheet_remove")}: ${plotLabel(plot, locale)}`}
              hitSlop={8}
              onPress={() => handleRemove(plot, index)}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.full,
              }}
            >
              <Trash2 size={20} color={colors.error} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: armed }}
          accessibilityLabel={armed ? t("history_clear_confirm") : t("history_clear")}
          onPress={handleClear}
          style={({ pressed }) => ({
            minHeight: 44,
            paddingHorizontal: spacing[2],
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <BnText
            variant="caption"
            style={{
              color: colors.error,
              fontWeight: "600",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {armed ? t("history_clear_confirm") : t("history_clear")}
          </BnText>
        </Pressable>
      </View>

      <AreaCard heading={t("worksheet_total")} areaSqft={total} />

      <View style={{ flexDirection: "row", gap: spacing[2], justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? t("copied") : t("copy")}
          onPress={handleCopy}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[1],
            minHeight: 44,
            paddingHorizontal: spacing[3],
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
            justifyContent: "center",
          })}
        >
          {copied ? (
            <Check size={18} color={colors.success} />
          ) : (
            <Copy size={18} color={colors.onSurfaceVariant} />
          )}
          <BnText
            variant="caption"
            style={{
              color: copied ? colors.success : colors.onSurfaceVariant,
              fontWeight: "600",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {copied ? t("copied") : t("copy")}
          </BnText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("share")}
          onPress={handleShare}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[1],
            minHeight: 44,
            paddingHorizontal: spacing[3],
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
            justifyContent: "center",
          })}
        >
          <Share2 size={18} color={colors.onSurfaceVariant} />
          <BnText
            variant="caption"
            style={{
              color: colors.onSurfaceVariant,
              fontWeight: "600",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("share")}
          </BnText>
        </Pressable>
      </View>

      {snackbar}
    </View>
  );
}
