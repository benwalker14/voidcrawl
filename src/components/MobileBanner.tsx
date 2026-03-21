"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function getSnapshot() {
  return navigator.maxTouchPoints > 0 && window.innerWidth < 1024;
}

function getServerSnapshot() {
  return false;
}

export default function MobileBanner() {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isMobile) return null;

  return (
    <div
      className="w-full max-w-md text-center text-sm px-4 py-3 mb-6 border rounded"
      style={{
        borderColor: "#c084fc",
        color: "#c084fc",
        backgroundColor: "rgba(192, 132, 252, 0.08)",
      }}
    >
      Nullcrawl is best played on desktop with a keyboard. Mobile controls coming soon!
    </div>
  );
}
