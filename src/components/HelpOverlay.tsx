"use client";

const ENEMIES = [
  { symbol: "r", color: "#8b5cf6", name: "Void Rat", behavior: "Wanders, chases when spotted", floors: "1+" },
  { symbol: "w", color: "#a78bfa", name: "Shadow Wisp", behavior: "Flees when wounded · 30% dodge chance", floors: "1+" },
  { symbol: "b", color: "#7c3aed", name: "Void Beetle", behavior: "Wanders · Armored (takes 1 less damage)", floors: "1+" },
  { symbol: "s", color: "#4c1d95", name: "Dark Slime", behavior: "Ambushes · Splits into 2 Mini Slimes on death", floors: "2+" },
  { symbol: "S", color: "#6d28d9", name: "Shade", behavior: "Ambushes · Life drain (heals 50% of damage dealt)", floors: "3+" },
  { symbol: "W", color: "#5b21b6", name: "Void Walker", behavior: "Pursues · Teleports away when hit", floors: "4+" },
  { symbol: "H", color: "#c084fc", name: "Abyssal Hound", behavior: "Pursues · Howl alerts all other hounds", floors: "5+" },
  { symbol: "R", color: "#e9d5ff", name: "Rift Wraith", behavior: "Moves through walls · Vulnerable only on floor tiles", floors: "7+" },
  { symbol: "V", color: "#f5f3ff", name: "Void Lord", behavior: "Pursues from very far away", floors: "10+" },
  { symbol: "O", color: "#06b6d4", name: "BOSS: Void Nucleus", behavior: "Stationary · Spawns adds · Telegraphs AoE · Alternates active/vulnerable phases", floors: "5" },
  { symbol: "o", color: "#67e8f9", name: "Void Fragment", behavior: "Boss add · Pursues player", floors: "5" },
];

