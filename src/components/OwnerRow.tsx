import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react-native";
import { Stepper } from "./Stepper";
import { ShareBar } from "./ShareBar";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";

type PartKey = "ana" | "gonda" | "kora" | "kranti" | "til";

const PART_ORDER: readonly PartKey[] = ["ana", "gonda", "kora", "kranti", "til"];

type OwnerRowProps = {
  readonly name: string;
  readonly onNameChange: (v: string) => void;
  readonly namePlaceholder: string;
  readonly nameError?: string | null;
  readonly parts: Readonly<Record<PartKey, string>>;
  readonly onPartChange: (key: PartKey, value: string) => void;
  readonly partErrors?: Readonly<Partial<Record<PartKey, string | null>>>;
  readonly labels: Readonly<Record<PartKey, string>>;
  readonly areaText: string;
  readonly shareText: string;
  readonly onRemove: () => void;
  readonly removeLabel: string;
  readonly onToggleExpand: () => void;
  readonly expanded: boolean;
  readonly expandLabel: string;
  readonly children?: ReactNode;
  readonly locale?: "bn" | "en";
  readonly fractionOfWhole?: number;
  readonly barState?: "ok" | "over" | "under";
};

export function OwnerRow({
  name,
  onNameChange,
  namePlaceholder,
  nameError,
  parts,
  onPartChange,
  partErrors,
  labels,
  areaText,
  shareText,
  onRemove,
  removeLabel,
  onToggleExpand,
  expanded,
  expandLabel,
  children,
  fractionOfWhole,
  barState,
}: OwnerRowProps) {
  const { colors } = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <View accessibilityLabel={shareText} accessibilityRole="group" style={styles.card}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={expandLabel}
          accessibilityRole="button"
          onPress={onToggleExpand}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: colors.outlineVariant },
          ]}
        >
          {expanded ? (
            <ChevronDown color={colors.primary} size={24} />
          ) : (
            <ChevronRight color={colors.primary} size={24} />
          )}
        </Pressable>
      </View>

      <View style={styles.headerRow}>
        <TextInput
          accessibilityLabel={namePlaceholder}
          onChangeText={onNameChange}
          placeholder={namePlaceholder}
          placeholderTextColor={colors.outline}
          style={styles.nameInput}
          value={name}
        />
        <Text numberOfLines={1} style={styles.areaText}>
          {areaText}
        </Text>
        <Pressable
          accessibilityLabel={removeLabel}
          accessibilityRole="button"
          onPress={onRemove}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: colors.outlineVariant },
          ]}
        >
          <Trash2 color={colors.onSurfaceVariant} size={20} />
        </Pressable>
      </View>

      {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

      {fractionOfWhole !== undefined ? (
        <ShareBar
          accessibilityLabel={shareText}
          accessibilityValue={`${Math.round(Math.min(1, Math.max(0, fractionOfWhole)) * 100)}%`}
          fractionOfWhole={fractionOfWhole}
          state={barState ?? "under"}
        />
      ) : null}

      <View style={styles.steppers}>
        {PART_ORDER.map((key) => (
          <Stepper
            error={partErrors?.[key] ?? null}
            key={key}
            label={labels[key]}
            onChange={(value) => onPartChange(key, value)}
            value={parts[key]}
          />
        ))}
      </View>

      {expanded ? <View style={styles.details}>{children}</View> : null}
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
      gap: spacing[2],
      marginBottom: spacing[2],
      padding: spacing[3],
    },
    topBar: { alignItems: "flex-end", flexDirection: "row" },
    iconButton: {
      alignItems: "center",
      borderRadius: radius.full,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing[2],
      justifyContent: "space-between",
    },
    nameInput: {
      color: colors.onSurface,
      flex: 1,
      fontFamily: typography.fonts.bengali,
      fontSize: 15,
      minHeight: 44,
    },
    areaText: {
      color: colors.onSurface,
      fontSize: typography.sizes[2],
      fontWeight: "600",
      textAlign: "right",
    },
    error: {
      color: colors.error,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
    steppers: { gap: spacing[2] },
    details: { gap: spacing[2] },
  });
}
