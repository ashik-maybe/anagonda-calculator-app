import { StyleSheet, View } from "react-native";
import { radius, useThemeColors } from "../constants/theme";

type ShareBarProps = {
  readonly fractionOfWhole: number;
  readonly state: "ok" | "over" | "under";
  readonly accessibilityLabel: string;
  readonly accessibilityValue?: string;
};

export function ShareBar({
  fractionOfWhole,
  state,
  accessibilityLabel,
  accessibilityValue,
}: ShareBarProps) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  const raw = Number(fractionOfWhole);
  const fraction = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
  const filledColor =
    state === "ok" ? colors.success : state === "over" ? colors.error : colors.outlineVariant;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={accessibilityValue ? { text: accessibilityValue } : undefined}
      style={styles.bar}
    >
      <View
        style={[styles.filled, { width: `${fraction * 100}%`, backgroundColor: filledColor }]}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    bar: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.sm,
      height: 8,
      overflow: "hidden",
    },
    filled: {
      height: "100%",
    },
  });
}
