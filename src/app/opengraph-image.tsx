import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CritCine - Movie rating platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#000000",
          padding: "80px",
          gap: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: "50%",
            backgroundColor: "#000000",
            border: "6px solid #ffffff",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: 56,
              fontWeight: 700,
              fontFamily: "Arial, sans-serif",
            }}
          >
            CTC
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span
            style={{
              color: "#ffffff",
              fontSize: 96,
              fontWeight: 700,
              fontFamily: "Arial, sans-serif",
              lineHeight: 1,
            }}
          >
            CritCine
          </span>
          <span
            style={{
              color: "#aaaaaa",
              fontSize: 36,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Movie rating platform
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
