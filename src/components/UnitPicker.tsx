import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check } from "lucide-react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import enDict from "../i18n/en.json";
import type { AbsoluteUnitId } from "../lib/units";

export const TRADITIONAL_UNITS: readonly AbsoluteUnitId[] = [
  "shoto",
  "katha",
  "chotak",
  "bigha",
  "acre",
  "kani",
  "gonda",
  "kora",
  "kranti",
  "til",
  "shatak",
];

export const METRIC_UNITS: readonly AbsoluteUnitId[] = [
  "sqft",
  "sqm",
  "sqyard",
  "hectare",
  "sqhat",
  "sqlink",
];

type Group = { readonly title: string; readonly units: readonly AbsoluteUnitId[] };

type Row =
  | { readonly kind: "header"; readonly key: string; readonly title: string }
  | { readonly kind: "unit"; readonly key: string; readonly unit: AbsoluteUnitId };

type Props = {
  readonly value: AbsoluteUnitId;
  readonly onSelect: (unit: AbsoluteUnitId) => void;
  readonly exclude?: AbsoluteUnitId;
  readonly titleKey: string;
};

/** Bottom sheet listing every absolute unit, grouped, with search. */
export function UnitPicker({ value, onSelect, exclude, titleKey }: Props) {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const styles = makeStyles(colors);

  const rows = useMemo<Row[]>(() => {
    const groups: readonly Group[] = [
      { title: t("group_traditional"), units: TRADITIONAL_UNITS },
      { title: t("convert_advanced"), units: METRIC_UNITS },
    ];
    const q = query.trim().toLowerCase();
    const out: Row[] = [];
    for (const group of groups) {
      const units = group.units.filter((u) => {
        if (u === exclude) return false;
        if (q === "") return true;
        return (
          u.includes(q) ||
          t(`unit_${u}`).toLowerCase().includes(q) ||
          String(enDict[`unit_${u}`] ?? "")
            .toLowerCase()
            .includes(q)
        );
      });
      if (units.length === 0) continue;
      out.push({ kind: "header", key: `header-${group.title}`, title: group.title });
      for (const u of units) out.push({ kind: "unit", key: u, unit: u });
    }
    return out;
  }, [query, exclude, locale]);

  const pick = (unit: AbsoluteUnitId): void => {
    onSelect(unit);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(titleKey)}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.sheetButton,
          pressed && { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <Text style={[styles.sheetLabel, { color: colors.onSurfaceVariant }]}>{t(titleKey)}</Text>
        <Text style={[styles.sheetValue, { color: colors.onSurface }]}>{t(`unit_${value}`)}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}} accessibilityRole="summary">
            <View style={styles.grabber} />
            <Text style={[styles.title, { color: colors.onSurface }]}>{t(titleKey)}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("search")}
              placeholderTextColor={colors.onSurfaceVariant}
              style={[
                styles.search,
                { borderColor: colors.outlineVariant, color: colors.onSurface },
              ]}
              autoCorrect={false}
              accessibilityLabel={t("search")}
            />
            <FlatList
              data={rows}
              keyExtractor={(row) => row.key}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) =>
                item.kind === "header" ? (
                  <View style={styles.headerRow}>
                    <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>
                      {item.title}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(`unit_${item.unit}`)}
                    onPress={() => pick(item.unit)}
                    style={({ pressed }) => [
                      styles.unitRow,
                      item.unit === value && { backgroundColor: colors.primaryContainer },
                      pressed && { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitLabel,
                        {
                          color: item.unit === value ? colors.onPrimaryContainer : colors.onSurface,
                        },
                      ]}
                    >
                      {t(`unit_${item.unit}`)}
                    </Text>
                    {item.unit === value ? (
                      <Check color={colors.onPrimaryContainer} size={18} />
                    ) : null}
                  </Pressable>
                )
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>["colors"]) =>
  StyleSheet.create({
    sheetButton: {
      alignItems: "center",
      borderColor: colors.outlineVariant,
      borderRadius: radius.md,
      borderWidth: 1,
      flex: 1,
      gap: spacing[0],
      minHeight: 56,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    sheetLabel: {
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
      fontWeight: "600",
    },
    sheetValue: {
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
      fontWeight: "700",
    },
    backdrop: {
      backgroundColor: "rgba(0,0,0,0.4)",
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      gap: spacing[2],
      maxHeight: "75%",
      padding: spacing[3],
    },
    grabber: {
      alignSelf: "center",
      backgroundColor: colors.outlineVariant,
      borderRadius: radius.full,
      height: 4,
      width: 48,
    },
    title: {
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[2],
      fontWeight: "700",
    },
    search: {
      borderRadius: radius.md,
      borderWidth: 1,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
      minHeight: 48,
      paddingHorizontal: spacing[3],
    },
    headerRow: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
    },
    headerText: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    unitRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 48,
      paddingHorizontal: spacing[3],
    },
    unitLabel: {
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
    },
  });
