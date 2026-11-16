import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";

type Segment = {
  readonly key: string;
  readonly label: string;
};

type SegmentedControlProps = {
  readonly segments: readonly Segment[];
  readonly value: string;
  readonly onChange: (key: string) => void;
  readonly accessibilityLabel?: string;
};

export function SegmentedControl({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.container}>
      {segments.map((segment) => {
        const selected = segment.key === value;
        return (
          <Pressable
            accessibilityRole="segment"
            accessibilityLabel={segment.label}
            accessibilityState={{ selected }}
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentSelected : null,
              !selected && pressed && { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, selected ? styles.labelSelected : null]}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outlineVariant,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 48,
      overflow: "hidden",
    },
    segment: {
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing[2],
    },
    segmentSelected: {
      backgroundColor: colors.primaryContainer,
    },
    label: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[2],
      fontWeight: "600",
      textAlign: "center",
    },
    labelSelected: {
      color: colors.onPrimaryContainer,
    },
  });
}
