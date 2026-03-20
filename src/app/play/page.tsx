"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--void-cyan)' }} className="text-xl tracking-widest animate-pulse">
        DESCENDING INTO THE VOID...
      </p>
    </div>
  ),
});

export default function PlayPage() {
  return <GameCanvas />;
}
