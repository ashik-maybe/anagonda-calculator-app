import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Calculator } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import { CHAIN_KEYS, parseChainPart, validateChain, type ChainKey } from "../lib/validate";
import { div, frac, mul, parseDecimal, toDecimalString, toRatioString } from "../lib/fraction";
import { toBanglaDigits } from "../lib/digits";
import { shareArea, shareFraction, type AnaParts } from "../lib/share";
import { decomposeShare, formatChain } from "../lib/decomposition";
import { buildDeedResult } from "../lib/deed";
import { convert, type AbsoluteUnitId } from "../lib/units";
import { insertHistory } from "../lib/storage";
import { hapticSuccess, hapticTick } from "../lib/haptics";
import { InputCard } from "./InputCard";
import { GlyphKeypad } from "./GlyphKeypad";
import { Stepper } from "./Stepper";
import ResultCard from "./ResultCard";
import { useRates } from "./RatesProvider";

export type HisabPrefill = {
  readonly totalShoto?: string;
  readonly parts?: Partial<Record<ChainKey, string>>;
  readonly percent?: string;
  readonly unit?: AbsoluteUnitId;
};

/** Units offered in the optional total-land picker (shatak = শতক). */
const TOTAL_UNITS: readonly AbsoluteUnitId[] = ["shoto", "katha", "bigha", "shatak", "acre"];

