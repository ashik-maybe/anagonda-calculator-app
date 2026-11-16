import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { fromAnyDigits } from "../lib/digits";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";

type StepperProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly error?: string | null;
  readonly locale?: "bn" | "en";
  readonly hint?: string;
};

const STEP_MAX = 9999;

export function Stepper({ label, value, onChange, error, hint }: StepperProps) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  const current = parseCurrent(value);

  const decrement = () => onChange(String(Math.max(0, current - 1)));
  const increment = () => onChange(String(Math.min(STEP_MAX, current + 1)));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={`${label} −`}
          accessibilityRole="button"
          disabled={current <= 0}
          onPress={decrement}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && { backgroundColor: colors.outlineVariant },
          ]}
        >
          <Minus size={20} color={colors.onSurface} />
        </Pressable>
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          onChangeText={onChange}
          selectTextOnFocus
          style={styles.input}
          textAlign="center"
          value={value}
        />
        <Pressable
          accessibilityLabel={`${label} +`}
          accessibilityRole="button"
          disabled={current >= STEP_MAX}
          onPress={increment}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && { backgroundColor: colors.outlineVariant },
          ]}
        >
          <Plus size={20} color={colors.onSurface} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function parseCurrent(value: string): number {
  const n = Number(value.trim() === "" ? 0 : fromAnyDigits(value));
  return Number.isNaN(n) ? 0 : Math.floor(Math.abs(n));
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    container: { gap: spacing[1] },
    labelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing[1],
      justifyContent: "space-between",
    },
    label: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
    },
    hint: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
    row: { alignItems: "center", flexDirection: "row", gap: spacing[1] },
    stepButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    input: {
      color: colors.onSurface,
      flex: 1,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[3],
      minHeight: 48,
    },
    error: {
      color: colors.error,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
    },
  });
}
