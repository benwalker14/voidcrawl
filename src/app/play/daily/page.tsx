"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: '#c084fc' }} className="text-xl tracking-widest animate-pulse">
        PREPARING DAILY VOID...
      </p>
    </div>
  ),
});

export default function DailyPlayPage() {
  return <GameCanvas mode="daily" />;
}
