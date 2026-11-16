import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Calculator } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import { parseTotalShoto } from "../lib/validate";
import { div, parseDecimal, type Fraction } from "../lib/fraction";
import { decomposeShare } from "../lib/decomposition";
import { absoluteUnitIds, convert, type AbsoluteUnitId } from "../lib/units";
import { buildDeedResult, type DeedResult } from "../lib/deed";
import { insertHistory } from "../lib/storage";
import { hapticSuccess, hapticTick } from "../lib/haptics";
import { useRates } from "./RatesProvider";
import { InputCard } from "./InputCard";
import ResultCard from "./ResultCard";

type ReversePrefill = {
  readonly area?: string;
  readonly unit?: AbsoluteUnitId;
  readonly totalShoto?: string;
};

function prefillToState(prefill?: string): ReversePrefill | null {
  if (!prefill) return null;
  try {
    const parsed = JSON.parse(prefill) as {
      mode?: unknown;
      area?: unknown;
      unit?: unknown;
      totalShoto?: unknown;
    };
    if (parsed.mode !== "reverse") return null;
    if (parsed.area !== undefined && typeof parsed.area !== "string") return null;
    if (parsed.totalShoto !== undefined && typeof parsed.totalShoto !== "string") return null;
    let unit: AbsoluteUnitId | undefined;
    if (parsed.unit !== undefined) {
      if (typeof parsed.unit !== "string") return null;
      if (!(absoluteUnitIds as readonly string[]).includes(parsed.unit)) return null;
      unit = parsed.unit as AbsoluteUnitId;
    }
    return { area: parsed.area, unit, totalShoto: parsed.totalShoto };
  } catch {
    return null;
  }
}

type ReverseDeed = DeedResult & {
  readonly share: Fraction;
  readonly areaShoto: Fraction;
  readonly inputJson: string;
};

type Props = {
  readonly prefill?: string;
};

export function ReverseForm({ prefill }: Props) {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { rates, isCustom } = useRates();
  const params = useLocalSearchParams<{ prefill?: string }>();
  const prefillState = useMemo(
    () => prefillToState(prefill ?? params.prefill),
    [prefill, params.prefill],
  );

  const [area, setArea] = useState(() => prefillState?.area ?? "");
  const [unit, setUnit] = useState<AbsoluteUnitId>(() => prefillState?.unit ?? "shoto");
  const [totalShoto, setTotalShoto] = useState(() => prefillState?.totalShoto ?? "");

  const areaError = area.trim() !== "" && parseDecimal(area) === null ? t("err_positive") : null;
  const totalError =
    totalShoto.trim() !== "" && parseTotalShoto(totalShoto) === null ? t("err_positive") : null;

  const deed = useMemo((): ReverseDeed | null => {
    const areaF = parseDecimal(area);
    const total = parseTotalShoto(totalShoto);
    // Guard the degenerate cases that would make exact division throw:
    // zero total, negative area/total. They fall back to the empty state.
    if (!areaF || !total || areaF.num < 0n || total.num <= 0n) return null;
    const areaShoto = convert(areaF, unit, "shoto", rates);
    const share = div(areaShoto, total);
    const chain = decomposeShare(share);
    const card = buildDeedResult(
      { totalShoto: total, share, shareArea: areaShoto, chain, rates },
      locale,
    );
    return {
      ...card,
      share,
      areaShoto,
      inputJson: JSON.stringify({
        mode: "reverse",
        area: area.trim(),
        unit,
        totalShoto: totalShoto.trim(),
      }),
    };
  }, [area, unit, totalShoto, locale, rates]);

  useEffect(() => {
    if (!deed) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const res = insertHistory({
        mode: "reverse",
        inputJson: deed.inputJson,
        resultJson: JSON.stringify({
          share: { num: deed.share.num.toString(), den: deed.share.den.toString() },
          area: { num: deed.areaShoto.num.toString(), den: deed.areaShoto.den.toString() },
        }),
      });
      if (!res.deduped) {
        hapticSuccess();
        setSavedNote(true);
        hide = setTimeout(() => setSavedNote(false), 1600);
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
      if (hide !== undefined) clearTimeout(hide);
    };
  }, [deed]);

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
      <InputCard
        label={t("area_label")}
        value={area}
        onChangeText={setArea}
        error={areaError}
        keyboardType="decimal-pad"
        placeholder="0.00"
        accessibilityHint={t("area_label")}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1] }}>
        {absoluteUnitIds.map((id) => {
          const selected = id === unit;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={t(`unit_${id}`)}
              accessibilityState={{ selected }}
              onPress={() => {
                setUnit(id);
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
                {t(`unit_${id}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <InputCard
        label={t("total_shoto")}
        value={totalShoto}
        onChangeText={setTotalShoto}
        error={totalError}
        keyboardType="decimal-pad"
        placeholder="0.00"
        accessibilityHint={t("total_shoto")}
      />

      {deed ? (
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
          <ResultCard deed={deed} />
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
        </>
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
          <Calculator color={colors.onSurfaceVariant} size={28} />
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 14,
              textAlign: "center",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("reverse_empty_hint")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
