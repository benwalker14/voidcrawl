import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voidcrawl - Browser Roguelike",
  description: "A turn-based browser roguelike. Descend through procedurally generated dungeons, fight monsters, collect loot, and try not to die.",
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
