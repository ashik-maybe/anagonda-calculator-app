import * as React from "react";
import { forwardRef } from "react";
import { Text, type TextProps } from "react-native";
import { typography } from "../constants/theme";

export type NumTextProps = TextProps & { size?: number };

export const NumText = forwardRef<React.ElementRef<typeof Text>, NumTextProps>(function NumText(
  { size = 16, style, ...rest },
  ref,
) {
  return (
    <Text
      ref={ref}
      maxFontSizeMultiplier={2}
      style={[
        { fontFamily: typography.fonts.latin, fontSize: size, fontVariant: ["tabular-nums"] },
        style,
      ]}
      {...rest}
    />
  );
});
