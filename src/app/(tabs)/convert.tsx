import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { ArrowLeftRight, Check, ChevronDown, ChevronUp, Copy, X } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { absoluteUnitIds, unitFactor, type AbsoluteUnitId } from "../../lib/units";
import { frac } from "../../lib/fraction";
import unitsData from "../../data/units.json";
import { isDefaultRates } from "../../lib/rates";
import { useRates } from "../../components/RatesProvider";
import { InputCard } from "../../components/InputCard";
import { SegmentedControl } from "../../components/SegmentedControl";
import { UnitPicker, TRADITIONAL_UNITS, METRIC_UNITS } from "../../components/UnitPicker";
import { ConversionHero } from "../../components/ConversionHero";
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
  const [to, setTo] = useState<AbsoluteUnitId>("sqft");
  const [kaniConvention, setKaniConvention] = useState<"20gonda" | "40shoto">("20gonda");
  const [copiedUnit, setCopiedUnit] = useState<AbsoluteUnitId | null>(null);
  const [allOpen, setAllOpen] = useState(true);

  // Kani is 17,280 sqft by 20-gonda convention and 17,424 sqft by 40-shoto convention.
  const kaniSqft = useMemo(
    () => frac(kaniConvention === "20gonda" ? 17280n : 17424n),
    [kaniConvention],
  );

  const value = useMemo(() => parseInput(raw), [raw]);
  const inputError = raw.trim() !== "" && value === null ? t("err_positive") : null;

  // Hide units whose sqft factor duplicates an earlier row (e.g. shoto/shatak).
  const rows = useMemo<ConvertRow[] | null>(() => {
    if (!value) return null;
    const seen = new Set<string>();
    const out: ConvertRow[] = [];
    for (const row of convertTable(value, from, rates, locale, kaniSqft)) {
      const factor = unitFactor(row.unit, rates, kaniSqft);
      const key = `${factor.num}/${factor.den}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
    return out;
  }, [value, from, rates, locale, kaniSqft]);

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

  const onSwap = () => {
    setFrom(to);
    setTo(from);
    hapticTick();
  };

  const groups = [
    { title: t("group_traditional"), units: TRADITIONAL_UNITS },
    { title: t("convert_advanced"), units: METRIC_UNITS },
  ];

  const source = unitsData.source as {
    readonly name: string;
    readonly asOf: string;
    readonly url: string;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing[3], paddingBottom: spacing[5], gap: spacing[3] }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          {t("convert_hint")}
        </Text>

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

        {/* From / To pickers with swap */}
        <View style={styles.pickerRow}>
          <UnitPicker
            value={from}
            exclude={to}
            titleKey="convert_from"
            onSelect={(u) => {
              setFrom(u);
              hapticTick();
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("convert_swap")}
            onPress={onSwap}
            style={({ pressed }) => [
              styles.swapButton,
              { backgroundColor: colors.surfaceVariant },
              pressed && { backgroundColor: colors.outlineVariant },
            ]}
          >
            <ArrowLeftRight color={colors.primary} size={20} />
          </Pressable>
          <UnitPicker
            value={to}
            exclude={from}
            titleKey="convert_to"
            onSelect={(u) => {
              setTo(u);
              hapticTick();
            }}
          />
        </View>

        {/* Kani convention — the unit has two accepted sizes in BD */}
        <View style={styles.kaniRow}>
          <Text style={[styles.kaniLabel, { color: colors.onSurfaceVariant }]}>
            {t("convert_kani_convention")}
          </Text>
          <View style={{ width: 220 }}>
            <SegmentedControl
              accessibilityLabel={t("convert_kani_convention")}
              segments={[
                { key: "20gonda", label: t("convert_kani_20gonda") },
                { key: "40shoto", label: t("convert_kani_40shoto") },
              ]}
              value={kaniConvention}
              onChange={(key) => {
                setKaniConvention(key === "40shoto" ? "40shoto" : "20gonda");
                hapticTick();
              }}
            />
          </View>
        </View>

        {custom ? (
          <Text style={[styles.badge, { color: colors.onSurfaceVariant }]}>{t("rates_badge")}</Text>
        ) : null}

        <ConversionHero
          from={from}
          to={to}
          value={value}
          rates={rates}
          locale={locale}
          kaniSqft={kaniSqft}
        />

        {/* Collapsible reference table */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("convert_all_units")}
          onPress={() => {
            setAllOpen((open) => !open);
            hapticTick();
          }}
          style={({ pressed }) => [
            styles.collapseButton,
            { borderColor: colors.outlineVariant },
            pressed && { backgroundColor: colors.surfaceVariant },
          ]}
        >
          <Text style={[styles.collapseLabel, { color: colors.onSurface }]}>
            {t("convert_all_units")}
          </Text>
          {allOpen ? (
            <ChevronUp color={colors.onSurfaceVariant} size={18} />
          ) : (
            <ChevronDown color={colors.onSurfaceVariant} size={18} />
          )}
        </Pressable>

        {allOpen && rows ? (
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
                  const activeFrom = r.unit === from;
                  const activeTo = r.unit === to;
                  elements.push(
                    <Pressable
                      key={r.unit}
                      accessibilityRole="button"
                      accessibilityLabel={`${t("convert_to")}: ${t(`unit_${r.unit}`)} ${r.value}`}
                      onPress={() => {
                        setTo(r.unit);
                        hapticTick();
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        !firstRow && {
                          borderTopWidth: 1,
                          borderTopColor: colors.outlineVariant,
                        },
                        pressed && { backgroundColor: colors.surfaceVariant },
                        activeFrom && { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitLabel,
                          {
                            color: activeFrom ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {t(`unit_${r.unit}`)}
                      </Text>
                      <View style={styles.rowValue}>
                        {activeTo ? (
                          <Text style={{ color: colors.primary, fontSize: 12 }}>{"→"}</Text>
                        ) : null}
                        <Text
                          style={[
                            styles.value,
                            { color: activeFrom ? colors.primary : colors.onSurface },
                            activeTo && { fontWeight: "700" },
                          ]}
                        >
                          {r.value}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${t("copy")}: ${t(`unit_${r.unit}`)}`}
                          hitSlop={8}
                          onPress={() => void onCopyRow(r.unit, r.value)}
                          style={({ pressed }) => [
                            styles.copyButton,
                            pressed && { backgroundColor: colors.surfaceVariant },
                          ]}
                        >
                          {copied ? (
                            <Check color={colors.success} size={16} />
                          ) : (
                            <Copy color={colors.onSurfaceVariant} size={16} />
                          )}
                        </Pressable>
                      </View>
                    </Pressable>,
                  );
                  firstRow = false;
                }
              }
              return elements;
            })()}
          </View>
        ) : null}

        {rows === null ? (
          <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>{t("convert_hint")}</Text>
        ) : null}

        {/* Ministry source attribution */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${source.name} ${source.url}`}
            onPress={() => void Linking.openURL(source.url)}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              {source.name} · {source.asOf} ↗
            </Text>
          </Pressable>
          <Text style={[styles.footerNote, { color: colors.onSurfaceVariant }]}>
            {t("deed_document_governs")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kaniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  kaniLabel: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[1],
    fontWeight: "600",
  },
  subtitle: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[1],
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: { opacity: 0.4 },
  pickerRow: { flexDirection: "row", alignItems: "stretch", gap: spacing[2] },
  swapButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  badge: { fontSize: 12, textAlign: "center" },
  collapseButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[1],
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing[3],
  },
  collapseLabel: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[1],
    fontWeight: "600",
  },
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
  copyButton: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 32,
  },
  hint: { fontSize: 14, textAlign: "center" },
  footer: { alignItems: "center", gap: spacing[1], paddingTop: spacing[2] },
  footerLink: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[0],
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footerNote: {
    fontFamily: typography.fonts.bengali,
    fontSize: typography.sizes[0],
    textAlign: "center",
  },
});