const ITEMS = [
  { symbol: "/", color: "#9ca3af", label: "Weapon (Common)", example: "Rusty Dagger, Short Sword" },
  { symbol: "/", color: "#22c55e", label: "Weapon (Uncommon)", example: "Void Blade, Shadow Axe" },
  { symbol: "/", color: "#3b82f6", label: "Weapon (Rare)", example: "Abyssal Edge" },
  { symbol: "[", color: "#9ca3af", label: "Armor (Common)", example: "Tattered Cloak, Leather Vest" },
  { symbol: "[", color: "#22c55e", label: "Armor (Uncommon)", example: "Void Mail, Shadow Plate" },
  { symbol: "[", color: "#3b82f6", label: "Armor (Rare)", example: "Abyssal Ward" },
  { symbol: "!", color: "#9ca3af", label: "Potion (Common)", example: "Health, Teleport" },
  { symbol: "!", color: "#22c55e", label: "Potion (Uncommon)", example: "Haste, Fire, Poison" },
  { symbol: "!", color: "#3b82f6", label: "Potion (Rare)", example: "Invisibility, Strength" },
  { symbol: "?", color: "#22c55e", label: "Scroll (Uncommon)", example: "Mapping, Fear" },
  { symbol: "?", color: "#3b82f6", label: "Scroll (Rare)", example: "Enchanting, Summoning" },
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
            Nullcrawl — Help
          </h2>
          <span style={{ color: "var(--void-muted)" }}>Press ?, H, or Esc to close</span>
        </div>

        {/* Controls */}
        <Section title="Controls">
          <Row left="Arrow Keys / WASD" right="Move (and attack by walking into enemies)" />
          <Row left="Space" right="Wait one turn" />
          <Row left="1-8" right="Use inventory item by slot number" />
          <Row left="Q then 1-8" right="Drop inventory item onto the floor" />
          <Row left="M" right="Toggle mini-map" />
          <Row left="? / H" right="Toggle this help screen" />
          <Row left="Esc" right="Pause menu" />
          <div className="mt-1 mb-0.5" style={{ color: "var(--void-muted)" }}>On death/victory screen:</div>
          <Row left="R / Enter" right="Start new run" />
          <Row left="C" right="Copy run summary to clipboard" />
          <Row left="E" right="Continue in endless mode (victory only)" />
        </Section>

        {/* How to Play */}
        <Section title="How to Play">
          <p className="mb-1">Descend through procedurally generated void dungeons. Every run is different.</p>
          <p className="mb-1">
            <Hl>Combat:</Hl> Walk into an enemy to attack. Damage = ATK - DEF + random(-1 to 1), minimum 1.
          </p>
          <p className="mb-1">
            <Hl>Items:</Hl> Walk over items to auto-pickup. Better weapons/armor auto-equip. Potions and scrolls go to inventory — press 1-8 to use. Press Q then 1-8 to drop an item.
          </p>
          <p className="mb-1">
            <Hl>Identification:</Hl> Potions and scrolls have randomized appearances each run. Their true effect is unknown until you use one — then all items of that type are identified for the rest of the run.
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

        {/* Dungeon Zones */}
        <Section title="Dungeon Zones">
          <p className="mb-1">The dungeon changes as you descend deeper. Each zone has a distinct appearance and hazards.</p>
          <div className="space-y-1 mt-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#2d2d44" }} />
              <span style={{ color: "#a78bfa" }}>Null Tunnels</span>
              <span style={{ color: "var(--void-muted)" }}>— Floors 1-4. Ancient purple corridors where the void seeps through stone.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#1a3a5c" }} />
              <span style={{ color: "#38bdf8" }}>Crystal Depths</span>
              <span style={{ color: "var(--void-muted)" }}>— Floors 5-9. Shimmering crystalline formations pulse with cold energy.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#3d1a1a" }} />
              <span style={{ color: "#ef4444" }}>Shadow Realm</span>
              <span style={{ color: "var(--void-muted)" }}>— Floors 10+. Living darkness. Reduced visibility (-2 FOV).</span>
            </div>
          </div>
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

        {/* Consumables Guide */}
        <Section title="Consumable Effects">
          <p className="mb-1" style={{ color: "#06b6d4" }}>Potions (!)</p>
          <div className="space-y-0.5 mb-2 ml-2">
            <div><span style={{ color: "#22c55e" }}>Health</span> — Restores HP (won&apos;t use at full health)</div>
            <div><span style={{ color: "#22c55e" }}>Haste</span> — Enemies move at half speed for 8 turns</div>
            <div><span style={{ color: "#22c55e" }}>Invisibility</span> — Enemies can&apos;t see you for 10 turns (broken by attacking)</div>
            <div><span style={{ color: "#22c55e" }}>Teleport</span> — Randomly teleport to another spot on the floor</div>
            <div><span style={{ color: "#22c55e" }}>Fire</span> — Deal 8 damage to all enemies within 2 tiles</div>
            <div><span style={{ color: "#22c55e" }}>Poison</span> — Poison enemies within 2 tiles (2 dmg/turn for 5 turns)</div>
            <div><span style={{ color: "#22c55e" }}>Strength</span> — +3 ATK for 10 turns</div>
          </div>
          <p className="mb-1" style={{ color: "#06b6d4" }}>Scrolls (?)</p>
          <div className="space-y-0.5 ml-2">
            <div><span style={{ color: "#22c55e" }}>Mapping</span> — Reveals the entire floor layout</div>
            <div><span style={{ color: "#22c55e" }}>Enchanting</span> — +2 to equipped weapon ATK or armor DEF</div>
            <div><span style={{ color: "#22c55e" }}>Fear</span> — All visible enemies flee for 6 turns</div>
            <div><span style={{ color: "#22c55e" }}>Summoning</span> — Summons a Void Spirit ally for 15 turns</div>
          </div>
        </Section>

        {/* Void Shrines */}
        <Section title="Void Shrines">
          <p className="mb-1">
            <span style={{ color: "#c084fc" }}>$</span> Purple shrines appear once per floor. Step on one and press
            <Hl> Y</Hl> to commune or <Hl>N</Hl> to decline.
          </p>
          <p className="mb-1">Each use adds <span style={{ color: "#c084fc" }}>+15 Null Attunement</span> and triggers a random effect:</p>
          <div className="space-y-0.5 ml-2">
            <div><span style={{ color: "#22c55e" }}>Heal 50% HP</span> <span style={{ color: "var(--void-muted)" }}>(20%)</span></div>
            <div><span style={{ color: "#c084fc" }}>+1 permanent stat (ATK, DEF, or Max HP)</span> <span style={{ color: "var(--void-muted)" }}>(15%)</span></div>
            <div><span style={{ color: "#06b6d4" }}>Identify all items</span> <span style={{ color: "var(--void-muted)" }}>(15%)</span></div>
            <div><span style={{ color: "#06b6d4" }}>Random item gift</span> <span style={{ color: "var(--void-muted)" }}>(15%)</span></div>
            <div><span style={{ color: "#ef4444" }}>Spawn 2 enemies nearby</span> <span style={{ color: "var(--void-muted)" }}>(15%)</span></div>
            <div><span style={{ color: "#ef4444" }}>Curse equipped weapon or armor</span> <span style={{ color: "var(--void-muted)" }}>(10%)</span></div>
            <div><span style={{ color: "#06b6d4" }}>Teleport near stairs</span> <span style={{ color: "var(--void-muted)" }}>(10%)</span></div>
          </div>
        </Section>

        {/* Null Attunement */}
        <Section title="Null Attunement">
          <p className="mb-1">
            A corruption meter (0-100) that grows as you descend deeper. The void grants power, but at a cost.
          </p>
          <p className="mb-1"><Hl>Sources:</Hl> +5 per floor descended. Void shrines add +15.</p>
          <div className="space-y-0.5 mt-1">
            <div>
              <span style={{ color: "#a855f7" }}>25% — Void Sight:</span>
              <span style={{ color: "#22c55e" }}> +2 FOV radius</span> /
              <span style={{ color: "#ef4444" }}> enemies detect you from +3 further</span>
            </div>
            <div>
              <span style={{ color: "#a855f7" }}>50% — Void Strike:</span>
              <span style={{ color: "#22c55e" }}> +3 ATK</span> /
              <span style={{ color: "#ef4444" }}> healing potions 50% less effective</span>
            </div>
          </div>
        </Section>

        {/* Runic Effects */}
        <Section title="Runic Effects">
          <p className="mb-1" style={{ color: "var(--void-muted)" }}>
            Uncommon items have a 25% chance and Rare items a 60% chance to have a runic effect.
            Shown as <span style={{ color: "#c084fc" }}>[Runic Name]</span> on the item.
          </p>
          <p className="mb-1" style={{ color: "#06b6d4" }}>Weapon Runics</p>
          <div className="space-y-0.5 mb-2 ml-2">
            <div><span style={{ color: "#c084fc" }}>Vampiric</span> — Heal 1 HP on kill</div>
            <div><span style={{ color: "#c084fc" }}>Flaming</span> — 25% chance to burn enemies (2 dmg/turn for 3 turns)</div>
            <div><span style={{ color: "#c084fc" }}>Stunning</span> — 20% chance to stun enemies (skip their next turn)</div>
            <div><span style={{ color: "#c084fc" }}>Vorpal</span> — Deal 2x damage when enemy is below 30% HP</div>
          </div>
          <p className="mb-1" style={{ color: "#06b6d4" }}>Armor Runics</p>
          <div className="space-y-0.5 ml-2">
            <div><span style={{ color: "#c084fc" }}>Reflective</span> — 15% chance to reflect full damage back to attacker</div>
            <div><span style={{ color: "#c084fc" }}>Regenerating</span> — Heal 1 HP every 10 turns</div>
            <div><span style={{ color: "#c084fc" }}>Thorned</span> — Deal 1 damage to any enemy that hits you in melee</div>
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
