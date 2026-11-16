import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Share, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Check, CircleAlert } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import {
  CHAIN_KEYS,
  parseChainPart,
  parseTotalShoto,
  validateChain,
  type ChainKey,
} from "../lib/validate";
import { cmp, isZero, mul, ONE, sub, type Fraction } from "../lib/fraction";
import { shareArea, shareFraction, type AnaParts } from "../lib/share";
import {
  decomposeShare,
  formatChain,
  formatShareChain,
  type ChainLabels,
} from "../lib/decomposition";
import { buildDeedResult, formatLand, type DeedResult } from "../lib/deed";
import { insertHistory } from "../lib/storage";
import { hapticSuccess, hapticTick, hapticWarning } from "../lib/haptics";
import {
  MAX_OWNERS,
  buildBontonShareText,
  sumShares,
  sumState,
  type OwnerShareRow,
  type SumState,
} from "../lib/owners";
import { InputCard } from "./InputCard";
import { TonalButton } from "./TonalButton";
import { OwnerRow } from "./OwnerRow";
import { ShareBar } from "./ShareBar";
import ResultCard from "./ResultCard";
import { useRates } from "./RatesProvider";

type BontonOwner = {
  readonly id: number;
  readonly name: string;
  readonly parts: Record<ChainKey, string>;
};

type OwnerInit = { readonly name?: string; readonly parts?: Record<string, unknown> };
type ParsedRow = {
  readonly owner: BontonOwner;
  readonly parts: AnaParts;
  readonly share: Fraction;
  readonly area: Fraction | null;
};

const emptyParts = (): Record<ChainKey, string> => ({
  ana: "",
  gonda: "",
  kora: "",
  kranti: "",
  til: "",
});

function ownerFromInit(id: number, init: OwnerInit): BontonOwner {
  const parts = emptyParts();
  if (init.parts && typeof init.parts === "object") {
    for (const key of CHAIN_KEYS) {
      const v = init.parts[key];
      if (typeof v === "string" || typeof v === "number") parts[key] = String(v);
    }
  }
  return { id, name: typeof init.name === "string" ? init.name : "", parts };
}

function prefillOwners(raw: unknown): BontonOwner[] {
  if (!Array.isArray(raw)) return [];
  const list = raw.filter((o): o is OwnerInit => typeof o === "object" && o !== null);
  return list.slice(0, MAX_OWNERS).map((o, i) => ownerFromInit(i + 1, o));
}

function prefillToState(prefill?: string): { total: string; owners: BontonOwner[] } | null {
  if (!prefill) return null;
  try {
    const parsed = JSON.parse(prefill) as {
      mode?: unknown;
      totalShoto?: unknown;
      owners?: unknown;
    };
    if (parsed.mode !== "bonton") return null;
    if (typeof parsed.totalShoto !== "string") return null;
    return { total: parsed.totalShoto, owners: prefillOwners(parsed.owners) };
  } catch {
    return null;
  }
}

let nextId = 1000;
const toNumber = (f: Fraction): number => Number(f.num) / Number(f.den);

