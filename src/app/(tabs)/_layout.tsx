import { Tabs } from "expo-router";
import { ArrowLeftRight, MoreHorizontal, Ruler } from "lucide-react-native";
import { t, useLocale } from "../../lib/i18n";
import { useThemeColors } from "../../constants/theme";

export default function TabsLayout() {
  useLocale();
  const { colors } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.onSurface },
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="hissa"
        options={{
          title: t("tab_hissa"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="land"
        options={{
          title: t("tab_land"),
          tabBarIcon: ({ color, size }) => <Ruler color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="convert"
        options={{
          title: t("tab_convert"),
          tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("tab_more"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
