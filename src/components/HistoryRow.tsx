import { Pressable, StyleSheet, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";

type HistoryRowProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly glyphText?: string;
  readonly meta: string;
  readonly onPress: () => void;
  readonly onDelete: () => void;
  readonly deleteLabel: string;
  readonly locale?: "bn" | "en";
};

export function HistoryRow({
  title,
  subtitle,
  glyphText,
  meta,
  onPress,
  onDelete,
  deleteLabel,
}: HistoryRowProps) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceVariant }]}
    >
      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {glyphText ? <Text style={styles.glyph}>{glyphText}</Text> : null}
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <Pressable
        accessibilityLabel={deleteLabel}
        accessibilityRole="button"
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && { backgroundColor: colors.outlineVariant },
        ]}
      >
        <Trash2 size={20} color={colors.onSurfaceVariant} />
      </Pressable>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    row: {
      alignItems: "center",
      borderBottomColor: colors.outlineVariant,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing[2],
      minHeight: 64,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    textColumn: { flex: 1, gap: spacing[0] },
    title: {
      color: colors.onSurface,
      fontFamily: typography.fonts.bengali,
      fontSize: 15,
      fontWeight: "600",
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: 13,
    },
    glyph: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: 12,
      letterSpacing: 2,
    },
    meta: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: 11,
    },
    deleteButton: {
      alignItems: "center",
      borderRadius: radius.full,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
  });
}
