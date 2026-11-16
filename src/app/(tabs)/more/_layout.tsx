import { Stack } from "expo-router";
import { t, useLocale } from "../../../lib/i18n";
import { useThemeColors } from "../../../constants/theme";

export default function MoreLayout() {
  useLocale();
  const { colors } = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.onSurface },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("more_title") }} />
      <Stack.Screen name="history" options={{ title: t("history") }} />
      <Stack.Screen name="rates" options={{ title: t("rates") }} />
      <Stack.Screen name="encyclopedia" options={{ title: t("encyclopedia") }} />
      <Stack.Screen name="glossary" options={{ title: t("glossary") }} />
      <Stack.Screen name="licenses" options={{ title: t("licenses") }} />
      <Stack.Screen name="about" options={{ title: t("about") }} />
    </Stack>
  );
}
