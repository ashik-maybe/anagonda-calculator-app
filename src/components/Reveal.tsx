import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type Props = {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
};

/**
 * Mount-time reveal for "occasional" moments (result appearing).
 * Occasional tier per the motion gate: short rise + fade. Reduced motion
 * drops the translation and keeps a plain opacity crossfade.
 */
export function Reveal({ children, style }: Props) {
  const reduced = useReducedMotion();
  const entering = reduced ? FadeIn.duration(160) : FadeInDown.duration(240).easing(EASE_OUT);
  return (
    <Animated.View style={style} entering={entering}>
      {children}
    </Animated.View>
  );
}
