import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
import { cmp, div, parseDecimal, ZERO, type Fraction } from "../../lib/fraction";
import { convert, unitFactor } from "../../lib/units";
import { conversionStrip, formatLand } from "../../lib/deed";
import { insertHistory } from "../../lib/storage";
import { hapticSuccess, hapticTick } from "../../lib/haptics";
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

export default function PorimapScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { rates, isCustom } = useRates();
  const router = useRouter();
  const [shape, setShape] = useState<ShapeId>("quad");
  const [inputs, setInputs] = useState<Record<string, string>>({});

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
  const live = useMemo(() => {
    if (compute === null || !compute.res.ok) return null;
    const approx = parseDecimal(areaToDecimal(compute.res.area, 10));
    return approx === null ? null : { area: compute.res.area, approx };
  }, [compute]);

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

  const [savedNote, setSavedNote] = useState(false);

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
      {/* Shape picker — wrapping grid of 7 glyphs */}
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
                minHeight: 48,
                flexGrow: 1,
                paddingHorizontal: spacing[2],
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.outlineVariant,
                backgroundColor: selected ? colors.primaryContainer : colors.surfaceVariant,
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[1],
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

      {live !== null ? (
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
            {/* Tier 1 — live area */}
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
                {t("live_area")}
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
                {formatLand(live.approx, 2, locale)}
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
              {formatLand(convert(live.approx, "sqft", "sqm", rates), 2, locale)} {t("unit_sqm")}
            </Text>

            {/* Tier 3 — conversion strip (shoto/katha/bigha/acre) */}
            <View style={{ flexDirection: "row" }}>
              {conversionStrip(div(live.approx, unitFactor("shoto", rates)), rates, locale).map(
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

            {isCustom ? (
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