function prefillToState(prefill?: string): HisabPrefill | null {
  if (!prefill) return null;
  try {
    const parsed = JSON.parse(prefill) as {
      totalShoto?: unknown;
      parts?: Partial<Record<ChainKey, unknown>> | null;
      percent?: unknown;
      unit?: unknown;
    };
    const result: {
      totalShoto?: string;
      parts?: Partial<Record<ChainKey, string>>;
      percent?: string;
      unit?: AbsoluteUnitId;
    } = {};
    if (typeof parsed.totalShoto === "string") result.totalShoto = parsed.totalShoto;
    if (parsed.parts && typeof parsed.parts === "object") {
      const parts: Partial<Record<ChainKey, string>> = {};
      for (const key of CHAIN_KEYS) {
        const v = parsed.parts[key];
        if (typeof v === "string" || typeof v === "number") parts[key] = String(v);
      }
      result.parts = parts;
    }
    if (typeof parsed.percent === "string") result.percent = parsed.percent;
    if (
      typeof parsed.unit === "string" &&
      (TOTAL_UNITS as readonly string[]).includes(parsed.unit)
    ) {
      result.unit = parsed.unit as AbsoluteUnitId;
    }
    if (
      result.totalShoto === undefined &&
      result.parts === undefined &&
      result.percent === undefined
    ) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

type Props = {
  readonly prefill?: string;
};

export function HisabForm({ prefill }: Props) {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { rates } = useRates();
  const params = useLocalSearchParams<{ prefill?: string }>();
  const prefillState = useMemo(
    () => prefillToState(prefill ?? params.prefill),
    [prefill, params.prefill],
  );

  const [totalRaw, setTotalRaw] = useState(() => prefillState?.totalShoto ?? "");
  const [totalUnit, setTotalUnit] = useState<AbsoluteUnitId>(() => prefillState?.unit ?? "shoto");
  const [percent, setPercent] = useState(() => prefillState?.percent ?? "");
  const [chain, setChain] = useState<Record<ChainKey, string>>(() => {
    const base: Record<ChainKey, string> = { ana: "", gonda: "", kora: "", kranti: "", til: "" };
    for (const key of CHAIN_KEYS) {
      const v = prefillState?.parts?.[key];
      if (v !== undefined) base[key] = v;
    }
    return base;
  });

  const percentFrac = useMemo(() => {
    const s = percent.trim();
    return s === "" ? null : parseDecimal(s);
  }, [percent]);
  const percentMode = percent.trim() !== "";
  const percentActive = percentMode && percentFrac !== null && percentFrac.num > 0n;
  const percentInvalid = percentMode && (percentFrac === null || percentFrac.num <= 0n);

  const chainErrors = useMemo(
    () => (percentActive ? {} : validateChain(chain)),
    [percentActive, chain],
  );
  const chainValid = Object.values(chainErrors).every((e) => e == null);

  const totalFrac = useMemo(() => {
    const s = totalRaw.trim();
    return s === "" ? null : parseDecimal(s);
  }, [totalRaw]);
  const totalInvalid = totalRaw.trim() !== "" && (totalFrac === null || totalFrac.num <= 0n);
  const totalShoto = useMemo(
    () => (totalFrac && totalFrac.num > 0n ? convert(totalFrac, totalUnit, "shoto", rates) : null),
    [totalFrac, totalUnit, rates],
  );

  // Effective chain parts: percent mode decomposes percent/100 of the whole
  // exactly; otherwise the typed fields (empty = 0).
  const effParts: AnaParts | null = useMemo(() => {
    if (percentActive && percentFrac) {
      const share = div(percentFrac, frac(100));
      return decomposeShare(share);
    }
    if (!chainValid) return null;
    return {
      ana: parseChainPart(chain.ana) ?? 0,
      gonda: parseChainPart(chain.gonda) ?? 0,
      kora: parseChainPart(chain.kora) ?? 0,
      kranti: parseChainPart(chain.kranti) ?? 0,
      til: parseChainPart(chain.til) ?? 0,
    };
  }, [percentActive, percentFrac, chainValid, chain]);

  const selAnaRaw = effParts?.ana ?? parseChainPart(chain.ana);
  const selectedAna =
    selAnaRaw !== null && selAnaRaw !== undefined && selAnaRaw >= 1 && selAnaRaw <= 16
      ? selAnaRaw
      : null;

  const result = useMemo(() => {
    if (!effParts) return null;
    const share =
      percentActive && percentFrac ? div(percentFrac, frac(100)) : shareFraction(effParts);
    const decomp = decomposeShare(share);
    const labels = {
      ana: t("ana"),
      gonda: t("gonda"),
      kora: t("kora"),
      kranti: t("kranti"),
      til: t("til"),
    };
    const digitsFor = (s: string) => (locale === "bn" ? toBanglaDigits(s) : s);
    const chainText = formatChain(decomp, labels, locale);
    const ratioText = digitsFor(toRatioString(share));
    const percentText = digitsFor(toDecimalString(mul(share, frac(100)), 2));
    const area = totalShoto
      ? percentActive && percentFrac
        ? mul(totalShoto, share)
        : shareArea(totalShoto, effParts)
      : null;
    const deed =
      totalShoto && area
        ? buildDeedResult({ totalShoto, share, shareArea: area, chain: decomp, rates }, locale)
        : null;
    return {
      share,
      parts: effParts,
      chainText,
      ratioText,
      percentText,
      deed,
      area,
      inputJson: JSON.stringify({
        mode: "hishab",
        totalShoto: totalShoto ? toDecimalString(totalShoto, 4) : undefined,
        parts: effParts,
        percent: percentActive && percentFrac ? toDecimalString(percentFrac, 4) : undefined,
      }),
    };
  }, [effParts, percentActive, percentFrac, totalShoto, locale, rates]);

  useEffect(() => {
    if (!result?.deed) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const res = insertHistory({
        mode: "hishab",
        inputJson: result.inputJson,
        resultJson: JSON.stringify({
          share: { num: result.share.num.toString(), den: result.share.den.toString() },
          area: result.area
            ? { num: result.area.num.toString(), den: result.area.den.toString() }
            : undefined,
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
  }, [result]);

  const [savedNote, setSavedNote] = useState(false);

  const setPart = (key: ChainKey) => (value: string) =>
    setChain((prev) => ({ ...prev, [key]: value }));

  const chainError = (key: ChainKey): string | null => {
    const err = chainErrors[key];
    return err ? t(err) : null;
  };

  const localeNumPlaceholder = locale === "bn" ? "০.০০" : "0.00";

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
      {/* 1 — Deed glyph strip, above the fields. Tap to set ana; typing ana highlights it. */}
      <GlyphKeypad
        onAna={(n) => setChain((prev) => ({ ...prev, ana: String(n) }))}
        onKora={(n) => setChain((prev) => ({ ...prev, kora: String(n) }))}
        onKranti={(n) => setChain((prev) => ({ ...prev, kranti: String(n) }))}
        selectedAna={selectedAna}
        disabled={percentActive}
      />

      {/* 2 — Ana chain fields (live-linked to the glyph strip) */}
      <View
        pointerEvents={percentActive ? "none" : "auto"}
        accessibilityElementsHidden={percentActive}
        importantForAccessibility={percentActive ? "no-hide-descendants" : "auto"}
        style={{ gap: spacing[2], opacity: percentActive ? 0.4 : 1 }}
      >
        {CHAIN_KEYS.map((key) => (
          <Stepper
            key={key}
            label={t(key)}
            value={chain[key]}
            onChange={setPart(key)}
            error={chainError(key)}
          />
        ))}
      </View>

      {/* 3 — Percent shortcut: percent of the whole khatian, drives the chain */}
      <InputCard
        label={t("percent_label")}
        value={percent}
        onChangeText={setPercent}
        error={percentInvalid ? t("err_positive") : null}
        keyboardType="decimal-pad"
        placeholder={locale === "bn" ? "৫০" : "50"}
        accessibilityHint={t("percent_label")}
      />
      {percentActive ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: colors.warn,
            fontFamily: typography.fonts.bengali,
            fontSize: typography.sizes[0],
            textAlign: "center",
          }}
        >
          {t("percent_note")}
        </Text>
      ) : null}

      {/* 4 — Optional total land, any unit; converted to shoto exactly */}
      <InputCard
        label={t("total_optional")}
        value={totalRaw}
        onChangeText={setTotalRaw}
        error={totalInvalid ? t("err_positive") : null}
        keyboardType="decimal-pad"
        placeholder={localeNumPlaceholder}
        accessibilityHint={t("total_optional")}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1] }}>
        {TOTAL_UNITS.map((id) => {
          const selected = id === totalUnit;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={t(`unit_${id}`)}
              accessibilityState={{ selected }}
              onPress={() => {
                setTotalUnit(id);
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

      {/* 5 — Live answer card (no button) */}
      {result ? (
        <>
          {savedNote ? (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: colors.success,
                fontSize: 13,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("history_saved")}
            </Text>
          ) : null}
          {result.deed ? (
            <ResultCard deed={result.deed} />
          ) : (
            <View
              accessibilityRole="summary"
              accessibilityLabel={`${t("result")}: ${result.chainText}, ${result.ratioText} ${t("ratio_share")}, ${result.percentText}%`}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
                borderWidth: 1,
                borderRadius: radius.lg,
                padding: spacing[4],
                gap: spacing[2],
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {t("result")}
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 28,
                  lineHeight: 36,
                  fontWeight: "700",
                  textAlign: "center",
                  fontFamily: typography.fonts.bengali,
                }}
              >
                {result.chainText}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "baseline",
                  gap: spacing[4],
                }}
              >
                <Text
                  style={{
                    color: colors.onSurface,
                    fontSize: 20,
                    fontWeight: "600",
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {result.ratioText} {t("ratio_share")}
                </Text>
                <Text
                  style={{
                    color: colors.onSurface,
                    fontSize: 20,
                    fontWeight: "600",
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {result.percentText}%
                </Text>
              </View>
            </View>
          )}
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
            {t("empty_hisab_hint")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
