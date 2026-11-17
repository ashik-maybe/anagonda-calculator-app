import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";
import { hapticTick } from "../lib/haptics";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";

type TonalButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: "filled" | "tonal" | "outlined" | "destructive";
  readonly disabled?: boolean;
  readonly accessibilityHint?: string;
};

export function TonalButton({
  label,
  onPress,
  variant = "filled",
  disabled = false,
  accessibilityHint,
}: TonalButtonProps) {
  const { colors } = useThemeColors();
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();

  const styles = makeStyles(colors, variant);

  const handlePress = () => {
    if (variant === "filled" || variant === "destructive") {
      hapticTick();
    }
    onPress();
  };

  // Press feedback: near-imperceptible per the frequency gate — 3% scale, 120ms.
  const pressScale = pressed && !disabled && !reducedMotion ? 0.97 : 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      style={({ pressed: p }) => [
        styles.button,
        disabled && styles.disabled,
        p && variant === "outlined" && { backgroundColor: colors.surfaceVariant },
      ]}
    >
      <Animated.View
        style={{
          alignItems: "center",
          transitionProperty: "transform",
          transitionDuration: "120ms",
          transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
          transform: [{ scale: pressScale }],
        }}
      >
        <Text maxFontSizeMultiplier={2} style={styles.label}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function makeStyles(
  colors: ReturnType<typeof useThemeColors>["colors"],
  variant: NonNullable<TonalButtonProps["variant"]>,
) {
  const palette = {
    filled: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.onPrimary,
    },
    tonal: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primaryContainer,
      textColor: colors.onPrimaryContainer,
    },
    outlined: {
      backgroundColor: "transparent",
      borderColor: colors.outline,
      textColor: colors.primary,
    },
    destructive: {
      backgroundColor: colors.errorContainer,
      borderColor: colors.errorContainer,
      textColor: colors.onErrorContainer,
    },
  }[variant];

  return StyleSheet.create({
    button: {
      alignItems: "center",
      backgroundColor: palette.backgroundColor,
      borderColor: palette.borderColor,
      borderRadius: radius.full,
      borderWidth: variant === "outlined" ? 1.5 : 0,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing[4],
    },
    disabled: { opacity: 0.4 },
    label: {
      color: palette.textColor,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[2],
      fontWeight: "600",
    },
  });
}
