import type { Metadata } from "next";
import { DailyGameLoader } from "@/components/GameLoader";

export const metadata: Metadata = {
  title: "Daily Void",
  description:
    "Today's daily Nullcrawl challenge — same dungeon for everyone. One attempt per day. Compare your results with other players.",
};

export default function DailyPlayPage() {
  return <DailyGameLoader />;
}
