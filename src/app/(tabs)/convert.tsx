import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { absoluteUnitIds } from "../../lib/units";
import { isDefaultRates } from "../../lib/rates";
import { useRates } from "../../components/RatesProvider";
import { TonalButton } from "../../components/TonalButton";
import { parseInput, convertTable } from "../../lib/convert";

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

  const value = useMemo(() => parseInput(raw), [raw]);
  const rows = useMemo(
    () => (value ? convertTable(value, from, rates, locale) : null),
    [value, from, rates, locale],
  );

  const custom = !isDefaultRates(rates);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3], paddingBottom: spacing[5], gap: spacing[3] }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.onSurface }]}>{t("convert_title")}</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={raw}
          onChangeText={setRaw}
          keyboardType="decimal-pad"
          placeholder={locale === "bn" ? "১" : "1"}
          placeholderTextColor={colors.onSurfaceVariant}
          accessibilityLabel={t("convert_input")}
          style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {absoluteUnitIds.map((u) => {
            const selected = u === from;
            return (
              <TonalButton
                key={u}
                label={t(`unit_${u}`)}
                variant={selected ? "filled" : "tonal"}
                onPress={() => setFrom(u)}
              />
            );
          })}
        </View>
      </ScrollView>

      {custom ? (
        <Text style={[styles.badge, { color: colors.onSurfaceVariant }]}>{t("rates_badge")}</Text>
      ) : null}

      {rows ? (
        <View style={[styles.table, { borderColor: colors.outlineVariant }]}>
          {rows.map((r, i) => (
            <View
              key={r.unit}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.unitLabel, { color: colors.onSurfaceVariant }]}>
                {t(`unit_${r.unit}`)}
              </Text>
              <Text style={[styles.value, { color: colors.onSurface }]}>{r.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>{t("convert_hint")}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: typography.fonts.bengali, fontSize: 20, fontWeight: "700" },
  inputRow: { flexDirection: "row" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 20,
    fontFamily: typography.fonts.bengali,
    minHeight: 48,
  },
  chipRow: { flexDirection: "row", gap: spacing[1] },
  badge: { fontSize: 12, textAlign: "center" },
  table: { borderWidth: 1, borderRadius: radius.md, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", padding: spacing[3] },
  unitLabel: { fontSize: 14 },
  value: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 14, textAlign: "center" },
});
