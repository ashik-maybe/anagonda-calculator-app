import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { radius, spacing, typography, useThemeColors } from "../constants/theme";
import { t } from "../lib/i18n";
import { entryToDeed, entryToRow, formatEntryDate } from "../lib/historyView";
import type { HistoryEntry } from "../lib/storage";

type Props = {
  readonly entries: readonly HistoryEntry[];
  readonly onOpen: (entry: HistoryEntry) => void;
  readonly locale: "bn" | "en";
};

export function RecentList({ entries, onOpen, locale }: Props) {
  const { colors } = useThemeColors();
  const router = useRouter();
  const rows = entries.slice(0, 3);
  const rowsStyle = makeStyles(colors);

  return (
    <View style={rowsStyle.container}>
      <Text style={rowsStyle.header}>{t("recent_title")}</Text>
      {rows.map((entry) => {
        const deed = entryToDeed(entry, locale);
        const row = entryToRow(entry, locale);
        const date = formatEntryDate(entry.createdAt, locale);
        const title = deed?.chainText ?? row.title;
        const subtitle = deed
          ? `${deed.areaText} ${t("unit_shoto")} · ${date}`
          : `${row.subtitle} · ${date}`;
        return (
          <Pressable
            key={entry.id}
            accessibilityLabel={`${title}, ${subtitle}`}
            accessibilityRole="button"
            onPress={() => onOpen(entry)}
            style={({ pressed }) => [
              rowsStyle.row,
              pressed && { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <View style={rowsStyle.rowText}>
              <Text numberOfLines={1} style={rowsStyle.rowTitle}>
                {title}
              </Text>
              <Text numberOfLines={1} style={rowsStyle.rowSubtitle}>
                {subtitle}
              </Text>
            </View>
            <ChevronRight color={colors.onSurfaceVariant} size={20} />
          </Pressable>
        );
      })}
      <Pressable
        accessibilityLabel={locale === "bn" ? "সব দেখুন" : "See all"}
        accessibilityRole="button"
        onPress={() => router.push("/more/history")}
        style={({ pressed }) => [
          rowsStyle.footer,
          pressed && { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <Text style={rowsStyle.footerText}>{locale === "bn" ? "সব দেখুন" : "See all"}</Text>
        <ChevronRight color={colors.primary} size={20} />
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    container: { gap: spacing[2] },
    header: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    row: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.outlineVariant,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing[2],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    rowText: { flex: 1, gap: spacing[0] },
    rowTitle: {
      color: colors.primary,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[2],
      fontWeight: "700",
    },
    rowSubtitle: {
      color: colors.onSurfaceVariant,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[0],
    },
    footer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 44,
      paddingHorizontal: spacing[2],
    },
    footerText: {
      color: colors.primary,
      fontFamily: typography.fonts.bengali,
      fontSize: typography.sizes[1],
      fontWeight: "600",
    },
  });
}
