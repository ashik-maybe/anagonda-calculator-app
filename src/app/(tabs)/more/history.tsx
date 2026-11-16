import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useThemeColors, spacing, typography, radius } from "../../../constants/theme";
import { t, useLocale } from "../../../lib/i18n";
import { HistoryRow } from "../../../components/HistoryRow";
import { TonalButton } from "../../../components/TonalButton";
import { entryToDeed, entryToRow, formatEntryDate } from "../../../lib/historyView";
import { clearHistory, deleteHistory, listHistory, type HistoryEntry } from "../../../lib/storage";
import { hapticSuccess, hapticTick, hapticWarning } from "../../../lib/haptics";

export default function HistoryScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<HistoryEntry[]>([]);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setRows(listHistory());
    }, []),
  );

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

  const onDelete = (id: number): void => {
    hapticTick();
    deleteHistory(id);
    setRows(listHistory());
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
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
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/hissa",
                    params: { prefill: item.inputJson },
                  })
                }
                onDelete={() => onDelete(item.id)}
              />
            );
          }}
        />
      )}

      {rows.length > 0 ? (
        <TonalButton
          label={armed ? t("history_clear_confirm") : t("history_clear")}
          variant="destructive"
          onPress={onClear}
        />
      ) : null}
    </View>
  );
}
