import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Check, X } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { absoluteUnitIds, unitFactor, type AbsoluteUnitId } from "../../lib/units";
import { isDefaultRates } from "../../lib/rates";
import { useRates } from "../../components/RatesProvider";
import { InputCard } from "../../components/InputCard";
import { parseInput, convertTable } from "../../lib/convert";
import { hapticSuccess, hapticTick } from "../../lib/haptics";

type ConvertRow = { readonly unit: AbsoluteUnitId; readonly value: string };

export default function ConvertScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { rates } = useRates();
  const params = useLocalSearchParams<{ value?: string; from?: string }>();

  const [raw, setRaw] = useState(() => params.value ?? "");
  const [from, setFrom] = useState(() => {
    const f = params.from;
    return f && (absoluteUnitIds as readonly string[]).includes(f)
      ? (f as (typeof absoluteUnitIds)[number])
      : "shoto";
  });
  const [copiedUnit, setCopiedUnit] = useState<AbsoluteUnitId | null>(null);

  const value = useMemo(() => parseInput(raw), [raw]);
  const inputError = raw.trim() !== "" && value === null ? t("err_positive") : null;

  // Hide units whose sqft factor duplicates an earlier row (e.g. shoto/shatak).
  const rows = useMemo<ConvertRow[] | null>(() => {
    if (!value) return null;
    const seen = new Set<string>();
    const out: ConvertRow[] = [];
    for (const row of convertTable(value, from, rates, locale)) {
      const factor = unitFactor(row.unit, rates);
      const key = `${factor.num}/${factor.den}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
    return out;
  }, [value, from, rates, locale]);

  useEffect(() => {
    if (copiedUnit === null) return;
    const timer = setTimeout(() => setCopiedUnit(null), 1500);
    return () => clearTimeout(timer);
  }, [copiedUnit]);

  const custom = !isDefaultRates(rates);

  const onCopyRow = async (unit: AbsoluteUnitId, rowValue: string) => {
    hapticSuccess();
    try {
      await Clipboard.setStringAsync(rowValue);
      setCopiedUnit(unit);
    } catch {
      // clipboard unavailable (web) — ignore
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3], paddingBottom: spacing[5], gap: spacing[3] }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.onSurface }]}>{t("convert_title")}</Text>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <InputCard
            label={t("convert_input")}
            value={raw}
            onChangeText={setRaw}
            error={inputError}
            keyboardType="decimal-pad"
            placeholder={locale === "bn" ? "১" : "1"}
            hint={value === null ? t("convert_hint") : undefined}
            accessibilityHint={t("convert_input")}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("history_delete")}
          disabled={raw === ""}
          hitSlop={8}
          onPress={() => {
            hapticTick();
            setRaw("");
          }}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: colors.surfaceVariant },
            raw === "" && styles.iconButtonDisabled,
          ]}
        >
          <X color={colors.onSurfaceVariant} size={20} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {absoluteUnitIds.map((u) => {
            const selected = u === from;
            return (
              <Pressable
                key={u}
                accessibilityRole="button"
                accessibilityLabel={t(`unit_${u}`)}
                accessibilityState={{ selected }}
                onPress={() => {
                  setFrom(u);
                  hapticTick();
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primaryContainer : "transparent",
                    borderColor: selected ? colors.primary : colors.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                    fontFamily: typography.fonts.bengali,
                    fontSize: typography.sizes[1],
                    fontWeight: selected ? "600" : "400",
                  }}
                >
                  {t(`unit_${u}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {custom ? (
        <Text style={[styles.badge, { color: colors.onSurfaceVariant }]}>{t("rates_badge")}</Text>
      ) : null}

      {rows ? (
        <View style={[styles.table, { borderColor: colors.outlineVariant }]}>
          {rows.map((r, i) => {
            const copied = copiedUnit === r.unit;
            return (
              <Pressable
                key={r.unit}
                accessibilityRole="button"
                accessibilityLabel={`${t("copy")}: ${t(`unit_${r.unit}`)} ${r.value}`}
                onPress={() => void onCopyRow(r.unit, r.value)}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant },
                  pressed && { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Text style={[styles.unitLabel, { color: colors.onSurfaceVariant }]}>
                  {t(`unit_${r.unit}`)}
                </Text>
                <View style={styles.rowValue}>
                  {copied ? <Check color={colors.success} size={16} /> : null}
                  <Text style={[styles.value, { color: colors.onSurface }]}>{r.value}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>{t("convert_hint")}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: typography.fonts.bengali, fontSize: 20, fontWeight: "700" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: { opacity: 0.4 },
  chipRow: { flexDirection: "row", gap: spacing[1] },
  chip: {
    minHeight: 48,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { fontSize: 12, textAlign: "center" },
  table: { borderWidth: 1, borderRadius: radius.md, overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[3],
  },
  unitLabel: { fontSize: 14 },
  rowValue: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  value: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 14, textAlign: "center" },
});
