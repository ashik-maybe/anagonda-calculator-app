import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { TonalButton } from "../../../components/TonalButton";
import { useRates } from "../../../components/RatesProvider";
import { radius, spacing, typography, useThemeColors } from "../../../constants/theme";
import { formatLand } from "../../../lib/deed";
import { groupDigits, toBanglaDigits } from "../../../lib/digits";
import {
  div,
  frac,
  ONE,
  parseDecimal,
  toDecimalString,
  type Fraction,
} from "../../../lib/fraction";
import { t, useLocale, type Locale } from "../../../lib/i18n";
import units from "../../../data/units.json";

/** Live rate as a trimmed decimal string with locale digits + grouping. */
const liveRateText = (f: Fraction, locale: Locale): string => {
  const s = toDecimalString(f, 6).replace(/\.?0+$/, "");
  const grouped = groupDigits(s, locale);
  return locale === "bn" ? toBanglaDigits(grouped) : grouped;
};

/** Exact sqft factor text at the JSON string's own precision, capped at 4dp. */
const factorText = (s: string, locale: Locale): string => {
  const parsed = parseDecimal(s);
  if (parsed === null) return s;
  const dp = s.includes(".") ? Math.min(s.split(".")[1]?.length ?? 0, 4) : 0;
  return formatLand(parsed, dp, locale);
};

/** Exact 2dp rendering of a decimal string from units.json (e.g. "0.66"). */
const decimalText = (s: string, locale: Locale): string => {
  const parsed = parseDecimal(s);
  return parsed === null ? s : formatLand(parsed, 2, locale);
};

// Share chain derived only from units.json factors (never hardcoded).
const factors = units.shareChain.factors;
const gondaPerAna = frac(factors.gonda);
const koraPerGonda = div(frac(factors.kora), frac(factors.gonda));
const krantiPerKora = div(frac(factors.kranti), frac(factors.kora));
const tilPerKranti = div(frac(factors.til), frac(factors.kranti));
const tilPerAna = frac(factors.til);

export default function EncyclopediaScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const { rates, isCustom } = useRates();

  const n = (f: Fraction): string => formatLand(f, 0, locale);

  const shareLines = [
    `${n(ONE)} ${t("ana")} = ${n(gondaPerAna)} ${t("gonda")}`,
    `${n(ONE)} ${t("gonda")} = ${n(koraPerGonda)} ${t("kora")}`,
    `${n(ONE)} ${t("kora")} = ${n(krantiPerKora)} ${t("kranti")}`,
    `${n(ONE)} ${t("kranti")} = ${n(tilPerKranti)} ${t("til")}`,
    `${n(ONE)} ${t("ana")} = ${n(tilPerAna)} ${t("til")}`,
  ];

  const guniaLines = Object.entries(units.gunia.scaleLinksPerInch)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(
      ([scale, linksPerInch]) =>
        `${n(frac(Number(scale)))} ${t("unit_chain")} — ${n(frac(linksPerInch))} ${t("unit_link")}`,
    );

  const line = {
    color: colors.onSurface,
    fontSize: 14,
    fontFamily: typography.fonts.bengali,
  } as const;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3], gap: spacing[3], paddingBottom: spacing[5] }}
    >
      {/* 1. Citation card */}
      <View
        style={{
          backgroundColor: colors.surfaceVariant,
          borderRadius: radius.md,
          padding: spacing[3],
          gap: spacing[1],
        }}
      >
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
            fontFamily: typography.fonts.bengali,
          }}
        >
          {t("unit_source")}
        </Text>
        <Text
          style={{
            color: colors.onSurface,
            fontSize: 15,
            fontWeight: "600",
            fontFamily: typography.fonts.bengali,
          }}
        >
          {units.source.name}
        </Text>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            fontFamily: typography.fonts.bengali,
          }}
        >
          {t("unit_as_of")}
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={units.source.url}
          onPress={() => {
            Linking.openURL(units.source.url).catch(() => {});
          }}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              fontWeight: "600",
              fontFamily: typography.fonts.bengali,
            }}
          >
            {units.source.url}
          </Text>
        </Pressable>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 12,
            fontFamily: typography.fonts.bengali,
          }}
        >
          {t("deed_document_governs")}
        </Text>
      </View>

      {/* 2. Absolute-unit table */}
      <View>
        {units.absolute.map((row, index) => {
          const isRateRow = row.rateId !== undefined;
          const isLast = index === units.absolute.length - 1;
          const value = isRateRow
            ? liveRateText(row.rateId === "katha" ? rates.kathaSqft : rates.bighaSqft, locale)
            : factorText(row.sqft, locale);
          return (
            <View
              key={row.id}
              style={{
                minHeight: 44,
                justifyContent: "center",
                borderBottomWidth: isLast ? 0 : 1,
                borderColor: colors.outlineVariant,
                paddingVertical: spacing[2],
                gap: spacing[1],
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing[2],
                }}
              >
                <Text
                  style={{
                    color: colors.onSurface,
                    fontSize: 15,
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {t(`unit_${row.id}`)}
                </Text>
                <Text
                  style={{
                    color: colors.onSurface,
                    fontSize: 15,
                    fontWeight: "600",
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {value}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "400",
                      color: colors.onSurfaceVariant,
                      fontFamily: typography.fonts.bengali,
                    }}
                  >
                    {" "}
                    {t("unit_sqft")}
                  </Text>
                </Text>
              </View>
              {isRateRow && isCustom ? (
                <Text
                  style={{
                    color: colors.onSurfaceVariant,
                    fontSize: 12,
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {t("rates_badge")}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* 3. Share chain */}
      <View
        style={{
          backgroundColor: colors.surfaceVariant,
          borderRadius: radius.md,
          padding: spacing[3],
          gap: spacing[1],
        }}
      >
        {shareLines.map((text) => (
          <Text key={text} style={line}>
            {text}
          </Text>
        ))}
      </View>

      {/* 4. Chain + gunia scale */}
      <View
        style={{
          backgroundColor: colors.surfaceVariant,
          borderRadius: radius.md,
          padding: spacing[3],
          gap: spacing[1],
        }}
      >
        <Text style={line}>
          {t("unit_chain")} {n(frac(Number(units.chain.ft)))} {t("unit_ft")} ·{" "}
          {n(frac(units.chain.links))} {t("unit_link")}
        </Text>
        <Text style={line}>
          {t("unit_link")} {decimalText(units.chain.linkFt, locale)} {t("unit_ft")}
        </Text>
        {guniaLines.map((text) => (
          <Text key={text} style={line}>
            {text}
          </Text>
        ))}
      </View>

      {/* 5. Regional variance caption */}
      <Text
        style={{
          color: colors.onSurfaceVariant,
          fontSize: 12,
          lineHeight: 18,
          fontFamily: typography.fonts.bengali,
        }}
      >
        {t("regional_variance")}
      </Text>

      {/* 6. Rates button */}
      <TonalButton
        label={t("rates")}
        variant="outlined"
        onPress={() => router.push("/more/rates")}
      />
    </ScrollView>
  );
}
