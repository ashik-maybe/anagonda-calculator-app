import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, useThemeColors } from "../../../constants/theme";
import { t, useLocale } from "../../../lib/i18n";
import { GLOSSARY_CATEGORIES, type GlossaryCategory, searchTerms } from "../../../lib/terms";
import { InputCard } from "../../../components/InputCard";
import { TermSheet } from "../../../components/TermSheet";

type CategoryFilter = GlossaryCategory | "all";

export default function GlossaryScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const byQuery = searchTerms(query);
    return category === "all" ? byQuery : byQuery.filter((term) => term.category === category);
  }, [query, category]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.chipRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <CategoryChip
            key="all"
            label={t("term_sheet_all")}
            selected={category === "all"}
            onPress={() => setCategory("all")}
          />
          {GLOSSARY_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              label={t(cat.labelKey)}
              selected={category === cat.key}
              onPress={() => setCategory(cat.key)}
            />
          ))}
        </ScrollView>

        <InputCard
          accessibilityHint={t("glossary")}
          keyboardType="default"
          label={t("glossary")}
          onChangeText={setQuery}
          placeholder={t("search")}
          value={query}
        />

        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t("glossary_empty")}
            </Text>
          </View>
        ) : (
          filtered.map((term) => (
            <Pressable
              key={term.id}
              accessibilityRole="button"
              accessibilityLabel={`${term.term_bn}, ${t("glossary_card_label")}`}
              onPress={() => setSelectedId(term.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: pressed ? colors.primaryContainer : colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={[styles.termBn, { color: colors.onSurface }]}>{term.term_bn}</Text>
                <Text
                  style={[
                    styles.codeChip,
                    { color: colors.onSurfaceVariant, backgroundColor: colors.surface },
                  ]}
                >
                  {term.code}
                </Text>
              </View>
              <Text style={[styles.termEn, { color: colors.onSurfaceVariant }]}>
                {term.term_en}
              </Text>
              {term.aliases && term.aliases.length > 0 ? (
                <Text style={[styles.aliases, { color: colors.onSurfaceVariant }]}>
                  {t("glossary_aliases")}: {term.aliases.join(", ")}
                </Text>
              ) : null}
              <Text style={[styles.definition, { color: colors.onSurface }]}>
                {locale === "bn" ? term.def_bn : term.def_en}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <TermSheet termId={selectedId} onClose={() => setSelectedId(null)} />
    </View>
  );
}

function CategoryChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primaryContainer : "transparent",
          borderColor: selected ? colors.primary : colors.outlineVariant,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
          fontFamily: typography.fonts.bengali,
          fontSize: typography.sizes[1],
          fontWeight: selected ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[3],
    paddingBottom: spacing[5],
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[3],
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
  },
  termBn: {
    fontFamily: typography.fonts.bengali,
    fontSize: 15,
    fontWeight: "600",
  },
  codeChip: {
    borderRadius: radius.full,
    fontFamily: typography.fonts.bengali,
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    textAlign: "center",
  },
  termEn: {
    fontFamily: typography.fonts.bengali,
    fontSize: 12,
  },
  aliases: {
    fontFamily: typography.fonts.bengali,
    fontSize: 12,
  },
  definition: {
    fontFamily: typography.fonts.bengali,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: radius.md,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingVertical: spacing[5],
  },
  emptyText: {
    fontFamily: typography.fonts.bengali,
    fontSize: 14,
  },
});
