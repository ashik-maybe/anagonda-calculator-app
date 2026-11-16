import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { radius, spacing, typography, useThemeColors } from "../../../constants/theme";
import { hapticTick } from "../../../lib/haptics";
import { t, useLocale } from "../../../lib/i18n";
import { toBanglaDigits } from "../../../lib/digits";
import { TonalButton } from "../../../components/TonalButton";

export default function AboutScreen() {
  const { colors } = useThemeColors();
  const locale = useLocale();
  const name = Constants.expoConfig?.name ?? "Ana Gonda Calculator";
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const versionText = locale === "bn" ? toBanglaDigits(version) : version;

  const handleShare = () => {
    hapticTick();
    Share.share({ message: `${name} — ${t("about_on_device")}` }).catch(() => {});
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={[styles.caption, { color: colors.onSurfaceVariant }]}>{t("about")}</Text>
        <View style={styles.row}>
          <Text style={[styles.name, { color: colors.onSurface }]}>{name}</Text>
          <Text style={[styles.version, { color: colors.onSurfaceVariant }]}>v{versionText}</Text>
        </View>
        <Text style={[styles.note, { color: colors.onSurfaceVariant }]}>
          {t("about_on_device")}
        </Text>
      </View>

      <TonalButton label={t("share_app")} variant="filled" onPress={handleShare} />
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
    gap: spacing[2],
    padding: spacing[3],
  },
  caption: {
    fontFamily: typography.fonts.bengali,
    fontSize: 16,
    fontWeight: "600",
  },
  row: {
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
  version: {
    fontFamily: typography.fonts.bengali,
    fontSize: 13,
  },
  note: {
    fontFamily: typography.fonts.bengali,
    fontSize: 12,
    lineHeight: 18,
  },
});
