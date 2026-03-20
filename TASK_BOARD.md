# Voidcrawl Task Board

## Priority Legend
- P0: Critical / Blocking
- P1: High priority
- P2: Medium priority
- P3: Nice to have

---

## In Progress

---


## Up Next

### P0 - Foundation
- [ ] Deploy to Vercel and get production URL
- [ ] Set up GitHub repo and push initial code
- [ ] Add ESLint config

### P1 - Player Experience (NEW — strategist analysis 2026-03-20)
- [x] Add help overlay (press ? or H) showing controls, mechanics, and enemy/item legends — players currently have no way to learn game systems beyond the tiny footer hint

- [x] Add run stats to death screen (enemies killed, items found, damage dealt/taken, deepest floor, time played) — gives players a reason to care about each run
- [x] Pause menu (Escape key) with Resume, Help, Restart, Quit to Menu — currently no way to pause or access help mid-game
- [x] Add floating damage numbers on canvas (brief "+5 HP", "-3 DMG" over entities) — combat currently has zero visual feedback beyond message log

### P1 - Core Gameplay
- [ ] Add mini-map showing explored areas

### P1 - Content Depth (NEW — strategist content audit 2026-03-20)
- [ ] Consumable variety: add 6 potion types beyond healing (Haste, Invisibility, Teleport, Fire, Poison, Strength) + new Scroll item category with 4 types (Magic Mapping, Enchanting, Fear, Summon Ally) — only healing potions exist; zero tactical consumable decisions. Symbol `?` for scrolls. This is the single highest-impact content addition per effort.
- [ ] Enemy special abilities: retrofit existing 9 enemies with unique mechanics (Void Beetle: armored -1 dmg; Shadow Wisp: 30% phase/dodge; Dark Slime: splits into 2 Mini Slimes on death; Shade: life drain heals 50% of damage; Void Walker: teleports when hit; Abyssal Hound: howl alerts other hounds; Rift Wraith: moves through walls, only vulnerable on floor tiles) — enemies are currently pure stat blocks, combat has no tactical variety
- [ ] Floor 5 boss encounter: "Void Nucleus" (symbol `O`, cyan) — stationary, spawns add waves, players must manage spawns then DPS during pause. Boss room is a single large generated room with no corridor escape. Boss telegraphs special attack 1 turn before via message. Guaranteed rare+ loot drop on kill.
- [ ] Weapon/armor runic effects: add `runic` property to Item interface. Weapon runics: Vampiric (heal 1 HP on kill), Flaming (25% burn DoT), Stunning (20% skip enemy turn), Vorpal (2x dmg below 30% HP). Armor runics: Reflective (15% reflect damage), Regenerating (1 HP per 10 turns), Thorned (1 dmg to melee attackers). Uncommon items get 25% runic chance, Rare get 60%. Makes loot decisions interesting beyond "bigger number."

### P1 - Visual Polish
- [ ] Replace ASCII characters with pixel art sprites
- [ ] Add hit/damage animations
- [ ] Add screen shake on big hits
- [ ] Floor transition animation
- [ ] Death screen with run stats

### P2 - Player Experience (NEW — strategist analysis 2026-03-20)
- [ ] Mobile touch controls: virtual D-pad overlay + tap-to-use inventory — game is unplayable on phones (large potential audience lost)
- [ ] Add viewport meta tag to layout.tsx — currently missing, causes broken mobile rendering
- [ ] Increase HUD/message log font size from text-xs (12px) to text-sm (14px) — current text is hard to read
- [ ] Track and display personal best stats in localStorage (best floor, best level, total runs, total kills) — zero meta-progression makes runs feel disposable
- [ ] Item stat comparison tooltip: when standing on an item, show current vs. new stats — players can't make informed loot decisions without memorizing their gear
- [ ] Add simple movement animation (smooth tile-to-tile slide, ~100ms) — instant teleportation feels jarring

