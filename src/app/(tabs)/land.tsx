import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlert, Ruler } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import {
  SHAPE_ORDER,
  areaToDecimal,
  shapeArea,
  shapeFields,
  shapeFromFields,
  shapeKey,
  type ShapeId,
  type ShapeResult,
} from "../../lib/shapes";
import { cmp, frac, mul, parseDecimal, ZERO, type Fraction } from "../../lib/fraction";
import { insertHistory } from "../../lib/storage";
import { hapticSuccess, hapticTick } from "../../lib/haptics";
import { totalArea, type Plot } from "../../lib/worksheet";
import { ShapeGlyph } from "../../components/ShapeGlyphs";
import { InputCard } from "../../components/InputCard";
import { TonalButton } from "../../components/TonalButton";
import { SegmentedControl } from "../../components/SegmentedControl";
import { ShapePreview } from "../../components/ShapePreview";
import { Worksheet } from "../../components/Worksheet";
import { BnText } from "../../components/BnText";
import { EmptyState } from "../../components/EmptyState";
import { AreaCard } from "../../components/AreaCard";
import { Reveal } from "../../components/Reveal";

/**
 * A field counts as valid when its raw text parses as a decimal and is
 * strictly greater than zero. Empty or unparseable fields are "incomplete"
 * (no error, blocks the result); a present-but-invalid field shows err_positive.
 */
const fieldValid = (raw: string): boolean => {
  const parsed = parseDecimal(raw.trim());
  return parsed !== null && cmp(parsed, ZERO) > 0;
};

const VALID_SHAPES = new Set<ShapeId>(SHAPE_ORDER);

/** Linear factors to feet for the measurement input unit selector. */
const INPUT_UNIT_FACTORS: Record<string, Fraction> = {
  ft: frac(1),
  hat: frac(3, 2), // 1 হাত = 1.5 ফুট
  link: frac(33, 50), // 1 লিংক = 0.66 ফুট
  meter: frac(1250, 381), // 1 মিটার = 1250/381 ফুট
};
const WORKSHEET_KEY = "worksheet:plots:v1";

type StoredPlot = { id: string; shape: ShapeId; areaNum: string; areaDen: string };

function serializePlots(plots: Plot[]): string {
  return JSON.stringify(
    plots.map((p) => ({
      id: p.id,
      shape: p.shape,
      areaNum: p.areaSqft.num.toString(),
      areaDen: p.areaSqft.den.toString(),
    })),
  );
}

function deserializePlots(raw: string): Plot[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Plot[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Partial<StoredPlot>;
      if (typeof o.id !== "string" || typeof o.shape !== "string") continue;
      if (!VALID_SHAPES.has(o.shape as ShapeId)) continue;
      if (typeof o.areaNum !== "string" || typeof o.areaDen !== "string") continue;
      try {
        out.push({
          id: o.id,
          shape: o.shape as ShapeId,
          areaSqft: { num: BigInt(o.areaNum), den: BigInt(o.areaDen) },
        });
      } catch {
        // skip malformed
      }
    }
    return out;
  } catch {
    return [];
  }
}

