import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { ArrowLeftRight, Check, X } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { absoluteUnitIds, unitFactor, type AbsoluteUnitId } from "../../lib/units";
import { isDefaultRates } from "../../lib/rates";
import { useRates } from "../../components/RatesProvider";
import { InputCard } from "../../components/InputCard";
import { parseInput, convertTable } from "../../lib/convert";
import { hapticSuccess, hapticTick } from "../../lib/haptics";

type ConvertRow = { readonly unit: AbsoluteUnitId; readonly value: string };

const TRADITIONAL_UNITS: readonly AbsoluteUnitId[] = [
  "shoto",
  "katha",
  "bigha",
  "acre",
  "kani",
  "gonda",
  "kora",
  "kranti",
  "til",
  "shatak",
];
const METRIC_UNITS: readonly AbsoluteUnitId[] = ["sqft", "sqm", "sqyard", "hectare"];

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

  const groups = [
    { title: "প্রচলিত", units: TRADITIONAL_UNITS },
    { title: "মেট্রিক/অন্যান্য", units: METRIC_UNITS },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
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

        {rows && rows.length > 0 ? (
          <Pressable
            accessibilityLabel={t("convert_swap")}
            accessibilityRole="button"
            onPress={() => {
              const next = rows.find((r) => r.unit !== from);
              if (!next) return;
              setRaw(next.value);
              setFrom(next.unit);
              hapticTick();
            }}
            style={({ pressed }) => [styles.swapButton, pressed && { opacity: 0.7 }]}
          >
            <ArrowLeftRight color={colors.primary} size={18} />
            <Text style={[styles.swapLabel, { color: colors.primary }]}>{"ফলাফল→ইনপুট"}</Text>
          </Pressable>
        ) : null}

        {custom ? (
          <Text style={[styles.badge, { color: colors.onSurfaceVariant }]}>{t("rates_badge")}</Text>
        ) : null}

        {rows ? (
          <View style={[styles.table, { borderColor: colors.outlineVariant }]}>
            {(() => {
              let firstRow = true;
              const elements: ReactNode[] = [];
              for (const g of groups) {
                const groupRows = rows.filter((r) =>
                  (g.units as readonly string[]).includes(r.unit),
                );
                if (groupRows.length === 0) continue;
                elements.push(
                  <View
                    key={`header-${g.title}`}
                    style={{
                      paddingHorizontal: spacing[3],
                      paddingVertical: spacing[1],
                      backgroundColor: colors.surfaceVariant,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.onSurfaceVariant,
                        fontSize: 11,
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {g.title}
                    </Text>
                  </View>,
                );
                for (const r of groupRows) {
                  const copied = copiedUnit === r.unit;
                  const active = r.unit === from;
                  elements.push(
                    <Pressable
                      key={r.unit}
                      accessibilityRole="button"
                      accessibilityLabel={`${t("copy")}: ${t(`unit_${r.unit}`)} ${r.value}`}
                      onPress={() => void onCopyRow(r.unit, r.value)}
                      style={({ pressed }) => [
                        styles.row,
                        !firstRow && {
                          borderTopWidth: 1,
                          borderTopColor: colors.outlineVariant,
                        },
                        pressed && { backgroundColor: colors.surfaceVariant },
                        active && { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <Text style={[styles.unitLabel, { color: colors.onSurfaceVariant }]}>
                        {t(`unit_${r.unit}`)}
                      </Text>
                      <View style={styles.rowValue}>
                        {copied ? <Check color={colors.success} size={16} /> : null}
                        <Text
                          style={[
                            styles.value,
                            { color: active ? colors.primary : colors.onSurface },
                          ]}
                        >
                          {r.value}
                        </Text>
                        {active ? (
                          <Text style={{ color: colors.primary, fontSize: 12 }}>{"←"}</Text>
                        ) : null}
                      </View>
                    </Pressable>,
                  );
                  firstRow = false;
                }
              }
              return elements;
            })()}
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>{t("convert_hint")}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1] },
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
  swapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    minHeight: 44,
    alignSelf: "center",
    paddingHorizontal: spacing[3],
  },
  swapLabel: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[2],
    fontWeight: "600",
  },
});
