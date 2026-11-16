import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Check, CircleAlert, RotateCcw } from "lucide-react-native";
import { useRates } from "../../../components/RatesProvider";
import { parseRate } from "../../../lib/rates";
import { hapticError, hapticSuccess, hapticWarning } from "../../../lib/haptics";
import { radius, spacing, typography, useThemeColors } from "../../../constants/theme";
import { t, useLocale } from "../../../lib/i18n";
import { toDecimalString, type Fraction } from "../../../lib/fraction";
import { InputCard } from "../../../components/InputCard";
import { TonalButton } from "../../../components/TonalButton";

const rateInput = (f: Fraction): string => toDecimalString(f, 6).replace(/\.?0+$/, "");

export default function RatesScreen() {
  const { colors } = useThemeColors();
  const { rates, isCustom, setRates, resetRates } = useRates();
  const locale = useLocale();

  const [kathaDraft, setKathaDraft] = useState(() => rateInput(rates.kathaSqft));
  const [bighaDraft, setBighaDraft] = useState(() => rateInput(rates.bighaSqft));
  const [note, setNote] = useState(false);
  const [armed, setArmed] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (noteTimer.current !== undefined) clearTimeout(noteTimer.current);
      if (armTimer.current !== undefined) clearTimeout(armTimer.current);
    };
  }, []);

  const kathaErr =
    kathaDraft.trim() !== "" && parseRate(kathaDraft) === null ? "err_positive" : null;
  const bighaErr =
    bighaDraft.trim() !== "" && parseRate(bighaDraft) === null ? "err_positive" : null;

  const showNote = () => {
    setNote(true);
    if (noteTimer.current !== undefined) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(false), 1600);
  };

  const handleSave = () => {
    const k = parseRate(kathaDraft);
    const b = parseRate(bighaDraft);
    if (k === null || b === null) {
      hapticError();
      return;
    }
    setRates({ kathaSqft: k, bighaSqft: b });
    hapticSuccess();
    showNote();
  };

  const handleReset = () => {
    if (!armed) {
      hapticWarning();
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (armTimer.current !== undefined) clearTimeout(armTimer.current);
    setArmed(false);
    resetRates();
    hapticSuccess();
    showNote();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {isCustom ? (
        <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
          <Check color={colors.onPrimaryContainer} size={14} />
          <Text style={[styles.badgeText, { color: colors.onPrimaryContainer }]}>
            {t("rates_badge")}
          </Text>
        </View>
      ) : null}

      <InputCard
        accessibilityHint={t("rates_katha")}
        error={kathaErr ? t(kathaErr) : null}
        keyboardType="decimal-pad"
        label={t("rates_katha")}
        onChangeText={setKathaDraft}
        placeholder={locale === "bn" ? "৭২০" : "720"}
        value={kathaDraft}
      />
      <InputCard
        accessibilityHint={t("rates_bigha")}
        error={bighaErr ? t(bighaErr) : null}
        keyboardType="decimal-pad"
        label={t("rates_bigha")}
        onChangeText={setBighaDraft}
        placeholder={locale === "bn" ? "১৪৪০০" : "14400"}
        value={bighaDraft}
      />

      <TonalButton label={t("rates_save")} onPress={handleSave} variant="filled" />

      <View style={styles.resetRow}>
        <RotateCcw color={colors.primary} size={18} />
        <View style={styles.resetButton}>
          <TonalButton
            label={armed ? t("history_clear_confirm") : t("rates_reset")}
            onPress={handleReset}
            variant="outlined"
          />
        </View>
      </View>

      {note ? (
        <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.success }]}>
          {t("rates_saved")}
        </Text>
      ) : null}

      <View style={styles.disclaimerRow}>
        <CircleAlert color={colors.onSurfaceVariant} size={14} />
        <Text style={[styles.disclaimer, { color: colors.onSurfaceVariant }]}>
          {t("deed_document_governs")}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[3],
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing[1],
    minHeight: 32,
    paddingHorizontal: spacing[3],
  },
  badgeText: {
    fontFamily: typography.fonts.bengali,
    fontSize: 12,
    fontWeight: "600",
  },
  resetRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  resetButton: {
    flex: 1,
  },
  note: {
    fontFamily: typography.fonts.bengali,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  disclaimerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
  },
  disclaimer: {
    flex: 1,
    fontFamily: typography.fonts.bengali,
    fontSize: 12,
  },
});