### P2 - Content Depth (EXPANDED — strategist content audit 2026-03-20)
- [ ] Floor themes (3 zones): Floors 1-4 "Void Tunnels" (current purple), Floors 5-9 "Crystal Depths" (cyan/blue palette, crystal wall colors), Floors 10+ "Shadow Realm" (dark red/black palette, reduced FOV). Each zone is a `ZoneTheme` data object: `{ name, bgColor, wallColor, floorColor, enemyPool, fovModifier }`. Dungeon generator selects theme by floor number. Mostly data, minimal code — massive perceived variety.
- [ ] 4 new enemy types for mid/late game: Void Turret (`T`, stationary, ranged attack every 2 turns, forces player to approach or avoid), Void Mimic (`!` or `[`, disguised as loot, attacks when adjacent — punishes careless pickup), Void Summoner (`Z`, spawns Void Rats every 3 turns, high priority target), Void Bomber (`B`, explodes on death dealing AoE to adjacent tiles — must be killed at range or with care)
- [ ] Floor 10 boss: "Shadow Twin" (symbol `@`, red) — mirrors player's movements inversely, copies player's current stats. Positioning puzzle boss. Floor 15 boss: "Rift Warden" (symbol `W`, white) — teleports every 3 turns, leaves damaging void patches, arena shrinks over time.
- [ ] Environmental hazards: trap tiles (hidden `,` — damage/teleport/alarm variants, revealed when stepped on or adjacent with high perception), lava tiles (`~` red — 3 dmg/turn while standing), void vents (`^` — periodic AoE pulse to adjacent tiles)
- [ ] Add multiple hero classes (Warrior: +10 HP +2 ATK -1 DEF; Mage: starts with 2 scrolls, scrolls are 50% more effective; Rogue: +2 detect range, 15% dodge, starts with Invisibility potion). Each class changes starting stats and has one passive. Unlocked via achievements (reach floor 5, 10, etc.)
- [ ] Epic rarity tier (purple `#9333ea`): floor 8+ only, <5% drop chance. All Epic items have a runic effect guaranteed. Examples: "Nullblade" (+8 ATK, Vampiric), "Abyssal Aegis" (+7 DEF, Reflective + Thorned), "Elixir of Ascension" (full heal + +2 to all stats permanently)

### P2 - Meta Progression
- [ ] Persistent unlocks between runs (new hero classes, starting items)
- [ ] Run history / stats tracking
- [ ] Leaderboard (deepest floor reached)

### P3 - Accessibility (NEW — strategist analysis 2026-03-20)
- [ ] High-contrast mode / colorblind-safe palette toggle — rarity colors (gray/green/blue) may be indistinguishable for colorblind players
- [ ] ARIA live region for message log so screen readers announce game events
- [ ] Semantic HTML for HUD elements (use landmarks and roles)

### P3 - Monetization
- [ ] Design premium content packs (cosmetic + content, NOT pay-to-win)
- [ ] Set up Stripe integration for purchases
- [ ] Premium hero skins
- [ ] Premium dungeon themes

### P3 - Growth
- [ ] SEO optimization (landing page, meta tags)
- [ ] Social sharing (share your run stats)
- [ ] Mobile touch controls
- [ ] Open Graph / Twitter card preview

---

## Done
- [x] Project scaffolding and initial setup
- [x] Procedural dungeon generation
- [x] Player movement and turn system
- [x] Bump-to-attack combat
- [x] Enemy AI (chase behavior)
- [x] Field of view system
- [x] HUD (HP, floor, turns)
- [x] Message log
- [x] Death/restart flow
- [x] Floor progression via stairs
- [x] Item/loot system (weapons, armor, potions)
- [x] Inventory UI with equipment display
- [x] Health potions that drop from enemies
- [x] ESLint lint passes clean
- [x] Experience points and leveling system
- [x] Improved enemy AI (A* pathfinding, 4 behavior types, per-enemy detection ranges)
- [x] Color-coded message log (11 color categories for combat, loot, XP, healing, warnings, etc.)
- [x] Help overlay (press ? or H) with controls, mechanics, enemy bestiary, and item legend
- [x] Run stats on death screen (enemies killed, items found, damage dealt/taken, deepest floor, time played)
- [x] Pause menu (Escape key) with Resume, Help, Restart, Quit to Menu
- [x] Floating damage numbers on canvas (+HP, -DMG, LEVEL UP!) with animated float-up and fade
