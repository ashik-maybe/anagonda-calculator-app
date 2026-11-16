import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useThemeColors, spacing } from "../../constants/theme";
import { t } from "../../lib/i18n";
import { SegmentedControl } from "../../components/SegmentedControl";
import { HisabForm } from "../../components/HisabForm";
import { ReverseForm } from "../../components/ReverseForm";
import { BontonForm } from "../../components/BontonForm";

type HishabMode = "hishab" | "reverse" | "bonton";

/** Prefill is a navigation-time signal describing which model the entry came from. */
function detectMode(prefill?: string): HishabMode {
  if (!prefill) return "hishab";
  try {
    const parsed = JSON.parse(prefill) as { mode?: unknown };
    if (parsed.mode === "bonton") return "bonton";
    if (parsed.mode === "reverse") return "reverse";
    return "hishab";
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
          onChange={(key) => {
            const next: HishabMode =
              key === "bonton" ? "bonton" : key === "reverse" ? "reverse" : "hishab";
            setMode(next);
          }}
          segments={[
            { key: "hishab", label: t("quick_hishab") },
            { key: "reverse", label: t("quick_reverse") },
            { key: "bonton", label: t("quick_bonton") },
          ]}
          value={mode}
        />
      </View>
      {/* Keep all forms mounted so typed input survives segment switches. */}
      <View style={{ flex: 1, display: mode === "hishab" ? "flex" : "none" }}>
        <HisabForm prefill={params.prefill} />
      </View>
      <View style={{ flex: 1, display: mode === "reverse" ? "flex" : "none" }}>
        <ReverseForm prefill={params.prefill} />
      </View>
      <View style={{ flex: 1, display: mode === "bonton" ? "flex" : "none" }}>
        <BontonForm prefill={params.prefill} />
      </View>
    </View>
  );
}
