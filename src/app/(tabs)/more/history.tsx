import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, SectionList, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useThemeColors, spacing, typography, radius } from "../../../constants/theme";
import { t, useLocale } from "../../../lib/i18n";
import { HistoryRow } from "../../../components/HistoryRow";
import { TonalButton } from "../../../components/TonalButton";
import { entryToDeed, entryToRow, formatEntryDate } from "../../../lib/historyView";
import {
  clearHistory,
  deleteHistory,
  insertHistory,
  listHistory,
  type HistoryEntry,
} from "../../../lib/storage";
import { hapticSuccess, hapticTick, hapticWarning } from "../../../lib/haptics";

export default function HistoryScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<HistoryEntry[]>([]);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pendingDelete, setPendingDelete] = useState<HistoryEntry | null>(null);
  const pendingRef = useRef<HistoryEntry | null>(null);
  const restoredRef = useRef(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setRows(listHistory());
    }, []),
  );

  useEffect(() => {
    return () => {
      if (pendingRef.current !== null && !restoredRef.current) {
        deleteHistory(pendingRef.current.id);
      }
      if (undoTimer.current !== null) clearTimeout(undoTimer.current);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((entry) => {
      const deed = entryToDeed(entry, locale);
      const row = entryToRow(entry, locale);
      const hay =
        `${entry.inputJson} ${entry.resultJson} ${row.title} ${row.subtitle} ${row.glyphText ?? ""} ${deed?.chainText ?? ""} ${deed?.areaText ?? ""} ${deed?.sentence ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, locale]);

  const todayStr = useMemo(() => new Date().toDateString(), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toDateString();
  }, []);

  const sections = useMemo(() => {
    const today: HistoryEntry[] = [];
    const yesterday: HistoryEntry[] = [];
    const older: HistoryEntry[] = [];
    for (const entry of filtered) {
      const d = new Date(entry.createdAt).toDateString();
      if (d === todayStr) today.push(entry);
      else if (d === yesterdayStr) yesterday.push(entry);
      else older.push(entry);
    }
    const out: { title: string; data: HistoryEntry[] }[] = [];
    if (today.length > 0) out.push({ title: t("history_group_today"), data: today });
    if (yesterday.length > 0) out.push({ title: t("history_group_yesterday"), data: yesterday });
    if (older.length > 0) out.push({ title: t("history_group_older"), data: older });
    return out;
  }, [filtered, todayStr, yesterdayStr, locale]);

  const onDelete = (id: number): void => {
    const entry = rows.find((r) => r.id === id);
    if (!entry) return;
    hapticTick();
    if (pendingRef.current !== null && !restoredRef.current) {
      deleteHistory(pendingRef.current.id);
    }
    if (undoTimer.current !== null) clearTimeout(undoTimer.current);
    restoredRef.current = false;
    pendingRef.current = entry;
    setRows((prev) => prev.filter((r) => r.id !== id));
    setPendingDelete(entry);
    undoTimer.current = setTimeout(() => {
      if (pendingRef.current !== null && !restoredRef.current) {
        deleteHistory(pendingRef.current.id);
      }
      pendingRef.current = null;
      setPendingDelete(null);
      undoTimer.current = null;
    }, 5000);
  };

  const onUndo = (): void => {
    if (pendingRef.current === null) return;
    restoredRef.current = true;
    if (undoTimer.current !== null) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    const entry = pendingRef.current;
    insertHistory({
      mode: entry.mode,
      inputJson: entry.inputJson,
      resultJson: entry.resultJson,
      createdAt: entry.createdAt,
    });
    pendingRef.current = null;
    setPendingDelete(null);
    setRows(listHistory());
    hapticTick();
  };

  const onClear = (): void => {
    if (!armed) {
      hapticWarning();
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (armTimer.current) clearTimeout(armTimer.current);
    clearHistory();
    setArmed(false);
    setRows(listHistory());
    hapticSuccess();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        gap: spacing[2],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[2],
          backgroundColor: colors.surfaceVariant,
          borderRadius: radius.full,
          paddingHorizontal: spacing[3],
          minHeight: 48,
        }}
      >
        <Search color={colors.onSurfaceVariant} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("search")}
          placeholderTextColor={colors.onSurfaceVariant}
          accessibilityLabel={t("search")}
          style={{
            flex: 1,
            color: colors.onSurface,
            fontSize: 15,
            fontFamily: typography.fonts.bengali,
            minHeight: 44,
          }}
        />
      </View>

      {filtered.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 14,
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("history_empty")}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderSectionHeader={({ section }) => (
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 1,
                fontFamily: typography.fonts.bengali,
                paddingVertical: spacing[1],
                marginTop: spacing[2],
              }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const row = entryToRow(item, locale);
            return (
              <HistoryRow
                title={row.title}
                subtitle={row.subtitle}
                glyphText={row.glyphText}
                meta={formatEntryDate(item.createdAt, locale)}
                deleteLabel={t("history_delete")}
                locale={locale}
                onPress={() => {
                  if (item.mode === "porimap") {
                    try {
                      const parsed = JSON.parse(item.inputJson) as {
                        shape?: unknown;
                        inputs?: unknown;
                      };
                      const shape = typeof parsed.shape === "string" ? parsed.shape : undefined;
                      const inputs =
                        parsed.inputs && typeof parsed.inputs === "object"
                          ? (parsed.inputs as Record<string, unknown>)
                          : undefined;
                      if (shape && inputs) {
                        router.push({
                          pathname: "/(tabs)/land",
                          params: { shape, inputs: JSON.stringify(inputs) },
                        });
                        return;
                      }
                    } catch {
                      // fall through to hissa prefill
                    }
                  }
                  if (item.mode === "convert") {
                    try {
                      const parsed = JSON.parse(item.inputJson) as {
                        value?: unknown;
                        from?: unknown;
                        to?: unknown;
                      };
                      if (
                        typeof parsed.value === "string" &&
                        typeof parsed.from === "string" &&
                        typeof parsed.to === "string"
                      ) {
                        router.push({
                          pathname: "/(tabs)/convert",
                          params: { value: parsed.value, from: parsed.from, to: parsed.to },
                        });
                        return;
                      }
                    } catch {
                      // fall through to hissa prefill
                    }
                  }
                  router.push({
                    pathname: "/(tabs)/hissa",
                    params: { prefill: item.inputJson },
                  });
                }}
                onDelete={() => onDelete(item.id)}
              />
            );
          }}
          ListFooterComponent={
            rows.length > 0 ? (
              <View style={{ marginTop: spacing[2] }}>
                <TonalButton
                  label={armed ? t("history_clear_confirm") : t("history_clear")}
                  variant="destructive"
                  onPress={onClear}
                />
              </View>
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: spacing[4] }}
        />
      )}

      {pendingDelete !== null ? (
        <View
          style={{
            position: "absolute",
            left: spacing[3],
            right: spacing[3],
            bottom: spacing[3],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing[3],
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              flex: 1,
              color: colors.onSurface,
              fontSize: 14,
              fontFamily: typography.fonts.bengali,
            }}
          >
            {t("history_deleted")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("undo")}
            onPress={onUndo}
            style={{
              minHeight: 36,
              paddingHorizontal: spacing[3],
              borderRadius: radius.md,
              backgroundColor: colors.primaryContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: colors.onPrimaryContainer,
                fontSize: 14,
                fontWeight: "600",
                fontFamily: typography.fonts.bengali,
              }}
            >
              {t("undo")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
