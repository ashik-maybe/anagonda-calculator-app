import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useThemeColors, spacing } from "../../constants/theme";
import { t } from "../../lib/i18n";
import { SegmentedControl } from "../../components/SegmentedControl";
import { HisabForm } from "../../components/HisabForm";
import { BontonForm } from "../../components/BontonForm";

type HishabMode = "hishab" | "bonton";

/** Prefill is a navigation-time signal describing which model the entry came from. */
function detectMode(prefill?: string): HishabMode {
  if (!prefill) return "hishab";
  try {
    const parsed = JSON.parse(prefill) as { mode?: unknown };
    return parsed.mode === "bonton" ? "bonton" : "hishab";
  } catch {
    return "hishab";
  }
}

export default function HishabScreen() {
  const { colors } = useThemeColors();
  const params = useLocalSearchParams<{ prefill?: string }>();
  const [mode, setMode] = useState<HishabMode>(() => detectMode(params.prefill));

  // Re-detect only when the navigation prefill changes (manual segment taps win otherwise).
  useEffect(() => {
    const next = detectMode(params.prefill);
    setMode((prev) => (prev === next ? prev : next));
  }, [params.prefill]);

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ padding: spacing[3], paddingBottom: 0 }}>
        <SegmentedControl
          accessibilityLabel={t("tab_hishab")}
          onChange={(key) => setMode(key === "bonton" ? "bonton" : "hishab")}
          segments={[
            { key: "hishab", label: t("quick_hishab") },
            { key: "bonton", label: t("quick_bonton") },
          ]}
          value={mode}
        />
      </View>
      {/* Keep both forms mounted so typed input survives segment switches. */}
      <View style={{ flex: 1, display: mode === "hishab" ? "flex" : "none" }}>
        <HisabForm prefill={params.prefill} />
      </View>
      <View style={{ flex: 1, display: mode === "bonton" ? "flex" : "none" }}>
        <BontonForm prefill={params.prefill} />
      </View>
    </View>
  );
}
