import { StyleSheet, Text, TextInput, View } from "react-native";
import { CircleAlert } from "lucide-react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";

type InputCardProps = {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly error?: string | null;
  readonly keyboardType?: "decimal-pad" | "number-pad" | "default";
  readonly placeholder?: string;
  readonly hint?: string;
  readonly accessibilityHint?: string;
};

export function InputCard({
  label,
  value,
  onChangeText,
  error,
  keyboardType = "decimal-pad",
  placeholder,
  hint,
  accessibilityHint,
}: InputCardProps) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        style={styles.input}
        value={value}
      />
      {error ? (
        <View style={styles.messageRow}>
          <CircleAlert size={14} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outlineVariant,
      borderRadius: radius.md,
      borderWidth: 1,
      gap: spacing[1],
      padding: spacing[3],
    },
    label: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    input: {
      color: colors.onSurface,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[4],
      minHeight: 44,
    },
    messageRow: { alignItems: "center", flexDirection: "row", gap: spacing[0] },
    error: {
      color: colors.error,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
    hint: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
  });
}
