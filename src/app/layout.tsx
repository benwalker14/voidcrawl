import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://voidcrawl.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nullcrawl - Free Browser Roguelike Dungeon Crawler",
    template: "%s | Nullcrawl",
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
    siteName: "Nullcrawl",
    title: "Nullcrawl - Free Browser Roguelike Dungeon Crawler",
    description:
      "Descend through procedurally generated void dungeons. Tactical turn-based combat, runic loot, boss encounters, and daily challenges. Play free in your browser.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Nullcrawl - Free Browser Roguelike",
    description:
      "Tactical turn-based dungeon crawler. Procedural dungeons, runic loot, boss fights, daily challenges. Free, no download.",
  },
  other: {
    "theme-color": "#06b6d4",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["VideoGame", "SoftwareApplication"],
  name: "Nullcrawl",
  description:
    "A free turn-based browser roguelike dungeon crawler with procedurally generated dungeons, tactical combat, runic loot, and daily challenges.",
  url: siteUrl,
  applicationCategory: "GameApplication",
  operatingSystem: "Any (Web Browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  genre: ["Roguelike", "Dungeon Crawler", "Turn-Based Strategy"],
  gamePlatform: "Web Browser",
  playMode: "SinglePlayer",
  author: { "@type": "Person", name: "Vincent", url: "https://github.com/benwalker14" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
