import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";
import { t, type Locale } from "../lib/i18n";
import { formatLand } from "../lib/deed";
import type { Fraction } from "../lib/fraction";
import { plotLabel, type Plot } from "../lib/worksheet";
import { SHAPE_ORDER } from "../lib/shapes";
import { hapticSuccess, hapticWarning } from "../lib/haptics";
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
};

/** Worksheet ("খাতা") view: saved plots, running total, and a two-tap clear. */
export function Worksheet({ plots, onRemove, onClear, total, locale }: Props) {
  const { colors } = useThemeColors();
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (armTimer.current !== undefined) clearTimeout(armTimer.current);
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

  if (plots.length === 0) {
    return (
      <EmptyState
        icon={<ShapeGlyph shape={SHAPE_ORDER[0]} size={28} color={colors.onSurfaceVariant} />}
        title={t("worksheet_title")}
        hint={t("porimap_empty_hint")}
      />
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
              onPress={() => onRemove(plot.id)}
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
    </View>
  );
}
