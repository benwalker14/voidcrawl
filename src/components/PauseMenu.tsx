"use client";

interface PauseMenuProps {
  onResume: () => void;
  onHelp: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onHelp, onRestart, onQuit }: PauseMenuProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/85 z-10"
      onClick={onResume}
    >
      <div
        className="flex flex-col items-center gap-3 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-2xl font-bold tracking-wider mb-2"
          style={{ color: "#06b6d4" }}
        >
          PAUSED
        </h2>

        <MenuButton label="Resume" onClick={onResume} color="#06b6d4" />
        <MenuButton label="Help" onClick={onHelp} color="#fbbf24" />
        <MenuButton label="Restart" onClick={onRestart} color="#f97316" />
        <MenuButton label="Quit to Menu" onClick={onQuit} color="#ef4444" />

        <p
          className="text-xs mt-4 font-mono"
          style={{ color: "var(--void-muted)" }}
        >
          Press Escape to resume
        </p>
      </div>
    </div>
  );
}

function MenuButton({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-48 px-6 py-2 border-2 font-bold tracking-wider font-mono text-sm transition-all hover:scale-105"
      style={{ borderColor: color, color }}
    >
      {label}
    </button>
  );
}
