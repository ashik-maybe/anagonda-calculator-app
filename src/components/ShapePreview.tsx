import { View } from "react-native";
import { radius, spacing, useThemeColors } from "../constants/theme";
import { ShapeGlyph } from "./ShapeGlyphs";
import type { ShapeId } from "../lib/shapes";

type Props = {
  readonly shape: ShapeId | null;
};

/** Live preview of the selected shape; renders nothing when no shape is set. */
export function ShapePreview({ shape }: Props) {
  const { colors } = useThemeColors();
  if (shape === null) return null;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: colors.surfaceVariant,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing[4],
      }}
    >
      <ShapeGlyph shape={shape} size={48} color={colors.onSurfaceVariant} />
    </View>
  );
}
