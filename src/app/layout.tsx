import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://voidcrawl.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Voidcrawl - Free Browser Roguelike Dungeon Crawler",
    template: "%s | Voidcrawl",
  },
  description:
    "A free turn-based browser roguelike. Descend through procedurally generated void dungeons, fight tactical enemies, collect loot with runic effects, and try to survive. No download required.",
  keywords: [
    "roguelike",
    "browser game",
    "dungeon crawler",
    "turn-based",
    "free game",
    "HTML5 game",
    "procedural generation",
    "indie game",
  ],
  openGraph: {
    type: "website",
    siteName: "Voidcrawl",
    title: "Voidcrawl - Free Browser Roguelike Dungeon Crawler",
    description:
      "Descend through procedurally generated void dungeons. Tactical turn-based combat, runic loot, boss encounters, and daily challenges. Play free in your browser.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Voidcrawl - Free Browser Roguelike",
    description:
      "Tactical turn-based dungeon crawler. Procedural dungeons, runic loot, boss fights, daily challenges. Free, no download.",
  },
  other: {
    "theme-color": "#06b6d4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
