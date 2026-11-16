import type { ReactNode } from "react";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";
import type { ShapeId } from "../lib/shapes";

export type { ShapeId };

export type GlyphProps = { readonly size: number; readonly color: string };

export const SHAPE_GLYPHS: Record<ShapeId, (p: GlyphProps) => ReactNode> = {
  quad: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon
        points="6,30 18,8 42,14 34,40"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  square: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect
        x={10}
        y={10}
        width={28}
        height={28}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  trapezoid: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon
        points="8,36 40,36 32,14 16,14"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  triangle: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon
        points="24,8 44,38 4,38"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  rightTriangle: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon
        points="12,38 12,10 42,38"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M12,30 L20,30 L20,38"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  circle: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle
        cx={24}
        cy={24}
        r={15}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  semicircle: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M8,32 A16,16 0 0 1 40,32"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Line
        x1={8}
        y1={32}
        x2={40}
        y2={32}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  rectangle: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect
        x={8}
        y={12}
        width={32}
        height={24}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  parallelogram: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon
        points="14,12 42,12 34,36 6,36"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  rhombus: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon
        points="24,6 42,24 24,42 6,24"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
  ellipse: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Ellipse
        cx={24}
        cy={24}
        rx={18}
        ry={12}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  ),
};

export function ShapeGlyph({
  shape,
  size,
  color,
}: {
  readonly shape: ShapeId;
  readonly size: number;
  readonly color: string;
}) {
  const G = SHAPE_GLYPHS[shape];
  return <G size={size} color={color} />;
}
