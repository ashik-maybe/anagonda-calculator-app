import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CircleAlert, Ruler, Trash2 } from "lucide-react-native";
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
import { cmp, div, parseDecimal, ZERO, type Fraction } from "../../lib/fraction";
import { convert, unitFactor } from "../../lib/units";
import { conversionStrip, formatLand } from "../../lib/deed";
import { insertHistory } from "../../lib/storage";
import { hapticSuccess, hapticTick } from "../../lib/haptics";
import { plotLabel, totalArea, type Plot } from "../../lib/worksheet";
import { ShapeGlyph } from "../../components/ShapeGlyphs";
import { InputCard } from "../../components/InputCard";
import { TonalButton } from "../../components/TonalButton";
import { useRates } from "../../components/RatesProvider";

/**
 * A field counts as valid when its raw text parses as a decimal and is
 * strictly greater than zero. Empty or unparseable fields are "incomplete"
 * (no error, blocks the result); a present-but-invalid field shows err_positive.
 */
const fieldValid = (raw: string): boolean => {
  const parsed = parseDecimal(raw.trim());
  return parsed !== null && cmp(parsed, ZERO) > 0;
};

/** Area display in square feet, square metres, and the shoto/katha/bigha/acre strip. */
function AreaCard({
  heading,
  areaSqft,
  showRates = false,
}: {
  readonly heading: string;
  readonly areaSqft: Fraction;
  readonly showRates?: boolean;
}) {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { rates, isCustom } = useRates();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.outlineVariant,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing[4],
        gap: spacing[3],
      }}
    >
      {/* Tier 1 — square feet */}
      <View style={{ alignItems: "center", gap: spacing[0] }}>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
            textAlign: "center",
            fontFamily: typography.fonts.bengali,
          }}
        >
          {heading}
        </Text>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: 40,
            fontWeight: "700",
            fontFamily: typography.fonts.display,
            textAlign: "center",
          }}
        >
          {formatLand(areaSqft, 2, locale)}
          <Text
            style={{
              fontSize: 16,
              color: colors.onSurfaceVariant,
              fontFamily: typography.fonts.bengali,
            }}
          >
            {" "}
            {t("unit_sqft")}
          </Text>
        </Text>
      </View>

      {/* Tier 2 — m² equivalent */}
      <Text
        style={{
          color: colors.onSurface,
          fontSize: 15,
          textAlign: "center",
          fontFamily: typography.fonts.bengali,
        }}
      >
        {formatLand(convert(areaSqft, "sqft", "sqm", rates), 2, locale)} {t("unit_sqm")}
      </Text>

      {/* Tier 3 — conversion strip (shoto/katha/bigha/acre) */}
      <View style={{ flexDirection: "row" }}>
        {conversionStrip(div(areaSqft, unitFactor("shoto", rates)), rates, locale).map(
          (item, index) => (
            <View
              key={item.unit}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: spacing[2],
                borderLeftWidth: index === 0 ? 0 : 1,
                borderLeftColor: colors.outlineVariant,
              }}
            >
              <Text
                style={{
                  color: colors.onSurface,
                  fontSize: 16,
                  fontWeight: "700",
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {item.value}
              </Text>
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: "600",
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {t(`unit_${item.unit}`)}
              </Text>
            </View>
          ),
        )}
      </View>

      {showRates && isCustom ? (
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            textAlign: "center",
            fontFamily: typography.fonts.bengali,
          }}
        >
          {t("rates_badge")}
        </Text>
      ) : null}
    </View>
  );
}

export default function LandScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const [shape, setShape] = useState<ShapeId>("quad");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [plots, setPlots] = useState<Plot[]>([]);
  const [savedNote, setSavedNote] = useState(false);
  const nextPlotId = useRef(0);

  const fields = shapeFields(shape);

  const compute = useMemo<{ res: ShapeResult } | null>(() => {
    const parsed: Record<string, Fraction> = {};
    for (const field of fields) {
      const value = parseDecimal((inputs[field] ?? "").trim());
      if (value === null || cmp(value, ZERO) <= 0) return null;
      parsed[field] = value;
    }
    return { res: shapeArea(shapeFromFields(shape, parsed)) };
  }, [shape, fields, inputs]);

  /** Exact rational approximation of the live area; fine for 2dp displays. */
  const liveSqft = useMemo<Fraction | null>(() => {
    if (compute === null || !compute.res.ok) return null;
    return parseDecimal(areaToDecimal(compute.res.area, 10));
  }, [compute]);

  const total = useMemo(() => totalArea(plots), [plots]);

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

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing[3],
        paddingBottom: spacing[5],
        gap: spacing[3],
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Shape picker — horizontal chip row of 11 glyphs */}
      <View accessibilityRole="radiogroup">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing[1], paddingRight: spacing[1] }}
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
        </ScrollView>
      </View>

      {/* Per-shape dimension inputs (feet) */}
      <Text
        style={{
          color: colors.onSurfaceVariant,
          fontSize: 12,
          fontFamily: typography.fonts.bengali,
        }}
      >
        {t("unit_ft")}
      </Text>
      <View style={{ gap: spacing[2] }}>
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
        </>
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
      ) : (
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
      )}

      <TonalButton
        label={t("worksheet_add")}
        variant="tonal"
        onPress={addPlot}
        disabled={liveSqft === null}
      />

      {plots.length > 0 ? (
        <View style={{ gap: spacing[2] }}>
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1,
              textTransform: "uppercase",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("worksheet_title")}
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
              borderWidth: 1,
              borderRadius: radius.lg,
              paddingHorizontal: spacing[3],
            }}
          >
            {plots.map((plot, index) => (
              <View
                key={plot.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
                  paddingVertical: spacing[2],
                  borderBottomWidth: index === plots.length - 1 ? 0 : 1,
                  borderBottomColor: colors.outlineVariant,
                }}
              >
                <ShapeGlyph shape={plot.shape} size={22} color={colors.onSurfaceVariant} />
                <View style={{ flex: 1, gap: spacing[0] }}>
                  <Text
                    style={{
                      color: colors.onSurface,
                      fontSize: 14,
                      fontWeight: "600",
                      fontFamily: typography.fonts.bengali,
                    }}
                  >
                    {plotLabel(plot, locale)}
                  </Text>
                  <Text
                    style={{
                      color: colors.onSurfaceVariant,
                      fontSize: 13,
                      fontFamily: typography.fonts.bengali,
                    }}
                  >
                    {formatLand(plot.areaSqft, 2, locale)} {t("unit_sqft")}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t("worksheet_remove")}: ${plotLabel(plot, locale)}`}
                  hitSlop={8}
                  onPress={() => removePlot(plot.id)}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.full,
                  }}
                >
                  <Trash2 size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </View>

          <AreaCard heading={t("worksheet_total")} areaSqft={total} />
        </View>
      ) : null}

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
  );
}
