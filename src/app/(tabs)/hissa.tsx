import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useThemeColors, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { SegmentedControl } from "../../components/SegmentedControl";
import { HisabForm } from "../../components/HisabForm";
import { ReverseForm } from "../../components/ReverseForm";
import { BontonForm } from "../../components/BontonForm";
import { RecentList } from "../../components/RecentList";
import { SHAPE_ORDER, type ShapeId } from "../../lib/shapes";
import { listHistory, type HistoryEntry } from "../../lib/storage";
import { hapticTick } from "../../lib/haptics";

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

/** Porimap rows reopen the measure tab with their shape and dimensions restored. */
function readPorimapParams(inputJson: string): { shape: string; inputs: string } | null {
  try {
    const parsed = JSON.parse(inputJson) as { mode?: unknown; shape?: unknown; inputs?: unknown };
    if (
      parsed.mode !== "porimap" ||
      typeof parsed.shape !== "string" ||
      !SHAPE_ORDER.includes(parsed.shape as ShapeId)
    ) {
      return null;
    }
    const inputs =
      parsed.inputs !== null && typeof parsed.inputs === "object" && !Array.isArray(parsed.inputs)
        ? JSON.stringify(parsed.inputs)
        : "{}";
    return { shape: parsed.shape, inputs };
  } catch {
    return null;
  }
}

export default function HishabScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string }>();
  const [mode, setMode] = useState<HishabMode>(() => detectMode(params.prefill));
  const [prefill, setPrefill] = useState<string | undefined>(params.prefill);
  // Bumped on every card tap so the same entry still remounts its form.
  const [openNonce, setOpenNonce] = useState(0);
  const [recent, setRecent] = useState<HistoryEntry[]>([]);

  // Autosaves land while the tab is unfocused; refresh whenever it regains focus.
  useFocusEffect(
    useCallback(() => {
      setRecent(listHistory().slice(0, 3));
    }, []),
  );

  // Re-detect only when the navigation prefill changes (manual segment taps win otherwise).
  useEffect(() => {
    setPrefill(params.prefill);
    const next = detectMode(params.prefill);
    setMode((prev) => (prev === next ? prev : next));
  }, [params.prefill]);

  const onOpenEntry = (entry: HistoryEntry): void => {
    hapticTick();
    const porimap = readPorimapParams(entry.inputJson);
    if (porimap) {
      router.push({ pathname: "/(tabs)/land", params: porimap });
      return;
    }
    setPrefill(entry.inputJson);
    setMode(detectMode(entry.inputJson));
    setOpenNonce((n) => n + 1);
  };

  const formKey = `${prefill ?? "blank"}-${openNonce}`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      style={{ flex: 1 }}
    >
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ padding: spacing[3], paddingBottom: 0, gap: spacing[2] }}>
          {recent.length > 0 ? (
            <RecentList entries={recent} onOpen={onOpenEntry} locale={locale} />
          ) : (
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontFamily: typography.fonts.bengali,
                fontSize: 13,
                paddingVertical: spacing[1],
                textAlign: "center",
              }}
            >
              {t("hissa_glyph_hint")}
            </Text>
          )}
          <SegmentedControl
            accessibilityLabel={t("tab_hissa")}
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
        <View
          key={`hishab-${formKey}`}
          style={{ flex: 1, display: mode === "hishab" ? "flex" : "none" }}
        >
          <HisabForm prefill={prefill} />
        </View>
        <View
          key={`reverse-${formKey}`}
          style={{ flex: 1, display: mode === "reverse" ? "flex" : "none" }}
        >
          <ReverseForm prefill={prefill} />
        </View>
        <View
          key={`bonton-${formKey}`}
          style={{ flex: 1, display: mode === "bonton" ? "flex" : "none" }}
        >
          <BontonForm prefill={prefill} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
