import { Pressable, StyleSheet, Text, View } from "react-native";
import { ANA_GLYPHS, KORA_GLYPHS, KRANTI_GLYPHS } from "../data/glyphs";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";
import { t } from "../lib/i18n";

type Props = {
  readonly onAna: (n: number) => void;
  readonly onKora: (n: number) => void;
  readonly onKranti: (n: number) => void;
  /** Ana value to highlight, or null for no selection. */
  readonly selectedAna?: number | null;
  /** Kora value to highlight, or null for no selection. */
  readonly selectedKora?: number | null;
  /** Kranti value to highlight, or null for no selection. */
  readonly selectedKranti?: number | null;
  /** When true, chips are dimmed and inert (e.g. percent mode). */
  readonly disabled?: boolean;
};

/**
 * Deed-first glyph strip: each button shows the glyph exactly as it appears
 * on a দলিল, with its value underneath. Tapping a glyph sets that chain
 * component. The ana row mirrors the ana field both ways: tapping sets it,
 * typing highlights the matching glyph.
 */
export function GlyphKeypad({
  onAna,
  onKora,
  onKranti,
  selectedAna = null,
  selectedKora = null,
  selectedKranti = null,
  disabled = false,
}: Props) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("glyph_keypad_title")}</Text>
      <Text style={styles.hint}>{t("glyph_keypad_hint")}</Text>

      <Text style={styles.rowLabel}>{t("ana")}</Text>
      <View style={styles.row}>
        {ANA_GLYPHS.map((g) => {
          const selected = selectedAna === g.ana;
          return (
            <Pressable
              key={g.ana}
              accessibilityRole="button"
              accessibilityLabel={`${t("ana")} ${g.ana}`}
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              onPress={() => onAna(g.ana)}
              style={[styles.chip, selected && styles.chipSelected, disabled && styles.dimmed]}
            >
              <Text style={[styles.glyph, selected && styles.glyphSelected]}>{g.glyph}</Text>
              <Text style={[styles.value, selected && styles.valueSelected]}>{g.ana}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.rowLabel}>{t("kora")}</Text>
      <View style={styles.row}>
        {KORA_GLYPHS.map((g) => {
          const selected = selectedKora === g.kora;
          return (
            <Pressable
              key={g.kora}
              accessibilityRole="button"
              accessibilityLabel={`${t("kora")} ${g.kora}`}
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              onPress={() => onKora(g.kora)}
              style={[styles.chip, selected && styles.chipSelected, disabled && styles.dimmed]}
            >
              <Text style={[styles.glyph, selected && styles.glyphSelected]}>{g.glyph}</Text>
              <Text style={[styles.value, selected && styles.valueSelected]}>{g.kora}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.rowLabel}>{t("kranti")}</Text>
      <View style={styles.row}>
        {KRANTI_GLYPHS.map((g) => {
          const selected = selectedKranti === g.kranti;
          return (
            <Pressable
              key={g.kranti}
              accessibilityRole="button"
              accessibilityLabel={`${t("kranti")} ${g.kranti}`}
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              onPress={() => onKranti(g.kranti)}
              style={[styles.chip, selected && styles.chipSelected, disabled && styles.dimmed]}
            >
              <Text style={[styles.glyph, selected && styles.glyphSelected]}>{g.glyph}</Text>
              <Text style={[styles.value, selected && styles.valueSelected]}>{g.kranti}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    container: { gap: spacing[2] },
    title: {
      color: colors.onSurface,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[2],
      fontWeight: "700",
    },
    hint: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
    rowLabel: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
      fontWeight: "600",
    },
    row: { flexDirection: "row", gap: spacing[1] },
    chip: {
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outlineVariant,
      borderRadius: radius.md,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 56,
      minWidth: 48,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    chipSelected: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    dimmed: { opacity: 0.4 },
    glyph: {
      color: colors.onSurface,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[3],
      fontWeight: "700",
    },
    glyphSelected: { color: colors.onPrimaryContainer },
    value: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
    valueSelected: { color: colors.onPrimaryContainer, fontWeight: "700" },
  });
}
