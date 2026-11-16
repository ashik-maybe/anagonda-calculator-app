import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Book,
  BookOpen,
  History,
  Info,
  Ruler,
  Scale,
  Settings,
} from "lucide-react-native";
import { useThemeColors, spacing, typography, radius } from "../../../constants/theme";
import { t } from "../../../lib/i18n";
import { hapticTick } from "../../../lib/haptics";

/** Only destinations that exist are listed — no dead buttons. */
export default function MoreMenuScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();

  const sections = [
    {
      title: t("more_section_tools"),
      items: [
        { key: "rates", label: t("rates"), icon: Ruler, route: "/more/rates" as const },
        {
          key: "encyclopedia",
          label: t("encyclopedia"),
          icon: BookOpen,
          route: "/more/encyclopedia" as const,
        },
        { key: "glossary", label: t("glossary"), icon: Book, route: "/more/glossary" as const },
      ],
    },
    {
      title: t("more_section_app"),
      items: [
        { key: "history", label: t("history"), icon: History, route: "/more/history" as const },
        {
          key: "settings",
          label: t("settings"),
          icon: Settings,
          route: "/more/settings" as const,
        },
        {
          key: "licenses",
          label: t("licenses"),
          icon: Scale,
          route: "/more/licenses" as const,
        },
        { key: "about", label: t("about"), icon: Info, route: "/more/about" as const },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3] }}
    >
      {sections.map(({ title, items }) => (
        <View key={title}>
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: typography.fonts.bengali,
              paddingVertical: spacing[2],
            }}
          >
            {title}
          </Text>
          <View style={{ borderRadius: radius.md, overflow: "hidden" }}>
            {items.map(({ key, label, icon: Icon, route }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => {
                  hapticTick();
                  router.push(route);
                }}
                style={({ pressed }) => ({
                  minHeight: 56,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[3],
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
                })}
              >
                <Icon color={colors.primary} size={20} />
                <Text
                  style={{
                    flex: 1,
                    color: colors.onSurface,
                    fontSize: 15,
                    fontWeight: "600",
                    fontFamily: typography.fonts.bengali,
                  }}
                >
                  {label}
                </Text>
                <ChevronRight color={colors.onSurfaceVariant} size={20} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
