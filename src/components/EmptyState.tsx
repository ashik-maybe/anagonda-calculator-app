import { View } from "react-native";
import { useThemeColors, radius, spacing } from "../constants/theme";
import { t } from "../lib/i18n";
import { BnText } from "./BnText";
import { TonalButton } from "./TonalButton";

type Props = {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  onExample?: () => void;
  exampleLabel?: string;
};

export function EmptyState({ icon, title, hint, onExample, exampleLabel }: Props) {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        paddingVertical: spacing[5],
        paddingHorizontal: spacing[3],
        alignItems: "center",
        gap: spacing[2],
      }}
    >
      {icon}
      <BnText variant="label" style={{ color: colors.onSurfaceVariant, textAlign: "center" }}>
        {title}
      </BnText>
      {hint ? (
        <BnText variant="caption" style={{ color: colors.onSurfaceVariant, textAlign: "center" }}>
          {hint}
        </BnText>
      ) : null}
      {onExample ? (
        <TonalButton
          label={exampleLabel ?? t("example_show")}
          onPress={onExample}
          variant="tonal"
        />
      ) : null}
    </View>
  );
}
