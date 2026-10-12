import { ImageResponse } from "next/og";

export const alt = "Bangladesh Ship Breakers & Recyclers Association — Recycling ships. Responsibly.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card for every localized page (pages may override). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#1d1d1f",
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#1d1d1f" />
            <path d="M10.5 15.25a5.5 5.5 0 0 1 11 0" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
            <path d="M6.5 18.25h19l-2.62 5.12a1.5 1.5 0 0 1-1.34.82H10.46a1.5 1.5 0 0 1-1.34-.82z" fill="#fff" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.8 }}>BSBRA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 600, letterSpacing: -3.5, lineHeight: 1 }}>Recycling ships.</div>
          <div style={{ fontSize: 88, fontWeight: 600, letterSpacing: -3.5, lineHeight: 1, color: "#86868b" }}>
            Responsibly.
          </div>
          <div style={{ marginTop: 36, fontSize: 28, color: "#6e6e73" }}>
            Bangladesh Ship Breakers &amp; Recyclers Association
          </div>
        </div>
      </div>
    ),
    size,
  );
}
