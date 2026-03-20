"use client";

const ENEMIES = [
  { symbol: "r", color: "#8b5cf6", name: "Void Rat", behavior: "Wanders, chases when spotted", floors: "1+" },
  { symbol: "w", color: "#a78bfa", name: "Shadow Wisp", behavior: "Flees when wounded", floors: "1+" },
  { symbol: "b", color: "#7c3aed", name: "Void Beetle", behavior: "Wanders, chases when spotted", floors: "1+" },
  { symbol: "s", color: "#4c1d95", name: "Dark Slime", behavior: "Ambushes at close range", floors: "2+" },
  { symbol: "S", color: "#6d28d9", name: "Shade", behavior: "Ambushes at close range", floors: "3+" },
  { symbol: "W", color: "#5b21b6", name: "Void Walker", behavior: "Pursues relentlessly", floors: "4+" },
  { symbol: "H", color: "#c084fc", name: "Abyssal Hound", behavior: "Pursues from far away", floors: "5+" },
  { symbol: "R", color: "#e9d5ff", name: "Rift Wraith", behavior: "Pursues from far away", floors: "7+" },
  { symbol: "V", color: "#f5f3ff", name: "Void Lord", behavior: "Pursues from very far away", floors: "10+" },
];

const ITEMS = [
  { symbol: "/", color: "#9ca3af", label: "Weapon (Common)", example: "Rusty Dagger, Short Sword" },
  { symbol: "/", color: "#22c55e", label: "Weapon (Uncommon)", example: "Void Blade, Shadow Axe" },
  { symbol: "/", color: "#3b82f6", label: "Weapon (Rare)", example: "Abyssal Edge" },
  { symbol: "[", color: "#9ca3af", label: "Armor (Common)", example: "Tattered Cloak, Leather Vest" },
  { symbol: "[", color: "#22c55e", label: "Armor (Uncommon)", example: "Void Mail, Shadow Plate" },
  { symbol: "[", color: "#3b82f6", label: "Armor (Rare)", example: "Abyssal Ward" },
  { symbol: "!", color: "#9ca3af", label: "Potion (Common)", example: "Minor Health Potion" },
  { symbol: "!", color: "#22c55e", label: "Potion (Uncommon)", example: "Health Potion" },
  { symbol: "!", color: "#3b82f6", label: "Potion (Rare)", example: "Major Health Potion" },
];

const MAP_SYMBOLS = [
  { symbol: "@", color: "#06b6d4", label: "You (the player)" },
  { symbol: ".", color: "#1a1a2e", label: "Floor tile" },
  { symbol: "#", color: "#2d2d44", label: "Wall" },
  { symbol: ">", color: "#06b6d4", label: "Stairs down (descend to next floor)" },
];

interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/90 z-10"
      onClick={onClose}
    >
      <div
        className="w-full h-full overflow-y-auto p-4 font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#e2e8f0" }}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold" style={{ color: "#06b6d4" }}>
            Voidcrawl — Help
          </h2>
          <span style={{ color: "var(--void-muted)" }}>Press ? or Esc to close</span>
        </div>

        {/* Controls */}
        <Section title="Controls">
          <Row left="Arrow Keys / WASD" right="Move (and attack by walking into enemies)" />
          <Row left="Space" right="Wait one turn" />
          <Row left="1-8" right="Use inventory item by slot number" />
          <Row left="? / H" right="Toggle this help screen" />
        </Section>

        {/* How to Play */}
        <Section title="How to Play">
          <p className="mb-1">Descend through procedurally generated void dungeons. Every run is different.</p>
          <p className="mb-1">
            <Hl>Combat:</Hl> Walk into an enemy to attack. Damage = ATK - DEF + random(-1 to 1), minimum 1.
          </p>
          <p className="mb-1">
            <Hl>Items:</Hl> Walk over items to auto-pickup. Better weapons/armor auto-equip. Potions go to inventory.
          </p>
          <p className="mb-1">
            <Hl>Leveling:</Hl> Kill enemies for XP. Each level grants +5 max HP, +1 ATK, +1 DEF and a full heal.
          </p>
          <p className="mb-1">
            <Hl>Stairs:</Hl> Find the <span style={{ color: "#06b6d4" }}>&gt;</span> symbol and walk onto it to descend. Enemies get stronger each floor.
          </p>
          <p>
            <Hl>Death:</Hl> Permadeath — when you die, it&apos;s over. Start a new run and try to go deeper.
          </p>
        </Section>

        {/* Map Legend */}
        <Section title="Map Symbols">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {MAP_SYMBOLS.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-4 text-center font-bold" style={{ color: s.color }}>{s.symbol}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Enemies */}
        <Section title="Enemies">
          <div className="space-y-0.5">
            {ENEMIES.map((e) => (
              <div key={e.name} className="flex items-center gap-2">
                <span className="w-4 text-center font-bold" style={{ color: e.color }}>{e.symbol}</span>
                <span className="w-28" style={{ color: e.color }}>{e.name}</span>
                <span className="flex-1" style={{ color: "var(--void-muted)" }}>{e.behavior}</span>
                <span style={{ color: "var(--void-muted)" }}>Floor {e.floors}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Items */}
        <Section title="Items & Rarities">
          <div className="flex gap-4 mb-2">
            <span><span style={{ color: "#9ca3af" }}>Gray</span> = Common</span>
            <span><span style={{ color: "#22c55e" }}>Green</span> = Uncommon</span>
            <span><span style={{ color: "#3b82f6" }}>Blue</span> = Rare</span>
          </div>
          <div className="space-y-0.5">
            {ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 text-center font-bold" style={{ color: item.color }}>{item.symbol}</span>
                <span className="w-40">{item.label}</span>
                <span style={{ color: "var(--void-muted)" }}>{item.example}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold mb-1" style={{ color: "#fbbf24" }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex gap-2 mb-0.5">
      <span className="w-32 text-right" style={{ color: "#06b6d4" }}>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function Hl({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#06b6d4" }}>{children}</span>;
}
