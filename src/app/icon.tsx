import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Brick favicon matching the game's procedural tile_brick texture
export default function Icon() {
  // Absolute-positioned rect helper
  const R = (x: number, y: number, w: number, h: number, color: string) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: color,
      }}
    />
  );

  const MORTAR = "#705A28";
  const FACE = "#C8763C";
  const HIGHLIGHT = "#DDA060";
  const SHADOW = "#8B5520";

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: MORTAR,
          display: "flex",
          position: "relative",
        }}
      >
        {/* Brick faces */}
        {R(1, 1, 14, 14, FACE)}
        {R(17, 1, 14, 14, FACE)}
        {R(1, 17, 6, 14, FACE)}
        {R(9, 17, 14, 14, FACE)}
        {R(25, 17, 6, 14, FACE)}

        {/* Highlights (top-left edges) */}
        {R(1, 1, 14, 2, HIGHLIGHT)}
        {R(1, 1, 2, 14, HIGHLIGHT)}
        {R(17, 1, 14, 2, HIGHLIGHT)}
        {R(17, 1, 2, 14, HIGHLIGHT)}
        {R(1, 17, 6, 2, HIGHLIGHT)}
        {R(1, 17, 2, 14, HIGHLIGHT)}
        {R(9, 17, 14, 2, HIGHLIGHT)}
        {R(9, 17, 2, 14, HIGHLIGHT)}
        {R(25, 17, 6, 2, HIGHLIGHT)}
        {R(25, 17, 2, 14, HIGHLIGHT)}

        {/* Shadows (bottom-right edges) */}
        {R(1, 13, 14, 2, SHADOW)}
        {R(13, 1, 2, 14, SHADOW)}
        {R(17, 13, 14, 2, SHADOW)}
        {R(29, 1, 2, 14, SHADOW)}
        {R(1, 29, 6, 2, SHADOW)}
        {R(5, 17, 2, 14, SHADOW)}
        {R(9, 29, 14, 2, SHADOW)}
        {R(21, 17, 2, 14, SHADOW)}
        {R(25, 29, 6, 2, SHADOW)}
        {R(29, 17, 2, 14, SHADOW)}
      </div>
    ),
    { ...size },
  );
}