export function BontonForm({ prefill }: { readonly prefill?: string }) {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const { rates } = useRates();
  const params = useLocalSearchParams<{ prefill?: string }>();
  const init = useMemo(() => prefillToState(prefill ?? params.prefill), [prefill, params.prefill]);

  const [totalShoto, setTotalShoto] = useState(() => init?.total ?? "");
  const [owners, setOwners] = useState<BontonOwner[]>(() => init?.owners ?? []);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [savedNote, setSavedNote] = useState(false);
  const prevSumState = useRef<SumState>("under");

  const labels: ChainLabels = {
    ana: t("ana"),
    gonda: t("gonda"),
    kora: t("kora"),
    kranti: t("kranti"),
    til: t("til"),
  };

  const total = useMemo(() => parseTotalShoto(totalShoto), [totalShoto]);
  const totalError = totalShoto.trim() !== "" && total === null ? "err_positive" : null;

  const rows = useMemo<ParsedRow[]>(
    () =>
      owners.map((o) => {
        const parts: AnaParts = {
          ana: parseChainPart(o.parts.ana) ?? 0,
          gonda: parseChainPart(o.parts.gonda) ?? 0,
          kora: parseChainPart(o.parts.kora) ?? 0,
          kranti: parseChainPart(o.parts.kranti) ?? 0,
          til: parseChainPart(o.parts.til) ?? 0,
        };
        return {
          owner: o,
          parts,
          share: shareFraction(parts),
          area: total ? shareArea(total, parts) : null,
        };
      }),
    [owners, total],
  );

  const sum = useMemo(() => sumShares(rows.map((r) => r.parts)), [rows]);
  const state = sumState(sum);

  // Haptic only on entering the over state (avoid per-keystroke spam).
  useEffect(() => {
    if (state === "over" && prevSumState.current !== "over") {
      hapticWarning();
    }
    prevSumState.current = state;
  }, [state]);

  const shareDeed = useMemo<DeedResult | null>(() => {
    if (!total) return null;
    return buildDeedResult(
      {
        totalShoto: total,
        share: sum,
        shareArea: mul(total, sum),
        chain: decomposeShare(sum),
        rates,
      },
      locale,
    );
  }, [total, sum, locale, rates]);

  // Per-owner deeds for the expanded cards (built only when needed).
  const deedById = useMemo(() => {
    const map = new Map<number, DeedResult>();
    if (!total) return map;
    for (const r of rows) {
      if (!r.area) continue;
      map.set(
        r.owner.id,
        buildDeedResult(
          {
            totalShoto: total,
            share: r.share,
            shareArea: r.area,
            chain: decomposeShare(r.share),
            rates,
          },
          locale,
        ),
      );
    }
    return map;
  }, [total, rows, locale, rates]);

  // Debounced auto-save: storage dedupes identical payloads and caps at 50.
  useEffect(() => {
    if (!shareDeed) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const res = insertHistory({
        mode: "bonton",
        inputJson: JSON.stringify({
          mode: "bonton",
          totalShoto: totalShoto.trim(),
          owners: rows.map((r) => ({ name: r.owner.name, parts: r.parts })),
        }),
        resultJson: JSON.stringify({
          sum: { num: sum.num.toString(), den: sum.den.toString() },
          owners: rows.map((r) => ({
            share: { num: r.share.num.toString(), den: r.share.den.toString() },
            area: r.area ? { num: r.area.num.toString(), den: r.area.den.toString() } : null,
          })),
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
    // Runs on every valid-result change; storage dedupes identical payloads.
  }, [shareDeed, rows, sum, totalShoto]);

  const setPart = (id: number) => (key: ChainKey) => (value: string) =>
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, parts: { ...o.parts, [key]: value } } : o)),
    );

  const setName = (id: number) => (value: string) =>
    setOwners((prev) => prev.map((o) => (o.id === id ? { ...o, name: value } : o)));

  const addOwner = () => {
    setOwners((prev) =>
      prev.length >= MAX_OWNERS ? prev : [...prev, { id: nextId++, name: "", parts: emptyParts() }],
    );
  };

  const removeOwner = (id: number) => {
    hapticTick();
    setOwners((prev) => prev.filter((o) => o.id !== id));
  };

  const onShare = async () => {
    hapticTick();
    try {
      const shareRows: OwnerShareRow[] = rows.map((r) => ({
        name: r.owner.name,
        chainText: formatChain(decomposeShare(r.share), labels, locale),
        areaText: r.area ? formatLand(r.area, 2, locale) : "0.00",
      }));
      const totalText = total ? formatLand(total, 2, locale) : "0.00";
      const text = buildBontonShareText(shareRows, {
        totalText,
        sumChainText: formatShareChain(sum, labels, locale),
        state,
        locale,
        unitLabel: t("unit_shoto"),
        ownerCount: t("owner_count"),
      });
      await Share.share({ message: text });
    } catch {
      // user cancelled the share sheet
    }
  };

  const sumChainText = formatShareChain(sum, labels, locale);
  const remainderText = state === "under" ? formatShareChain(sub(ONE, sum), labels, locale) : null;
  const canAdd = owners.length < MAX_OWNERS;

  const footerStyle =
    state === "over"
      ? { borderColor: colors.error, borderWidth: 1.5 }
      : state === "equal"
        ? { borderColor: colors.success, borderWidth: 1.5 }
        : { borderColor: colors.outlineVariant, borderWidth: 1 };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3], paddingBottom: spacing[5], gap: spacing[3] }}
      keyboardShouldPersistTaps="handled"
    >
      <InputCard
        label={t("total_shoto")}
        value={totalShoto}
        onChangeText={setTotalShoto}
        error={totalError ? t(totalError) : null}
        keyboardType="decimal-pad"
        placeholder="0.00"
        accessibilityHint={t("total_shoto")}
      />

      {rows.map((row) => {
        const o = row.owner;
        const chainErrors = validateChain(o.parts);
        const partErrors = Object.fromEntries(
          Object.entries(chainErrors).map(([k, v]) => [k, v ? t(v) : null]),
        );
        const shareText = formatChain(decomposeShare(row.share), labels, locale);
        const areaText = row.area ? formatLand(row.area, 2, locale) : "0.00";
        const barState = cmp(row.share, ONE) > 0 ? "over" : isZero(row.share) ? "under" : "ok";
        const deed = deedById.get(o.id) ?? null;
        return (
          <OwnerRow
            key={o.id}
            areaText={`${areaText} ${t("unit_shoto")}`}
            barState={barState}
            expanded={Boolean(expanded[o.id])}
            expandLabel={t("owners")}
            fractionOfWhole={toNumber(row.share)}
            labels={labels}
            locale={locale}
            name={o.name}
            nameError={null}
            namePlaceholder={t("owner_name")}
            onPartChange={setPart(o.id)}
            onNameChange={setName(o.id)}
            onRemove={() => removeOwner(o.id)}
            onToggleExpand={() => setExpanded((prev) => ({ ...prev, [o.id]: !prev[o.id] }))}
            partErrors={partErrors}
            parts={o.parts}
            removeLabel={t("history_delete")}
            shareText={shareText}
          >
            {deed ? <ResultCard deed={deed} /> : null}
          </OwnerRow>
        );
      })}

      {owners.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.outlineVariant,
            borderRadius: radius.md,
            paddingVertical: spacing[4],
            alignItems: "center",
            gap: spacing[2],
          }}
        >
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 14,
              fontFamily: typography.fonts.bengali,
              textAlign: "center",
            }}
          >
            {t("empty_hisab_hint")}
          </Text>
        </View>
      ) : null}

      <TonalButton
        label={t("add_owner")}
        onPress={addOwner}
        variant="tonal"
        disabled={!canAdd}
        accessibilityHint={t("owner_limit")}
      />
      {!canAdd ? (
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            textAlign: "center",
            fontFamily: typography.fonts.bengali,
          }}
        >
          {t("owner_limit")}
        </Text>
      ) : null}

      {owners.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.md,
            padding: spacing[3],
            gap: spacing[2],
            ...footerStyle,
          }}
        >
          <ShareBar
            accessibilityLabel={t("sum_ok")}
            accessibilityValue={sumChainText}
            fractionOfWhole={toNumber(sum)}
            state={state === "equal" ? "ok" : state}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
            {state === "equal" ? (
              <Check color={colors.success} size={18} />
            ) : state === "over" ? (
              <CircleAlert color={colors.error} size={18} />
            ) : null}
            <Text
              style={{
                color:
                  state === "over"
                    ? colors.error
                    : state === "equal"
                      ? colors.success
                      : colors.onSurfaceVariant,
                fontSize: 13,
                fontWeight: "600",
                fontFamily: typography.fonts.bengali,
              }}
            >
              {state === "equal"
                ? t("sum_ok")
                : state === "over"
                  ? t("over_cap")
                  : `${t("sum_remainder")}: ${remainderText}`}
            </Text>
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12,
                fontFamily: typography.fonts.bengali,
              }}
            >
              {sumChainText}
            </Text>
          </View>
        </View>
      ) : null}

      {shareDeed ? (
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
          <ResultCard deed={shareDeed} />
          <TonalButton label={t("share")} onPress={() => void onShare()} variant="filled" />
        </>
      ) : null}
    </ScrollView>
  );
}
