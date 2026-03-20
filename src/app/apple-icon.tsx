import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — brick pattern scaled to 180x180
export default function AppleIcon() {
  const S = 180;
  const u = S / 32; // unit scale factor

  const R = (x: number, y: number, w: number, h: number, color: string) => (
    <div
      style={{
        position: "absolute",
        left: Math.round(x * u),
        top: Math.round(y * u),
        width: Math.round(w * u),
        height: Math.round(h * u),
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
          width: S,
          height: S,
          background: MORTAR,
          display: "flex",
          position: "relative",
          borderRadius: 32,
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
