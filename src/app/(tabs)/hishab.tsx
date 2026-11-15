import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import {
  CHAIN_KEYS,
  isHisabValid,
  parseChainPart,
  parseTotalShoto,
  validateHisab,
  type ChainKey,
} from "../../lib/validate";
import { shareArea, shareFraction, type AnaParts } from "../../lib/share";
import { decomposeShare } from "../../lib/decomposition";
import { buildDeedResult } from "../../lib/deed";
import { insertHistory } from "../../lib/storage";
import { hapticSuccess } from "../../lib/haptics";
import { InputCard } from "../../components/InputCard";
import { Stepper } from "../../components/Stepper";
import ResultCard from "../../components/ResultCard";
import { Calculator } from "lucide-react-native";

type ChainState = Record<ChainKey, string>;

const emptyChain = (): ChainState => ({
  ana: "",
  gonda: "",
  kora: "",
  kranti: "",
  til: "",
});

export default function HishabScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const params = useLocalSearchParams<{ prefill?: string }>();

  const [totalShoto, setTotalShoto] = useState("");
  const [chain, setChain] = useState<ChainState>(emptyChain);
  const [savedNote, setSavedNote] = useState(false);

  // Prefill from history (prefill carries the exact stored input JSON).
  useEffect(() => {
    if (!params.prefill) return;
    try {
      const parsed = JSON.parse(params.prefill) as {
        totalShoto?: unknown;
        parts?: Partial<Record<ChainKey, unknown>>;
      };
      if (typeof parsed.totalShoto === "string") {
        setTotalShoto(parsed.totalShoto);
      }
      if (parsed.parts && typeof parsed.parts === "object") {
        const next = emptyChain();
        for (const key of CHAIN_KEYS) {
          const v = parsed.parts[key];
          if (typeof v === "string" || typeof v === "number") next[key] = String(v);
        }
        setChain(next);
      }
    } catch {
      // malformed prefill — start blank, no crash
    }
    // Run once per mount; prefill is a navigation-time signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errors = useMemo(() => validateHisab(totalShoto, chain), [totalShoto, chain]);

  const result = useMemo(() => {
    if (!isHisabValid(errors)) return null;
    const total = parseTotalShoto(totalShoto);
    if (!total) return null;
    const parts: AnaParts = {
      ana: parseChainPart(chain.ana) ?? 0,
      gonda: parseChainPart(chain.gonda) ?? 0,
      kora: parseChainPart(chain.kora) ?? 0,
      kranti: parseChainPart(chain.kranti) ?? 0,
      til: parseChainPart(chain.til) ?? 0,
    };
    const share = shareFraction(parts);
    const area = shareArea(total, parts);
    const decomp = decomposeShare(share);
    return {
      deed: buildDeedResult({ totalShoto: total, share, shareArea: area, chain: decomp }, locale),
      parts,
      share,
      area,
      inputJson: JSON.stringify({ mode: "hishab", totalShoto: totalShoto.trim(), parts }),
    };
  }, [errors, totalShoto, chain, locale]);

  // Debounced auto-save: stable valid result + dedup handled by storage.
  useEffect(() => {
    if (!result) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const res = insertHistory({
        mode: "hishab",
        inputJson: result.inputJson,
        resultJson: JSON.stringify({
          share: { num: result.share.num.toString(), den: result.share.den.toString() },
          area: { num: result.area.num.toString(), den: result.area.den.toString() },
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

  const setPart = (key: ChainKey) => (value: string) =>
    setChain((prev) => ({ ...prev, [key]: value }));

  const chainError = (key: ChainKey): string | null => {
    const err = errors.chain[key];
    return err ? t(err) : null;
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
      <InputCard
        label={t("total_shoto")}
        value={totalShoto}
        onChangeText={setTotalShoto}
        error={totalShoto.trim() !== "" && errors.total ? t(errors.total) : null}
        keyboardType="decimal-pad"
        placeholder="0.00"
        accessibilityHint={t("total_shoto")}
      />

      <View style={{ gap: spacing[2] }}>
        {CHAIN_KEYS.map((key) => (
          <Stepper
            key={key}
            label={t(key)}
            value={chain[key]}
            onChange={setPart(key)}
            error={chainError(key)}
            locale={locale}
          />
        ))}
      </View>

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
          <ResultCard deed={result.deed} />
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