export default function LandScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ shape?: string; inputs?: string }>();
  const [shape, setShape] = useState<ShapeId>("quad");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [inputUnit, setInputUnit] = useState<string>("ft");
  const [view, setView] = useState<"measure" | "worksheet">("measure");
  const [plots, setPlots] = useState<Plot[]>([]);
  const [savedNote, setSavedNote] = useState(false);
  const nextPlotId = useRef(0);
  const [worksheetLoaded, setWorksheetLoaded] = useState(false);

  // Restore persisted worksheet on first mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(WORKSHEET_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const restored = deserializePlots(raw);
          if (restored.length > 0) setPlots(restored);
        }
        setWorksheetLoaded(true);
      })
      .catch(() => {
        if (active) setWorksheetLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist worksheet whenever it changes (after initial load).
  useEffect(() => {
    if (!worksheetLoaded) return;
    AsyncStorage.setItem(WORKSHEET_KEY, serializePlots(plots)).catch(() => undefined);
  }, [plots, worksheetLoaded]);

  useEffect(() => {
    if (typeof params.shape !== "string" || typeof params.inputs !== "string") return;
    if (!VALID_SHAPES.has(params.shape as ShapeId)) return;
    try {
      const parsed = JSON.parse(params.inputs) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      const nextInputs: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value === "string") nextInputs[key] = value;
      }
      setShape(params.shape as ShapeId);
      setInputs(nextInputs);
    } catch {
      // ignore invalid params
    }
  }, [params.shape, params.inputs]);

  const fields = shapeFields(shape);

  const factor = INPUT_UNIT_FACTORS[inputUnit] ?? frac(1);
  const compute = useMemo<{ res: ShapeResult } | null>(() => {
    const parsed: Record<string, Fraction> = {};
    for (const field of fields) {
      const value = parseDecimal((inputs[field] ?? "").trim());
      if (value === null || cmp(value, ZERO) <= 0) return null;
      parsed[field] = mul(value, factor);
    }
    return { res: shapeArea(shapeFromFields(shape, parsed)) };
  }, [shape, fields, inputs, factor]);

  /** Exact rational approximation of the live area; fine for 2dp displays. */
  const liveSqft = useMemo<Fraction | null>(() => {
    if (compute === null || !compute.res.ok) return null;
    return parseDecimal(areaToDecimal(compute.res.area, 10));
  }, [compute]);

  const total = useMemo(() => totalArea(plots), [plots]);
  const hasAnyInput = fields.some((field) => (inputs[field] ?? "").trim() !== "");

  const triangleBlocked = compute !== null && shape === "triangle" && !compute.res.ok;

  const payload = useMemo(() => {
    if (compute === null || !compute.res.ok) return null;
    const trimmedRawInputs: Record<string, string> = {};
    for (const field of shapeFields(shape)) {
      trimmedRawInputs[field] = (inputs[field] ?? "").trim();
    }
    return {
      inputJson: JSON.stringify({ mode: "porimap", shape, inputs: trimmedRawInputs }),
      resultJson: JSON.stringify({ area: areaToDecimal(compute.res.area, 10) }),
    };
  }, [compute, shape, inputs]);

  useEffect(() => {
    if (!payload) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const row = insertHistory({
        mode: "porimap",
        inputJson: payload.inputJson,
        resultJson: payload.resultJson,
      });
      if (!row.deduped) {
        hapticSuccess();
        setSavedNote(true);
        hide = setTimeout(() => setSavedNote(false), 1600);
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
      if (hide !== undefined) clearTimeout(hide);
    };
  }, [payload]);

  const addPlot = () => {
    if (liveSqft === null) return;
    nextPlotId.current += 1;
    setPlots((prev) => [...prev, { id: `plot-${nextPlotId.current}`, shape, areaSqft: liveSqft }]);
    setInputs({});
    setSavedNote(false);
    hapticSuccess();
  };

  const removePlot = (id: string) => {
    setPlots((prev) => prev.filter((plot) => plot.id !== id));
    hapticTick();
  };

  const clearPlots = () => {
    setPlots([]);
    hapticTick();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: spacing[3],
          paddingBottom: spacing[5],
          gap: spacing[3],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedControl
          accessibilityLabel={t("land_measure")}
          onChange={(key) => {
            setView(key === "worksheet" ? "worksheet" : "measure");
          }}
          segments={[
            { key: "measure", label: t("land_measure") },
            { key: "worksheet", label: t("land_worksheet") },
          ]}
          value={view}
        />
        {view === "measure" ? (
          <>
            {/* Shape picker — wrapping chip row of 11 glyphs */}
            <View
              accessibilityRole="radiogroup"
              style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1] }}
            >
              {SHAPE_ORDER.map((id) => {
                const selected = id === shape;
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      setShape(id);
                      hapticTick();
                    }}
                    style={{
                      minHeight: 56,
                      minWidth: 68,
                      paddingHorizontal: spacing[2],
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.outlineVariant,
                      backgroundColor: selected ? colors.primaryContainer : colors.surfaceVariant,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: spacing[0],
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`shape_${shapeKey(id)}`)}
                  >
                    <ShapeGlyph
                      shape={id}
                      size={28}
                      color={selected ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                    />
                    <Text
                      style={{
                        color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                        fontSize: 13,
                        fontWeight: selected ? "600" : "400",
                        fontFamily: typography.fonts.bengali,
                      }}
                    >
                      {t(`shape_${shapeKey(id)}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Per-shape dimension inputs (feet) */}
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12,
                fontFamily: typography.fonts.bengali,
              }}
            >
              {t("land_input_unit")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1] }}>
              {(["ft", "hat", "link", "meter"] as const).map((u) => {
                const selected = u === inputUnit;
                const label =
                  u === "ft"
                    ? t("unit_ft")
                    : u === "hat"
                      ? t("unit_hat")
                      : u === "link"
                        ? t("unit_link")
                        : t("unit_meter");
                return (
                  <Pressable
                    key={u}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setInputUnit(u);
                      hapticTick();
                    }}
                    style={{
                      minHeight: 48,
                      paddingHorizontal: spacing[3],
                      paddingVertical: spacing[1],
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.outlineVariant,
                      backgroundColor: selected ? colors.primaryContainer : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                        fontFamily: typography.fonts.bengali,
                        fontSize: typography.sizes[1],
                        fontWeight: selected ? "600" : "400",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ gap: spacing[2] }}>
              <ShapePreview shape={shape} />
              {fields.map((field) => {
                const raw = inputs[field] ?? "";
                const valid = fieldValid(raw);
                return (
                  <InputCard
                    key={`${shape}-${field}`}
                    label={t(`field_${field}`)}
                    value={raw}
                    onChangeText={(s) => setInputs((prev) => ({ ...prev, [field]: s }))}
                    error={raw !== "" && !valid ? t("err_positive") : null}
                    keyboardType="decimal-pad"
                    placeholder={locale === "bn" ? "০.০০" : "0.00"}
                    accessibilityHint={t(`field_${field}`)}
                  />
                );
              })}
            </View>

            {liveSqft !== null ? (
              <Reveal>
                <>
                  {savedNote ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={{
                        color: colors.success,
                        fontSize: 13,
                        fontWeight: "600",
                        textAlign: "center",
                        fontFamily: typography.fonts.bengali,
                      }}
                    >
                      {t("history_saved")}
                    </Text>
                  ) : null}
                  <AreaCard heading={t("live_area")} areaSqft={liveSqft} showRates />
                  <BnText
                    variant="caption"
                    style={{ color: colors.onSurfaceVariant, textAlign: "center" }}
                  >
                    {t("land_result_unit")}: {t("unit_sqft")}
                  </BnText>
                  <TonalButton
                    label={t("worksheet_add")}
                    variant="tonal"
                    onPress={addPlot}
                    disabled={liveSqft === null}
                  />
                </>
              </Reveal>
            ) : triangleBlocked ? (
              <View
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.error,
                  borderRadius: radius.md,
                  paddingVertical: spacing[5],
                  alignItems: "center",
                  gap: spacing[2],
                }}
              >
                <CircleAlert color={colors.error} size={28} />
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    textAlign: "center",
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {t("err_triangle")}
                </Text>
              </View>
            ) : hasAnyInput ? (
              <View
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.md,
                  paddingVertical: spacing[5],
                  alignItems: "center",
                  gap: spacing[2],
                }}
              >
                <Ruler color={colors.onSurfaceVariant} size={28} />
                <Text
                  style={{
                    color: colors.onSurfaceVariant,
                    fontSize: 14,
                    textAlign: "center",
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {t("porimap_empty_hint")}
                </Text>
              </View>
            ) : (
              <EmptyState
                icon={<Ruler color={colors.onSurfaceVariant} size={28} />}
                title={t("land_empty_example")}
                hint={t("porimap_empty_hint")}
                onExample={() => {
                  setShape("rectangle");
                  setInputs({ length: "20", width: "36" });
                  hapticTick();
                }}
              />
            )}
          </>
        ) : (
          <Worksheet
            plots={plots}
            onRemove={removePlot}
            onClear={clearPlots}
            total={total}
            locale={locale}
          />
        )}

        <View style={{ flexDirection: "row", gap: spacing[2] }}>
          <View style={{ flex: 1 }}>
            <TonalButton
              label={t("encyclopedia")}
              variant="outlined"
              onPress={() => router.push("/more/encyclopedia")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TonalButton
              label={t("rates")}
              variant="outlined"
              onPress={() => router.push("/more/rates")}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
