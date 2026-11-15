import { Text, View } from "react-native";
import { t } from "../../lib/i18n";
import { useThemeColors } from "../../constants/theme";

export default function MoreScreen() {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.onSurface, fontSize: 20 }}>{t("more_title")}</Text>
    </View>
  );
}
