import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, useThemeColors } from "../../../constants/theme";
import { t } from "../../../lib/i18n";
import { OFL_TEXT } from "../../../data/ofl";

type LicenseEntry = {
  readonly name: string;
  readonly license: string;
};

const FONT_ENTRIES: readonly LicenseEntry[] = [
  { name: "Noto Sans Bengali", license: "SIL Open Font License 1.1" },
  { name: "Noto Sans", license: "SIL Open Font License 1.1" },
  { name: "Baloo Da 2", license: "SIL Open Font License 1.1" },
];

const PACKAGE_ENTRIES: readonly LicenseEntry[] = [
  { name: "lucide-react-native", license: "ISC License" },
  { name: "react-native-svg", license: "MIT License" },
  { name: "expo", license: "MIT License" },
];

export default function LicensesScreen() {
  const { colors } = useThemeColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.header, { color: colors.onSurface }]}>{t("licenses")}</Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
        {FONT_ENTRIES.map((entry) => (
          <View key={entry.name} style={styles.entryRow}>
            <Text style={[styles.name, { color: colors.onSurface }]}>{entry.name}</Text>
            <Text style={[styles.license, { color: colors.onSurfaceVariant }]}>
              {entry.license}
            </Text>
          </View>
        ))}
        <Text selectable style={[styles.ofl, { color: colors.onSurfaceVariant }]}>
          {OFL_TEXT}
        </Text>
      </View>

      {PACKAGE_ENTRIES.map((entry) => (
        <View key={entry.name} style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.entryRow}>
            <Text style={[styles.name, { color: colors.onSurface }]}>{entry.name}</Text>
            <Text style={[styles.license, { color: colors.onSurfaceVariant }]}>
              {entry.license}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[3],
    paddingBottom: spacing[5],
  },
  header: {
    fontFamily: typography.fonts.bengali,
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    borderRadius: radius.md,
    gap: spacing[1],
    padding: spacing[3],
  },
  entryRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    justifyContent: "space-between",
    minHeight: 44,
  },
  name: {
    fontFamily: typography.fonts.bengali,
    fontSize: 15,
    fontWeight: "600",
  },
  license: {
    fontFamily: typography.fonts.bengali,
    fontSize: 12,
    fontWeight: "500",
  },
  ofl: {
    fontFamily: typography.fonts.latin,
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: spacing[2],
  },
});
