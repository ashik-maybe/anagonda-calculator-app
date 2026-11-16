import { View } from "react-native";
import { useThemeColors, spacing } from "../../constants/theme";

export default function ConvertScreen() {
  const { colors } = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing[3] }}>
      {/* W2b: full unit conversion table. */}
    </View>
  );
}
