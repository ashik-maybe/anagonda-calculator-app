import * as React from "react";
import { forwardRef } from "react";
import { Text, type TextProps } from "react-native";
import { typography } from "../constants/theme";

type Variant = "display" | "title" | "body" | "label" | "caption";

const SIZE: Record<Variant, number> = {
  display: 28,
  title: 20,
  body: 16,
  label: 14,
  caption: 13,
};

export type BnTextProps = TextProps & {
  variant?: Variant;
  numeric?: boolean;
};

export const BnText = forwardRef<React.ElementRef<typeof Text>, BnTextProps>(function BnText(
  { variant = "body", numeric = false, style, ...rest },
  ref,
) {
  const size = SIZE[variant];
  const tight = variant === "display" || variant === "title";
  const lineHeight = size * (tight ? typography.lineHeights.tight : typography.lineHeights.body);
  return (
    <Text
      ref={ref}
      maxFontSizeMultiplier={2}
      style={[
        {
          fontFamily: numeric ? typography.fonts.latin : typography.fonts.bengali,
          fontSize: size,
          lineHeight,
        },
        style,
      ]}
      {...rest}
    />
  );
});
