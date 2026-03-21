import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Voidcrawl - Free Browser Roguelike Dungeon Crawler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 40%, #2d2d44 100%)",
          fontFamily: "monospace",
        }}
      >
        {/* Decorative top border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #6b21a8, #06b6d4, #6b21a8)",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "0.15em",
            color: "#06b6d4",
            textShadow: "0 0 40px rgba(6, 182, 212, 0.5)",
            display: "flex",
          }}
        >
          VOIDCRAWL
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            marginTop: 12,
            letterSpacing: "0.2em",
            display: "flex",
          }}
        >
          FREE BROWSER ROGUELIKE DUNGEON CRAWLER
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Turn-Based Combat", "Procedural Dungeons", "Runic Loot", "Daily Challenge"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  padding: "8px 20px",
                  border: "1px solid #6b21a8",
                  borderRadius: 6,
                  color: "#c084fc",
                  fontSize: 18,
                  display: "flex",
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* ASCII art hint */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            color: "#2d2d44",
            fontSize: 16,
            letterSpacing: "0.3em",
            display: "flex",
          }}
        >
          @ . . r . . . # # . . . w . . &gt; . . #
        </div>
      </div>
    ),
    { ...size }
  );
}
