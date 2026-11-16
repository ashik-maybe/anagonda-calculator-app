import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, useThemeColors } from "../../../constants/theme";
import { t, useLocale } from "../../../lib/i18n";
import { InputCard } from "../../../components/InputCard";
import glossary from "../../../data/glossary.json";

export default function GlossaryScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary.terms;
    return glossary.terms.filter((term) =>
      [term.term_bn, term.term_en, term.code, term.def_bn, term.def_en]
        .join("\n")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
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
          <View
            key={term.id}
            style={[
              styles.card,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
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
            <Text style={[styles.termEn, { color: colors.onSurfaceVariant }]}>{term.term_en}</Text>
            <Text style={[styles.definition, { color: colors.onSurface }]}>
              {locale === "bn" ? term.def_bn : term.def_en}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[3],
    paddingBottom: spacing[5],
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
