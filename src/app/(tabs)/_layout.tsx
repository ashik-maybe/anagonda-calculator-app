import { Tabs } from "expo-router";
import { Calculator, Home, MoreHorizontal, Ruler } from "lucide-react-native";
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
        name="index"
        options={{
          title: t("tab_home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="hishab"
        options={{
          title: t("tab_hishab"),
          tabBarIcon: ({ color, size }) => <Calculator color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="porimap"
        options={{
          title: t("tab_porimap"),
          tabBarIcon: ({ color, size }) => <Ruler color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("tab_more"),
          // The more tab hosts a nested Stack with its own headers.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
