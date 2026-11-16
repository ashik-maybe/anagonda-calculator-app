import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useThemeColors, radius, spacing, typography } from "../../constants/theme";
import { t, useLocale } from "../../lib/i18n";
import { SegmentedControl } from "../../components/SegmentedControl";
import { HisabForm } from "../../components/HisabForm";
import { ReverseForm } from "../../components/ReverseForm";
import { BontonForm } from "../../components/BontonForm";
import { entryToDeed, entryToRow, formatEntryDate } from "../../lib/historyView";
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
  const [last, setLast] = useState<HistoryEntry | null>(null);

  // Autosaves land while the tab is unfocused; refresh whenever it regains focus.
  useFocusEffect(
    useCallback(() => {
      setLast(listHistory()[0] ?? null);
    }, []),
  );

  // Re-detect only when the navigation prefill changes (manual segment taps win otherwise).
  useEffect(() => {
    setPrefill(params.prefill);
    const next = detectMode(params.prefill);
    setMode((prev) => (prev === next ? prev : next));
  }, [params.prefill]);

  const onOpenLast = (): void => {
    if (!last) return;
    hapticTick();
    const porimap = readPorimapParams(last.inputJson);
    if (porimap) {
      router.push({ pathname: "/(tabs)/land", params: porimap });
      return;
    }
    setPrefill(last.inputJson);
    setMode(detectMode(last.inputJson));
    setOpenNonce((n) => n + 1);
  };

  const deed = last ? entryToDeed(last, locale) : null;
  const row = last ? entryToRow(last, locale) : null;
  const lastDate = last ? formatEntryDate(last.createdAt, locale) : "";
  const lastTitle = deed?.chainText ?? row?.title ?? "";
  const lastSubtitle = deed ? `${deed.areaText} ${t("unit_shoto")} · ${lastDate}` : lastDate;
  const formKey = `${prefill ?? "blank"}-${openNonce}`;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ padding: spacing[3], paddingBottom: 0, gap: spacing[2] }}>
        {last ? (
          <Pressable
            accessibilityLabel={`${t("home_last_result")}: ${lastTitle}`}
            accessibilityRole="button"
            onPress={onOpenLast}
            style={({ pressed }) => [
              {
                alignItems: "center",
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
                borderRadius: radius.lg,
                borderWidth: 1,
                flexDirection: "row",
                gap: spacing[2],
                minHeight: 64,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
              },
              pressed && { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <View style={{ flex: 1, gap: spacing[0] }}>
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                {t("home_last_result")}
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: typography.fonts.bengali,
                  fontSize: typography.sizes[3],
                  fontWeight: "700",
                }}
              >
                {lastTitle}
              </Text>
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontFamily: typography.fonts.bengali,
                  fontSize: 13,
                }}
              >
                {lastSubtitle}
              </Text>
            </View>
            <ChevronRight color={colors.onSurfaceVariant} size={20} />
          </Pressable>
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
  );
}
