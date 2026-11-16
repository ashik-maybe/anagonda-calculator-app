import { Text, View } from "react-native";
import { useThemeColors, radius, spacing, typography } from "../constants/theme";
import { t, useLocale } from "../lib/i18n";
import { convert, unitFactor } from "../lib/units";
import { conversionStrip, formatLand } from "../lib/deed";
import type { Fraction } from "../lib/fraction";
import { div } from "../lib/fraction";
import { useRates } from "./RatesProvider";

/** Area display in square feet, square metres, and the shoto/katha/bigha/acre strip. */
export function AreaCard({
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
