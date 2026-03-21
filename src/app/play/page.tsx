import type { Metadata } from "next";
import { StandardGameLoader } from "@/components/GameLoader";

export const metadata: Metadata = {
  title: "Play",
  description:
    "Play Voidcrawl — a free turn-based browser roguelike. Procedurally generated dungeons, tactical combat, runic loot. No download required.",
};

export default function PlayPage() {
  return <StandardGameLoader />;
}
