# Nullcrawl Agent Activity Log

### 2026-03-20 21:00 | developer | Personal best tracking + HUD ATK bug fix
- **Personal best tracking:** Added `nullcrawl_bests` localStorage tracking for bestFloor, bestLevel, mostKills, mostDamage
  - `PersonalBests` interface with load/save/check helpers in GameCanvas.tsx
  - On game over (death or victory), compares current run to stored bests
  - Death/victory screen shows gold "NEW BEST!" badge next to any record-breaking stat
  - Non-record deepest floor shows previous best as "(best: N)" reference for "one more run" motivation
  - Bests persist across runs; state resets on restart to load latest from localStorage
- **Bug fix — HUD ATK:** `getStatsFromState()` now includes `getAttunementAtkBonus(state.voidAttunement)` in the attack calculation. Previously the HUD showed ATK without the Void Strike +3 bonus, while the engine correctly applied it in combat. HUD now matches actual damage output.
- Lint and build both pass clean
- No money spent

### 2026-03-20 20:00 | developer | Add item drop command (Q key)
- Added `dropItem()` function to engine.ts — removes item from inventory, places as GroundItem at player position
- Added Q-key drop mode to GameCanvas: press Q to enter drop mode, then 1-8 to drop that slot (D key conflicts with WASD movement)
- Shows "Drop which item? (1-8)" prompt in message log; any non-number key cancels
- Drop mode auto-cancels when opening help, pause, or pressing Escape
- Updated HelpOverlay controls section and Items description with drop instructions
- Fixed pre-existing lint errors: moved restart/continueToEndless/copyRunSummary to useCallback before the useEffect that references them (react-hooks/immutability violations)
- Lint and build both pass clean

### 2026-03-20 19:30 | developer | Add keyboard controls to death/victory screen
- Added R/Enter to restart, C to copy run summary, E to continue endless mode (victory only)
- Extracted copy logic into reusable `copyRunSummary` function (DRY refactor)
- Added keyboard hint text below buttons on death/victory overlay
- Updated HelpOverlay Controls section with death screen keybindings (R/Enter, C, E) and Esc
- Roguelike players are keyboard-first; mouse-only death screen was a flow-breaker

### 2026-03-20 00:00 | developer | Initial project setup
- Scaffolded Next.js 16 project with TypeScript and Tailwind CSS 4
- Built core game engine: dungeon generation, combat, FOV, rendering
- Created playable MVP with procedural dungeons, enemies, and floor progression
- Set up agent infrastructure (CLAUDE.md, TASK_BOARD.md, etc.)

### 2026-03-20 12:00 | reporter | Daily report
- Read AGENT_LOG.md, TASK_BOARD.md, FINANCES.md, HUMAN_INBOX.md
- Wrote daily report to HUMAN_INBOX.md
- Noted: no agent activity beyond initial developer setup; health/designer/strategist/reporter have not yet run
- Flagged 3 decisions for human: production URL, scheduler verification, ESLint config commit

### 2026-03-20 18:00 | developer | Item/loot system implementation
- Added item type system: weapons, armor, potions with Common/Uncommon/Rare rarities
- Created 13 item templates scaling across floor tiers (5 weapons, 5 armor, 3 potions)
- Implemented loot drop system: enemies have 35-60% chance to drop items on death
- Items render on the dungeon floor with rarity-colored symbols (/ weapons, [ armor, ! potions)
- Auto-pickup: walking over items equips if better, or adds to inventory
- Auto-equip: weapons/armor auto-equip when picked up if stronger than current
- Equipment bonuses apply to combat (attack from weapons, defense from armor)
- Inventory system: 8 slots, press 1-8 to use items (potions heal, equipment swaps)
- HUD now shows ATK/DEF stats and equipped weapon/armor names
- Inventory panel appears below canvas when items are held
- Fixed pre-existing ESLint issue (setState in useEffect) with eager initialization
- Lint and build both pass clean

### 2026-03-20 22:00 | developer | Experience points and leveling system
- Added PlayerProgression type (level, xp, xpToNext) to GameState
- Added xpReward field to GameEntity and enemy templates (5-75 base XP per enemy type)
- XP scales with floor depth alongside enemy stats (×1.15 per floor)
- XP to next level formula: 10 + level × 15 (level 2 = 25 XP, level 3 = 40 XP, etc.)
- On level up: +5 max HP, +1 ATK, +1 DEF, full heal, celebratory message
- XP awarded on enemy kill with message log feedback (+N XP)
- HUD shows Level indicator and animated XP progress bar (gold/yellow theme)
- Death screen now shows level reached alongside floor and turns
- Progression persists across floor transitions
- Lint and build both pass clean

### 2026-03-20 23:30 | developer | Enemy AI overhaul: pathfinding and behaviors
- Created A* pathfinding module (src/game/pathfinding.ts) with binary min-heap
  - findPath(): returns next step toward goal, navigates around walls/corridors
  - findFleeStep(): finds best adjacent tile to move away from a target
  - Search depth capped at 30 steps for performance
- Added AIBehavior enum with 4 behavior types:
  - CHASE: Standard A* pursuit (Void Walker, Abyssal Hound, Rift Wraith, Void Lord)
  - WANDER: Random movement until player is spotted, then pathfind chase (Void Rat, Void Beetle)
  - AMBUSH: Stationary until player enters short detect range, then aggressive (Dark Slime, Shade)
  - COWARD: Chase normally but flee when below 40% HP (Shadow Wisp)
- Added per-enemy detection ranges (3-16 tiles) instead of uniform 8-tile range
  - Short range: Dark Slime (3), Shade (4), Void Rat (5) — must get close to trigger
  - Long range: Abyssal Hound (12), Rift Wraith (14), Void Lord (16) — sense player from far away
- Rewrote moveEnemies() to use behavior-driven AI with pathfinding
- Enemies now properly navigate corridors, doorways, and around obstacles
- Blocked position tracking prevents enemies from stacking on same tile
- Lint and build both pass clean

### 2026-03-20 24:00 | strategist | Player Experience analysis (first strategist session)
- Performed comprehensive UX audit across 10 dimensions: controls, HUD, feedback, onboarding, death/restart, accessibility, mobile, visual clarity, performance, landing page
- **Top findings (highest impact-to-effort):**
  1. No help system — players have no way to learn game mechanics, enemy types, item rarities, or combat formulas. A press-? help overlay is low-effort, high-impact
  2. No visual combat feedback — all feedback is text-only in message log. Floating damage numbers and color-coded messages would dramatically improve game feel
  3. Mobile completely broken — no viewport meta tag, no touch controls. Game is unplayable on phones
  4. Death screen is bare — shows level/floor/turns but no run summary. Adding kill count, items found, and personal bests would increase "one more run" motivation
  5. No pause menu — no way to access help, restart, or quit mid-game
  6. Text too small — HUD and message log use 12px text, hard to read
  7. No stat comparisons — when finding items, player can't compare to current gear without memorizing stats
  8. No accessibility features — zero screen reader support, no colorblind mode
- Added 14 new tasks to TASK_BOARD.md across P1 (5), P2 (6), P3 (3) priorities
- Flagged mobile support question for human decision (HUMAN_INBOX.md)
- No money spent

### 2026-03-20 25:00 | developer | Color-coded message log
- Added GameMessage interface (text + color) and MSG_COLORS constant (11 named colors) to config.ts
- Replaced all `string` message types with `GameMessage` across engine.ts and GameCanvas.tsx
- Color mapping:
  - Red (#ef4444): enemy attacks player
  - Orange (#f97316): player attacks enemy
  - Light orange (#fb923c): enemy destroyed
  - Green (#22c55e): healing / potion use
  - Gold (#fbbf24): XP gain
  - Yellow (#facc15): level up
  - Cyan (#06b6d4): loot drops, item pickup
  - Sky blue (#38bdf8): equip/unequip
  - Yellow (#eab308): warnings (inventory full, already full health)
  - Dark red (#dc2626): player death
  - Light gray (#e2e8f0): general info (floor descent, etc.)
- Newest message renders at full opacity, older messages at 70% for visual hierarchy
- Updated combat() to detect player vs enemy attacker for appropriate hit colors
- Lint and build both pass clean

### 2026-03-20 26:00 | developer | Help overlay system
- Created HelpOverlay component (src/components/HelpOverlay.tsx) with 5 sections:
  - Controls: movement, wait, inventory, help toggle keys
  - How to Play: combat formula, item pickup, leveling, stairs, permadeath
  - Map Symbols: @, ., #, > with colors
  - Enemies: all 9 enemy types with symbol, color, behavior description, floor range
  - Items & Rarities: all weapon/armor/potion types with rarity color coding
- Integrated into GameCanvas with ? or H key toggle, Escape to close
- Used ref + state pattern to avoid stale closure in keydown handler
- Game input blocked while help overlay is open (no accidental moves)
- Click-to-close on overlay background
- Updated footer hint to mention ? for help
- Lint and build both pass clean

### 2026-03-20 27:00 | developer | Run stats on death screen
- Added RunStats interface to config.ts: enemiesKilled, itemsFound, damageDealt, damageTaken, deepestFloor, startTime
- Updated combat() return type from boolean to { killed, damage } to enable damage tracking
- Engine now tracks all stats throughout gameplay:
  - damageDealt incremented on player attacks
  - damageTaken incremented on enemy attacks
  - enemiesKilled incremented on kills
  - itemsFound incremented on item pickups
  - deepestFloor updated on floor transitions
  - startTime set at game init for elapsed time
- RunStats persists across floor transitions via generateFloor()
- Death screen now shows 6-stat grid: enemies slain, items found, damage dealt, damage taken, deepest floor, time played
- Each stat has a thematic color matching existing message log palette
- Time played computed from startTime and formatted as Xm Ys
- Lint and build both pass clean

### 2026-03-20 28:00 | strategist | Content depth audit and planning (second strategist session)
- **Analysis type:** Content Planning (type B)
- Audited full content inventory: 9 enemies, 13 items (5 weapons, 5 armor, 3 healing potions), 0 bosses, 0 floor themes, 0 consumable variety, 0 environmental hazards, 0 item special effects
- Researched 6 benchmark roguelikes (Brogue, DCSS, Hades, Shattered Pixel Dungeon, Caves of Qud, Slay the Spire) for content design patterns
- **Key finding:** Replayability comes from combinatorial interactions between content elements, not raw content volume. Brogue achieves extraordinary depth with 68 enemies and ~70 items because those items interact with the environment and each other. Every new element should multiply the possibility space, not just add to it.
- **Current content vs. minimum viable for 10+ hours:** Enemies 9→25 needed, Bosses 0→3 needed, Consumable types 1→8 needed, Floor themes 0→3 needed, Item effects 0→8 needed
- **Biggest gaps identified (priority order):**
  1. **Consumable variety (CRITICAL):** Only healing potions exist. Every successful roguelike has 8-15 consumable types. Adding 6 potion types + 4 scroll types creates tactical decisions every turn. Highest impact-to-effort ratio of any content addition.
  2. **Enemy special abilities:** All 9 enemies are pure stat blocks with movement behaviors only. Adding unique mechanics (split on death, life drain, phase through walls, ranged attacks) to existing enemies requires zero new content creation — just behavior code.
  3. **Floor 5 boss:** Zero milestone encounters. Players need a concrete "can I beat floor 5?" goal. One boss with a spawn-management mechanic would create the game's first memorable moment.
  4. **Weapon/armor runics:** Items are pure +ATK/+DEF stat sticks. Runic effects (vampiric, flaming, stunning, thorned) make loot decisions interesting.
  5. **Floor themes:** 3 visual zones with distinct color palettes and enemy pools. Mostly data changes — massive perceived variety per effort.
- Added 4 new P1 content tasks, expanded P2 content section from 5 generic to 6 detailed implementation specs
- **Design principle:** Every new element should interact with OTHER systems (multiplicative content, not additive)
- No money spent

### 2026-03-20 29:00 | developer | Pause menu implementation
- Created PauseMenu component (src/components/PauseMenu.tsx) with 4 menu options:
  - Resume: closes pause menu, returns to game
  - Help: closes pause menu, opens help overlay
  - Restart: resets game state, starts fresh run
  - Quit to Menu: navigates back to landing page (/)
- Integrated into GameCanvas with Escape key toggle:
  - Escape opens/closes pause menu
  - If help overlay is open, Escape closes help first (then next Escape opens pause)
  - Game input fully blocked while pause menu is displayed
- Click-to-dismiss on overlay background (resumes game)
- Each menu button styled with thematic color (cyan/gold/orange/red) matching game palette
- Updated controls hint footer to mention "Esc to pause"
- Updated HelpOverlay close hint to include H key
- Used ref + state pattern (consistent with existing help overlay) to avoid stale closures
- Lint and build both pass clean

### 2026-03-20 30:00 | developer | Floating damage numbers
- Added FloatingText interface and pendingFloatingTexts array to GameState (config.ts)
- Engine emits floating texts on 4 event types:
  - Player attacks enemy: orange "-N" at enemy position
  - Enemy attacks player: red "-N" at player position
  - Potion healing: green "+N HP" at player position
  - Level up: yellow "LEVEL UP!" at player position
- Added renderFloatingTexts() to renderer.ts with:
  - 800ms animation duration
  - Float upward by 1.5 tiles
  - Black text outline (strokeText) for readability against any background
  - Smooth fade-out: full opacity for first 40%, then linear fade to 0
- Integrated requestAnimationFrame loop in GameCanvas.tsx:
  - Collects pending floating texts after each turn/inventory action
  - Runs animation loop independently of turn-based game updates
  - Properly cleans up on restart and component unmount
  - draw() also renders active floating texts to prevent flicker between turns
- Lint and build both pass clean

### 2026-03-20 31:00 | developer | Consumable variety: 10 new consumable types + status effect system
- Added SCROLL item category and ConsumableEffect enum (11 effect types) to config.ts
- Added StatusEffect system: StatusEffectType enum (Haste, Invisible, Strength), StatusEffect interface with type/turnsRemaining/value
- Extended GameEntity with poisonTurns, fearTurns, friendly, summonTurns fields
- Extended GameState with statusEffects array
- **6 new potion types added to items.ts:**
  - Haste Potion (Uncommon, Floor 2+): enemies move at half speed for 8 turns
  - Invisibility Potion (Rare, Floor 4+): enemies can't detect player for 10 turns, broken by attacking
  - Teleport Potion (Common, Floor 1+): instant random relocation with FOV update
  - Fire Potion (Uncommon, Floor 3+): 8 AoE damage to all enemies within 2 tiles
  - Poison Potion (Uncommon, Floor 2+): poisons enemies within 2 tiles, 2 dmg/turn for 5 turns
  - Strength Potion (Rare, Floor 3+): +3 ATK for 10 turns
- **4 scroll types added (symbol `?`):**
  - Scroll of Mapping (Uncommon, Floor 1+): reveals entire floor layout
  - Scroll of Enchanting (Rare, Floor 3+): +2 ATK to weapon or +2 DEF to armor
  - Scroll of Fear (Uncommon, Floor 2+): all visible enemies flee for 6 turns
  - Scroll of Summoning (Rare, Floor 5+): spawns Void Spirit ally for 15 turns
- **Full status effect system in engine.ts:**
  - Status effects tick down each turn with expiration messages
  - Haste: enemies skip movement every other turn
  - Invisibility: enemies wander randomly, can't detect or attack player
  - Strength: +3 ATK bonus applied to player combat
  - Attacking breaks invisibility with message feedback
  - Poison: 2 dmg/turn on poisoned enemies, kills award XP and drop loot
  - Fear: overrides enemy AI to flee from player
  - Status effects persist across floor transitions
- **Friendly entity (summon) AI:**
  - Void Spirit ally chases nearest enemy, attacks when adjacent
  - Awards XP and generates loot drops from kills
  - Auto-expires after summonTurns, with fade message
  - Player can swap positions with friendly entities (walk through)
- **UI updates:**
  - GameCanvas shows active status effects in HUD with turn countdown (Haste/Invisible/Strength)
  - Inventory shows effect descriptions for non-healing consumables and scrolls
  - Status effects cleared on restart
  - HelpOverlay updated: new scroll entries in Items & Rarities, new Consumable Effects section with all 11 effects described
- Lint and build both pass clean

### 2026-03-20 32:00 | strategist | Game Design Research — roguelike mechanics analysis (third strategist session)
- **Analysis type:** Game Design Research (type A)
- Researched 12+ roguelikes (Brogue, DCSS, NetHack, Shattered PD, Caves of Qud, Cogmind, Hoplite, 868-HACK, TOME, Rogule, WazHack, Golden Krone Hotel) for replayability-driving mechanics
- Studied browser roguelike market (Rogule's 350K+ games as case study), r/roguelikes community consensus, and game design theory (pre-action vs post-action luck, emergent vs intrinsic complexity)
- **Key finding #1: Voidcrawl needs a unique mechanical hook.** Every successful roguelike has one distinctive system (Cogmind=modular robots, Hoplite=geometry, 868-HACK=siphon economy). The void theme is atmospheric but not yet mechanical. Proposed "Void Attunement" — a 0-100 corruption meter that grants powers AND curses at thresholds, creating the game's central risk-reward axis. Every run becomes a story about how much void power the player embraced.
- **Key finding #2: Identification systems are the #1 underused replayability driver.** Voidcrawl has 6 potion types + 4 scroll types but they're all pre-identified. Randomizing appearances per run (NetHack/Shattered PD model) transforms existing content into a discovery system — 10 unknowns to uncover each run. Medium effort for massive replayability.
- **Key finding #3: Daily seeded challenges are a proven growth model for browser roguelikes.** Rogule (daily browser roguelike) attracted 350K+ games played with sub-1K DAU using the Wordle-like "one dungeon per day, same for everyone" format. Voidcrawl's existing generation system could support seeded RNG with moderate effort.
- **Key finding #4: Enemy intent telegraphing is the single biggest tactical depth improvement.** Hoplite and Slay the Spire prove that showing what enemies WILL do (attack, approach, flee) transforms combat from bump-and-react to a positioning puzzle. Simple 1-character indicators above enemies.
- **Key finding #5: Interactive dungeon features create the most memorable moments.** NetHack's altars, fountains, and thrones generate more player stories than any other feature. Proposed "Void Shrines" — gamble tiles that offer random boons/banes and increase Void Attunement.
- **Key finding #6: Cursed equipment pairs with identification to create genuine loot tension.** Currently all found items are safe to equip. Adding a 15-30% curse chance on higher-rarity items creates real risk-reward decisions.
- **Key finding #7: Shareable death screens drive organic growth.** Rogule's social sharing model works because browser roguelikes are inherently shareable. Clipboard-friendly run summaries cost almost nothing to implement.
- **Design principle discovered:** "Pre-action luck over post-action luck" — show the player what they're dealing with BEFORE they commit (visible enemy intent, item identification clues, shrine effect hints). Post-action randomness ("you swing and miss, 30% chance") feels unfair. Pre-action randomness ("you see a Fizzing Potion — risk drinking it?") feels like a choice.
- Added 8 new tasks to TASK_BOARD.md: 3 at P1 (unidentified consumables, shareable death screen, daily challenge), 5 at P2 (Void Attunement system, void shrines, cursed equipment, enemy intent, run narrative recap), 1 at P3 (game directory submissions)
- No money spent

### 2026-03-20 33:00 | developer | Enemy special abilities: 7 unique combat mechanics
- Added SpecialAbility enum (7 abilities) and specialAbility field to GameEntity in config.ts
- Updated all 7 applicable enemy templates in enemies.ts with their special ability
- **Void Beetle — ARMORED:** Takes 1 less damage from all attacks (+1 effective defense in combat function)
- **Shadow Wisp — PHASE:** 30% chance to dodge any incoming attack. Displays "DODGE" floating text when triggered. Works against player, summon, and all damage sources
- **Dark Slime — SPLIT:** On death, spawns up to 2 Mini Slimes in adjacent floor tiles. Mini Slimes have 30% parent HP, 60% parent ATK, 0 DEF, 30% parent XP. Works across all death sources: player attack, poison, fire potion, summon kills. Extracted reusable spawnSplitSlimes() helper
- **Shade — LIFE_DRAIN:** Heals 50% of damage dealt (min 1 HP). Displays purple floating text showing HP gained. Works on all attacks (vs player and summons)
- **Void Walker — TELEPORT:** Teleports to random floor tile when hit and survives. Displays "TELEPORT" floating text at destination. Creates cat-and-mouse gameplay
- **Abyssal Hound — HOWL:** When first spotting the player (enters detect range), howl alerts all other Abyssal Hounds on the floor, setting their detect range to 50 (effectively infinite). One-time per hound per floor. Warning message and floating text displayed
- **Rift Wraith — ETHEREAL:** Moves through walls (ignores wall collision during pathfinding, moves on primary axis toward player). Only vulnerable on floor tiles — attacks on wall/void tiles show "IMMUNE" and deal no damage. Creates positioning puzzle: lure it onto open ground
- Updated combat() function to return dodged flag and accept optional floatingTexts parameter
- Updated HelpOverlay enemy descriptions to include special ability summaries
- Lint and build both pass clean
- No money spent

### 2026-03-20 34:00 | developer | Floor 5 boss encounter: Void Nucleus
- Added BOSS_NUCLEUS to SpecialAbility enum + boss fields on GameEntity (isBoss, bossPhase, bossTurnCounter, bossTelegraphed) in config.ts
- Created generateBossRoom() in dungeon.ts: single large 16x12 arena centered on map, player starts at bottom, stairs at top behind boss. No corridors or escape routes
- Added isBossFloor() check — floor 5 triggers boss room generation instead of normal dungeon
- Created spawnBoss() in enemies.ts: "Void Nucleus" (symbol O, cyan), 60 base HP scaled by floor, 8 ATK, 3 DEF, 150 base XP. Stationary (skipped in moveEnemies)
- Created spawnBossAdd() in enemies.ts: "Void Fragment" (symbol o, light cyan), 6 base HP, chase behavior, spawned by boss during active phase
- Implemented processBossAI() in engine.ts with two-phase cycle:
  - **Phase 0 (ACTIVE):** Boss spawns 2 Void Fragments every 4 turns near itself. After 8 turns, telegraphs AoE 1 turn in advance ("a massive discharge is imminent!"), then executes 6-damage AoE to player within range 3. Transitions to vulnerable phase
  - **Phase 1 (VULNERABLE):** Boss is dimmed, spawns nothing for 5 turns. Player can DPS freely. Then cycles back to active phase
- Added boss-specific kill handling: victory message "The Void Nucleus shatters!", "BOSS SLAIN!" floating text, guaranteed rare weapon/armor + rare consumable drop via new generateBossLoot() function in items.ts
- Enhanced renderer: boss entity gets pulsing glow (cyan when active, green when vulnerable) + HP bar drawn below symbol on canvas
- Added boss HP bar to HUD in GameCanvas.tsx: shows boss name, HP bar with color thresholds, HP numbers, and phase indicator (ACTIVE/VULNERABLE)
- Added Void Nucleus and Void Fragment to HelpOverlay enemy bestiary
- Boss floor entry shows dramatic message: "A massive Void Nucleus pulses at the far end of the chamber!"
- Lint and build both pass clean
- No money spent

### 2026-03-20 35:00 | developer | Weapon/armor runic effects system
- Added RunicEffect enum to config.ts with 7 runics: 4 weapon (Vampiric, Flaming, Stunning, Vorpal) + 3 armor (Reflective, Regenerating, Thorned)
- Added WEAPON_RUNICS, ARMOR_RUNICS arrays and RUNIC_NAMES display map to config.ts
- Added `runic?: RunicEffect` to Item interface, `burnTurns`/`stunnedNextTurn` to GameEntity
- Implemented runic rolling in items.ts: rollRunic() + applyRunicToItem() — Uncommon 25% chance, Rare 60% chance. Runic items get "of [Runic]" suffix (e.g., "Void Blade of Flaming")
- Applied runic rolling to both generateLootDrop() and generateBossLoot()
- Weapon runic effects in processPlayerTurn (engine.ts):
  - **Vorpal:** 2x damage multiplier when enemy below 30% HP (via new damageMultiplier param on combat())
  - **Flaming:** 25% chance to apply 3-turn burn (2 dmg/turn, ticked alongside poison)
  - **Stunning:** 20% chance to stun enemy (skip next turn, checked in moveEnemies)
  - **Vampiric:** Heal 1 HP on kill
- Armor runic effects:
  - **Thorned:** 1 damage to melee attackers after they hit player (in moveEnemies)
  - **Reflective:** 15% chance to reflect full damage back to attacker (in moveEnemies)
  - **Regenerating:** Heal 1 HP every 10 turns (end of processPlayerTurn)
- Added burn damage tick loop in processPlayerTurn (parallel to poison tick)
- Added stun check at top of moveEnemies loop — stunned enemies skip turn and clear flag
- Updated GameCanvas.tsx: equipment bar and inventory show runic tags in purple [brackets]
- Updated HelpOverlay.tsx: new "Runic Effects" section with all 7 runics described
- Lint and build both pass clean
- No money spent

### 2026-03-20 36:00 | strategist | Growth & SEO analysis (fourth strategist session)
- **Analysis type:** Growth & SEO (type D)
- Researched browser roguelike discovery channels, SEO tactics, social sharing mechanics, Reddit strategy, game directories, and community building patterns
- Studied 6+ case studies: Rogule (19K peak, 2K sustained daily from r/WebGames → HN pipeline), Wordle (90 → 300K in 2 months via emoji sharing), A Dark Room (2.26M downloads, #1 iOS from HN-driven web traction), Candy Box (350K+ gamesaves from word-of-mouth), DCSS WebTiles (25+ year community-driven growth)
- **Key finding #1: Voidcrawl's metadata is nearly empty — this is the single biggest quick win.** No Open Graph images, no Twitter cards, no sitemap, no robots.txt, no JSON-LD structured data. Every link shared on Discord/Twitter/Reddit shows a bare text link with no preview. Adding full metadata takes 1-2 hours and makes every future share 3-5x more likely to get clicked.
- **Key finding #2: The "Copy Run Summary" share mechanic is THE growth engine.** Wordle's emoji grid sharing drove its entire 300K growth arc. Rogule sustains 2K daily players with shareable run summaries. This is already on the task board at P1 — it should be the first feature built after technical SEO foundation.
- **Key finding #3: The r/WebGames → Hacker News pipeline is reproducible.** Rogule's developer confirmed: posted to r/WebGames, picked up by community, submitted to HN, hit front page. This exact funnel is the highest-leverage growth channel for browser games. Prerequisites: working game + OG images + shareable results.
- **Key finding #4: Browser roguelikes are a low-competition SEO niche.** Few individual browser roguelikes rank on page 1 — aggregators (itch.io, CrazyGames) dominate. A properly optimized landing page can rank quickly for long-tail keywords like "browser roguelike dungeon crawler" and "play roguelike online free". Most competitors (Rogule, WebBrogue, RuggRogue) have minimal SEO.
- **Key finding #5: `src/app/play/page.tsx` has `"use client"` which blocks metadata exports.** The page already uses `dynamic()` for GameCanvas — the page itself should be a Server Component. Removing `"use client"` enables page-level metadata, which improves the /play route's SEO.
- **Key finding #6: itch.io and RogueBasin are essential launch platforms.** itch.io is the #1 indie browser game platform (no approval process, 90/10 revenue split, devlog feeds). RogueBasin is the roguelike wiki — every roguelike should have a page. Both are free, permanent, and reach the exact target audience.
- **Key finding #7: Don't create a Discord server until 50+ DAU.** Premature Discord servers feel empty and deter joiners. Community should live on Reddit (r/roguelikedev Sharing Saturday), itch.io comments, and GitHub Issues until the player base justifies a dedicated space.
- **Key finding #8: Game jams are credibility builders, not primary growth channels.** Most jam entries get 20-100 plays. Jams provide: deadline pressure, built-in audience, devlog content, community credibility. But they supplement other strategies, not replace them. 7DRL is the #1 roguelike jam; Voidcrawl cannot submit the existing game (violates rules) but should create a spin-off variant for next year's jam.
- **Technical SEO recommendations (code-ready):**
  - Enhanced metadata export for `layout.tsx` with full OG/Twitter/robots/keywords (code in research file)
  - Dynamic OG image via `opengraph-image.tsx` using Next.js ImageResponse API
  - `sitemap.ts` and `robots.ts` (5-10 lines each)
  - JSON-LD structured data component (`json-ld.tsx`) using VideoGame + SoftwareApplication co-type
  - Descriptive SEO text paragraph for landing page
- Added 14 new tasks to TASK_BOARD.md: 8 at P1 (technical SEO + platform presence), 8 at P2 (community seeding), 6 at P3 (expanded growth channels)
- Reorganized Growth section: elevated SEO/OG tasks from old P3 to new P1 (they are prerequisite for all sharing/distribution), created new P2 community section
- Full research output saved to `.planning/research/GROWTH_SEO_RESEARCH.md` (770 lines) and `.planning/research/SEO_TECHNICAL_RESEARCH.md` (910 lines)
- **Growth strategy priority order:** (1) Technical SEO foundation → (2) Shareable death screen → (3) itch.io + RogueBasin pages → (4) Reddit community seeding → (5) Hacker News launch → (6) Daily challenge mode → (7) Platform expansion
- No money spent

### 2026-03-20 16:00 | developer | Unidentified consumables system
- Added per-run randomized consumable identification system (NetHack/Shattered PD inspired)
- 12 potion appearance descriptors (Fizzing, Crimson, Murky, Glowing, Swirling, Iridescent, Bubbling, Pale, Dark, Viscous, Sparkling, Smoky)
- 12 scroll appearance descriptors (Tattered, Gilded, Charred, Faded, Ornate, Crumpled, Ancient, Bloodstained, Shimmering, Dusty, Sealed, Fragile)
- 7 potion effects + 4 scroll effects (11 total) start unidentified each run, randomized to appearance names
- First successful use identifies the effect for the rest of the run, with discovery message
- Inventory displays "Fizzing Potion (?)" until identified, then "Fizzing Potion (Haste)"
- Pickup messages show randomized appearance names
- Identification state persists across floor transitions
- Help overlay updated to explain the identification mechanic
- Files modified: config.ts, data/items.ts, engine.ts, GameCanvas.tsx, HelpOverlay.tsx
- Lint and build both pass clean

### 2026-03-20 17:00 | developer | Mini-map overlay for dungeon navigation
- Added `renderMinimap()` function to renderer.ts: draws a 120x90px (40×30 tiles at 3px each) overview in the canvas top-right corner
- Mini-map features:
  - Semi-transparent dark background with border
  - Explored-but-not-visible tiles shown dimmed (walls: #2a2a3e, floors: #161628)
  - Currently visible tiles shown bright (walls: #4a4a66, floors: #2a2a4e)
  - Stairs shown in cyan (#06b6d4 visible, #044a5a explored)
  - Visible enemies shown as red dots (#ef4444), bosses as yellow (#f59e0b)
  - Visible ground items shown as cyan dots (#06b6d4)
  - Player always shown as bright cyan dot (#22d3ee)
  - White viewport rectangle shows current camera view bounds
- Integrated into GameCanvas.tsx:
  - Mini-map renders after main render() call and before floating texts
  - Also renders during floating text animation loop for consistency
  - On by default (showMinimapRef initialized to true)
  - Toggle with M key — works even when help/pause overlays are open
- Updated HelpOverlay.tsx: added "M — Toggle mini-map" to Controls section
- Updated controls hint footer: added "M for map"
- Lint and build both pass clean

### 2026-03-20 38:00 | developer | Shareable death screen with "Copy Run Summary" button
- Added `killedBy` field to RunStats interface (config.ts) to track what killed the player
- Engine now records killer name at both death points:
  - Enemy melee attack death: records enemy.name (e.g., "Rift Wraith", "Abyssal Hound")
  - Void Nucleus boss discharge death: records "Void Nucleus"
- Added "COPY RUN SUMMARY" button to death screen (GameCanvas.tsx):
  - Positioned alongside "TRY AGAIN" in a flex row
  - Gold border/text styling, switches to green "COPIED!" for 2 seconds on click
  - Uses navigator.clipboard.writeText() for clipboard access
- Shareable text format (3 lines):
  - `☠ VOIDCRAWL ☠`
  - `Floor 7 | Level 5 | 23 kills | 12:45 | Killed by Rift Wraith`
  - `▓▓▓▓▓▓▓░░░░░░░░ Floor 7/15` (15-char progress bar, proportional to floor/15)
- Copied state resets on game restart
- Lint and build both pass clean

### 2026-03-20 19:00 | strategist | Monetization Strategy analysis (fifth strategist session)
- **Analysis type:** Monetization Strategy (type C)
- Researched ethical monetization models across 15+ comparable indie games (Dwarf Fortress, Shattered PD, Caves of Qud, Hoplite, A Dark Room, Vampire Survivors, Rogule, Path of Exile, Balatro)
- Researched payment platforms (Lemon Squeezy, Stripe, Gumroad, itch.io), supporter platforms (Ko-fi, GitHub Sponsors, Patreon, Buy Me a Coffee), and browser game conversion data
- **Key finding #1: "Free core + paid content packs" is the proven model.** Dwarf Fortress: free ASCII for 15 years → $29.99 Steam premium → 160K sales in 24 hours, $7.2M in January 2023. Shattered PD: free with cosmetic donations → $5 on Steam/iOS. Vampire Survivors: $4.99 + $1.99 DLCs. This is the exact model Voidcrawl's ethics allow.
- **Key finding #2: Only 2-3% of free browser game players will pay anything.** At 10K MAU, expect 200-300 payers. Average indie game spend: $4-5. This means the game must have a large free audience before monetization generates meaningful revenue. Priority: audience growth FIRST, monetization infrastructure SECOND.
- **Key finding #3: Lemon Squeezy > raw Stripe for solo dev content sales.** Lemon Squeezy (acquired by Stripe 2024) is a Merchant of Record — handles global sales tax collection/remittance automatically. 5% + $0.50 per transaction vs. Stripe's 2.9% + $0.30 + self-managed tax compliance. Official Next.js SDK with checkout overlays and built-in license key generation. Less code, less liability.
- **Key finding #4: Ko-fi + GitHub Sponsors are the optimal tip platforms (both 0% fee).** Ko-fi takes zero platform fee on tips (Patreon takes 5-12%, BMC takes 5%). GitHub Sponsors takes 0% (GitHub absorbs fees). These two cover both general audience (Ko-fi) and developer audience (Sponsors). Typical indie game dev earnings: $150-800/month on Patreon; expect similar or less from tips.
- **Key finding #5: Content packs should be $1.99-$2.99 each, with a $4.99-$9.99 bundle.** Vampire Survivors DLCs at $1.99 are the benchmark for indie content packs. Price anchoring with a bundle (3 packs for $4.99 vs. $6.97 individual) increases perceived value by 3.2x. Total DLC cost should never exceed $20-25 — players react negatively to large cumulative DLC costs.
- **Key finding #6: Sponsorware model works for regular content releases.** Caleb Porzio (Alpine.js) grew from $573/month to $100K/year by making new features sponsor-exclusive for 2 weeks then free. Applied to Voidcrawl: new hero classes/themes exclusive to Ko-fi supporters for 2 weeks before public release. Rewards supporters without permanently gating content.
- **Key finding #7: itch.io PWYW captures "extra" money.** 30% of all money spent on itch.io is above the minimum price. Average buyer pays ~$1.50 above minimum. Good supplementary revenue alongside direct content sales.
- **Monetization model designed for Voidcrawl:**
  - Tier 0 (Free forever): Full base game in browser — all current content, no ads, no timers, no gates
  - Tier 1 (Supporter tips): Ko-fi + GitHub Sponsors + itch.io PWYW — expected $100-400/month at scale
  - Tier 2 (Content packs): "Crystalline Depths" $1.99, "Heroes of the Void" $2.99, "Shadow Realm" $1.99, "Void Champion Bundle" $4.99 — expected $500-1500/month at 10K MAU
  - Tier 3 (Future): Steam release $4.99-$7.99 with all content included — lump sum revenue event
- **Revenue projection (conservative):** At 5K MAU with 2.5% conversion: ~$600-800/month. At 10K MAU: ~$1,200-1,600/month. Break-even for domain + any future hosting costs almost immediately.
- Redesigned P3 Monetization section into P2 (foundation) + P3 (long-term), adding 11 specific tasks with implementation details, pricing, and rationale
- Wrote 3 decisions to HUMAN_INBOX.md: monetization timing, Lemon Squeezy vs Stripe, pricing validation
- All recommendations comply with ethics rules: zero loot boxes, zero energy timers, zero FOMO, zero pay-to-win. Content packs add variety, not power.
- No money spent

### 2026-03-20 22:15 | health | Scheduled health check
- **Build:** PASS — `npm run build` completed with no errors
- **Lint:** PASS — `npm run lint` completed with no warnings or errors
- **Security:** PASS — `npm audit` found 0 vulnerabilities
- **Deployment:** SKIPPED — production URL still TBD
- **Git status:** 10 modified files and 4 untracked files/dirs not yet committed (game code changes from recent developer/designer sessions, plus new `src/game/rng.ts`, `src/app/play/daily/`, `agents/logs/`)
- **Action needed:** Uncommitted work should be reviewed and committed soon to avoid accidental loss

### 2026-03-20 23:00 | developer | Daily seeded challenge — verified and committed
- Reviewed and verified the complete daily challenge implementation across all files:
  - `src/game/rng.ts` (new): mulberry32 PRNG, string→seed hashing, seedRng/seedRngForFloor/unseedRng, getDailySeed (YYYY-MM-DD), formatDailyDate
  - `src/game/config.ts`: GameMode ("standard" | "daily"), DailyResult interface, gameMode/seed fields in GameState
  - `src/game/engine.ts`: initGame accepts mode/seed, generateFloor re-seeds per floor for deterministic generation, state propagates mode/seed through floor transitions
  - `src/app/play/daily/page.tsx` (new): Daily play page loads GameCanvas with mode="daily"
  - `src/components/GameCanvas.tsx`: Daily mode prop, localStorage save/load for one-attempt-per-day, completion screen with stats, daily indicator in HUD/death screen, daily tag in share text
  - `src/app/page.tsx`: "DAILY VOID" button on landing page linking to /play/daily
  - All generation code (dungeon.ts, enemies.ts, items.ts) uses seeded `random()` from rng.ts
- Confirmed all players on the same date get identical floor layouts, enemy spawns, item drops, and consumable appearances
- One attempt per day: completed daily results saved to localStorage, returning shows completion screen
- Death screen share text includes daily date tag
- Build passes, lint passes clean

### 2026-03-20 23:15 | developer | Convert play pages to Server Components
- Removed `"use client"` from `src/app/play/page.tsx` and `src/app/play/daily/page.tsx`
- Created `src/components/GameLoader.tsx` — thin client wrapper with `dynamic()` import and `ssr: false`
- Both play pages are now Server Components, enabling `metadata` exports for SEO
- Next.js 16 requires `ssr: false` to live in Client Components — used wrapper pattern
- Build and lint pass clean

### 2026-03-20 23:30 | developer | SEO infrastructure: metadata, sitemap, robots
- Enhanced `layout.tsx` metadata: metadataBase, title template, full OG (type, siteName, url, title, description), Twitter Card (summary_large_image), keywords (8 terms), theme-color
- Added per-page metadata on `/play` ("Play | Voidcrawl") and `/play/daily` ("Daily Void | Voidcrawl") — enabled by Server Component conversion
- Created `src/app/sitemap.ts`: 3-page sitemap (/, /play, /play/daily) with appropriate changeFrequency and priority
- Created `src/app/robots.ts`: allows all crawlers, references sitemap URL
- Using `https://voidcrawl.vercel.app` as base URL — update when custom domain is configured
- Note: og:image not yet set (needs dynamic OG image generation — separate task)
- Build and lint pass clean

### 2026-03-20 23:40 | developer | SEO landing page text
- Added "What is Voidcrawl?" section below the feature grid on landing page
- Natural keyword usage: "free turn-based roguelike", "dungeon crawler", "browser", "no download required", "procedural generation", "permadeath", "daily seeded dungeon"
- Styled consistently with existing landing page (void-muted text, void-text heading)
- Build and lint pass clean

### 2026-03-20 23:50 | developer | Dynamic OG image for social media previews
- Created `src/app/opengraph-image.tsx` using Next.js ImageResponse API (Edge runtime)
- 1200x630px PNG: dark gradient background (#0a0a0f → #1a1a2e → #2d2d44), cyan "VOIDCRAWL" title with glow shadow, "FREE BROWSER ROGUELIKE DUNGEON CRAWLER" tagline, 4 feature pills (Turn-Based Combat, Procedural Dungeons, Runic Loot, Daily Challenge), subtle ASCII art at bottom, purple gradient top border
- Next.js auto-wires this as the og:image for the root route
- Build and lint pass clean

### 2026-03-20 24:00 | developer | JSON-LD structured data for Google rich results
- Added schema.org VideoGame + SoftwareApplication co-type JSON-LD to `layout.tsx`
- Includes: name, description, url, applicationCategory, operatingSystem, free pricing, 3 genres (Roguelike, Dungeon Crawler, Turn-Based Strategy), gamePlatform, playMode, author
- Injected via `<script type="application/ld+json">` in body for all pages
- Enables Google rich results with price, platform, and genre display in search
- Build and lint pass clean

### 2026-03-20 24:00 | developer | Hit/damage animations
- Added `HitEffect` interface to config.ts with position, color, and attack direction
- Added `pendingHitEffects: HitEffect[]` to `GameState` (same pattern as `pendingFloatingTexts`)
- Added `renderHitEffects()` to renderer.ts with 250ms two-phase animation:
  - Phase 1 (0-40%): bright white flash overlay on the hit tile, fading out
  - Phase 2 (0-100%): colored impact burst — 4 diagonal lines radiating outward from center, with a bright center dot
  - Orange burst for player attacks, red burst for enemy attacks
- Wired hit effects into `combat()` function — fires automatically for all combat interactions
- Added hit effect for boss AoE damage (Void Nucleus discharge)
- Renamed `startFloatingTexts` → `startAnimations` in GameCanvas.tsx to handle both floating texts and hit effects in the unified animation loop
- Hit effects render before floating texts (flash under the damage numbers)
- Hit effects cleared on game restart
- Build and lint pass clean

### 2026-03-20 19:10 | strategist | Growth & Branding analysis — game rename + launch readiness (sixth strategist session)
- **Analysis type:** Growth & SEO (type D, second pass)
- **Critical blocker addressed:** Human flagged that "Voidcrawl" has naming conflicts with existing games. Researched 15 candidate names for game uniqueness (web search for "[name] game" and "[name] roguelike") and domain availability (WHOIS lookup for .com and .io).
- **Name research results (15 candidates):**
  - TAKEN (5): Voidstep, Voidrift, Voidborne, Darkdelve, Voidwalk
  - RISKY (5): Abyssdive, Depthcrawl (TTRPG term), Nullvoid, Hollowrift (Minecraft brand), Gloomcrawl (Gloomhaven confusion)
  - CLEAR (5): Nullcrawl, Hollowdelve, Nulldepth, Abyssturn, Driftcrawl
- **Domain availability (both .com AND .io available):** Nullcrawl, Hollowdelve, Depthcrawl, Abyssturn, Hollowrift, Gloomcrawl
- **Decision: New name is "Nullcrawl"**
  - Zero existing games, products, or brands
  - Both nullcrawl.com and nullcrawl.io available
  - "Null" perfectly captures the void/nothingness theme
  - "Crawl" is THE genre identifier (DCSS = Dungeon Crawl Stone Soup)
  - Short (9 chars), memorable, easy to spell and type
  - Unique compound word = instant SEO dominance
  - "Null" resonates with the programmer/TypeScript audience
  - Runner-up: Hollowdelve (also fully clear, but longer and less genre-specific)
- **Launch readiness assessment:**
  - Game content: 9 enemy types + boss, 28 items, 11 consumable effects, 7 runics, identification system, daily challenge mode
  - SEO infrastructure: OG metadata, dynamic OG image, sitemap, robots.txt, JSON-LD, landing page SEO text — all complete
  - Verdict: **READY FOR SOFT LAUNCH** after name change and domain setup
  - Missing but non-blocking: audio, leaderboards, mobile touch controls, hero classes, floor themes
- **Launch-blocking tasks identified (must complete before Reddit/HN/itch.io posts):**
  1. Rename codebase from "Voidcrawl" to "Nullcrawl" (all code, metadata, SEO, share text, README)
  2. Purchase nullcrawl.com domain (~$10-12/year) — requires human action
  3. Update Vercel project URL and metadataBase
  4. Create itch.io page under new name
- **Post-rename priority reassessment:**
  - P0: Rename + domain (blocks everything)
  - P1: Void Attunement prototype (approved by human, the game's unique hook — differentiation matters more pre-launch than post-launch)
  - P1: Floor themes (massive visual variety for minimal code, makes screenshots/posts more compelling)
  - P1: itch.io page, RogueBasin page (discovery platforms)
  - P1: Community launch (Reddit r/WebGames + r/roguelikes, HN "Show HN")
  - P2: Ko-fi + GitHub Sponsors (capture early supporters)
  - P2: Mobile touch controls (expands audience)
- **Unused dependency found:** Phaser is listed in package.json but the game uses vanilla HTML5 Canvas. Removing it (~1MB) improves bundle size and PageSpeed scores.
- No money spent

### 2026-03-20 19:30 | developer | P0 Game rename: Voidcrawl → Nullcrawl
- Renamed all game title references from "Voidcrawl" to "Nullcrawl" across the entire codebase
- Updated source files: layout.tsx (metadata, OG, Twitter, JSON-LD), page.tsx (heading, SEO text), opengraph-image.tsx (alt text, title), HelpOverlay.tsx, GameCanvas.tsx (localStorage key, welcome message, share text), play/page.tsx, play/daily/page.tsx
- Updated package.json name field from "voidcrawl" to "nullcrawl"
- Updated project files: CLAUDE.md, TASK_BOARD.md, AGENT_LOG.md, FINANCES.md headers
- Updated agent files: all 4 agent prompts (developer, health-check, reporter, strategist) + 3 PowerShell scripts (orchestrator, run-agent, setup-schedule)
- Preserved: "Void" in thematic enemy/item names (Void Beetle, Void Nucleus, etc.) — only the GAME TITLE changed
- Preserved: Vercel deployment URL (voidcrawl-five.vercel.app) — will change when domain is purchased and Vercel project renamed
- Preserved: filesystem paths (D:\development\voidcrawl) — directory name unchanged
- Build passes clean
- No money spent

### 2026-03-20 20:00 | developer | Null Attunement prototype: corruption meter with 2 thresholds
- Added `voidAttunement` field (0-100) to GameState in config.ts
- Modified FOV system (fov.ts) to accept optional radius override, exported FOV_RADIUS constant
- **Attunement sources:**
  - +5 per floor descended (starting from floor 2)
  - Infrastructure ready for void shrines (+15) — will be connected when shrines are built
- **Threshold 1 — Void Sight (25%):**
  - Benefit: +2 FOV radius (7→9 tiles), applied in generateFloor, processPlayerTurn, and teleport
  - Curse: enemies detect player from +3 further range, applied in moveEnemies
- **Threshold 2 — Void Strike (50%):**
  - Benefit: +3 ATK bonus, applied alongside equipment and strength potion bonuses in processPlayerTurn
  - Curse: healing potions 50% less effective (minimum 1 HP heal), with "(weakened by void)" message
- **Attunement propagation:**
  - Passed through generateFloor as prevVoidAttunement parameter
  - Carried across floor transitions via all stair descent paths (normal + friendly swap)
  - Preserved in applyInventoryItem and processPlayerTurn via spread operator
- **HUD rendering (GameCanvas.tsx):**
  - Purple meter bar between XP bar and equipment bar (only visible when attunement > 0)
  - Bar color intensifies with attunement level (dark → medium → bright purple)
  - Threshold markers at 25% and 50% positions
  - Active effects displayed below bar with green (benefits) and red (curses)
- **Threshold crossing notifications:**
  - Purple floating text "NULL +5" on each floor descent
  - Special messages and floating text when crossing 25% and 50% thresholds
- **Help overlay:** New "Null Attunement" section explaining sources, thresholds, and effects
- Helper functions: getAttunementFovRadius, getAttunementDetectBonus, getAttunementAtkBonus (exported), getAttunementHealMultiplier
- Lint and build both pass clean
- No money spent

### 2026-03-20 19:30 | developer | Void Shrines implementation
- Added `TileType.SHRINE` (value 5) to config.ts with purple floor color
- Added `shrinePrompt: boolean` and `shrinesUsed: Set<string>` to GameState for interaction tracking
- **Dungeon generation:** 1 shrine placed per non-boss floor in a random room (avoids player start room)
  - Shrine tiles treated as walkable (like FLOOR) for pathfinding, FOV, and wall-border calculations
- **Added `spawnEnemyAtPos()` to generation/enemies.ts** for spawning single enemies at specific positions
- **Shrine interaction (engine.ts):**
  - When player steps on unused shrine → `shrinePrompt = true`, game pauses for Y/N input
  - `processShrine(state, accept)` handles accept/decline with full state immutability
  - Each use adds +15 Null Attunement with threshold crossing notifications (25%, 50%)
  - 7 weighted random effects (total 100%):
    - Heal 50% HP (20%), +1 permanent stat (15%), Identify all items (15%), Random item gift (15%), Spawn 2 enemies nearby (15%), Curse equipment (10%), Teleport near stairs (10%)
  - Declined shrines also marked used (one chance per shrine)
- **Renderer:** Canvas `$` symbol with pulsing purple glow, used shrines dimmed. Minimap purple dots.
- **GameCanvas:** Shrine prompt overlay UI with [Y]/[N] keys, blocks movement during prompt
- **Help overlay:** New "Void Shrines" section documenting all 7 effects with probabilities
- Lint and build both pass clean
- No money spent

### 2026-03-20 19:45 | strategist | Launch readiness & first-time player experience audit (seventh strategist session)
- **Analysis type:** Player Experience (type E, second pass — launch readiness focus)
- Deep-dived the full player journey: Reddit/HN link → landing page → first game → death → return. Audited every touchpoint for conversion friction and retention gaps.
- **Context:** Game content is now deep enough for launch (9 enemies + boss, 28 items, 7 runics, 11 consumable effects, identification, Null Attunement + Void Shrines, daily challenge, full SEO). The question is no longer "is there enough content?" but "will a first-time player survive long enough to discover the depth?"

**7 Critical Findings:**

1. **First-run experience is unguided.** Players are dropped into the dungeon with a text welcome message. The help overlay exists (? or H) but new players don't know it exists. ~70% of first-time players in browser games bounce within 30 seconds if they don't understand what to do. Fix: auto-show a brief first-run tutorial on first load (localStorage detection), dismissed with one click. Zero friction, massive clarity improvement.

2. **Landing page has no visual preview of gameplay.** The homepage has text, icons, and CTA buttons — but no screenshot, no GIF, no visual proof the game looks fun. Anyone clicking from Reddit/HN sees a dark page with words and must take it on faith that clicking "ENTER THE VOID" is worth their time. A single screenshot or 3-second looping GIF above the feature grid would dramatically increase click-through. Browser game landing pages with visual previews convert 2-3x better than text-only pages.

3. **Landing page promises features that don't exist.** The feature pill says "Unlock heroes and discover items" — but hero classes aren't implemented. This creates trust damage when players discover there's only one character. Should be reworded to match actual content (e.g., "Collect runic loot and discover items").

4. **Viewport meta tag is STILL missing from layout.tsx.** ~50% of Reddit/HN traffic is mobile. Without `export const viewport = { width: 'device-width', initialScale: 1 }`, mobile browsers don't scale the page properly — the entire layout renders broken. This is a 2-line fix. Even without mobile touch controls, the landing page and death screen should render correctly on phones so mobile users can at least learn about the game and bookmark it.

5. **No win condition — the game goes until you die.** There's no "You escaped the Void!" victory state. Players who reach floor 15 just keep going through stat-scaled enemies with no special reward. Adding a victory condition at floor 15 (or after a final boss) gives players a concrete goal and creates shareable achievement moments ("I beat Nullcrawl!"). This is the difference between "I played until I got bored" and "I'm trying to beat it."

6. **No personal best tracking.** After death, there's zero comparison to previous runs. No "New personal best!" celebration, no record board, no sense of meta-progression. Players have no reason to beat their own records. localStorage-based personal bests (best floor, most kills, fastest boss kill) with a "NEW BEST!" badge on the death screen would cost almost nothing to build and create significant "one more run" motivation.

7. **Late-game content cliff after floor 5 boss.** After defeating the Void Nucleus, floors 6-15 are just stat-scaled regular enemies with no special encounters, no visual change, and no new boss. Players who beat the floor 5 boss have seen the game's best content and hit a wall. Floor themes and the floor 10 boss would fix this. Floor themes should be built before community launch — screenshots with 3 visual zones are dramatically more compelling than one purple palette.

**Launch readiness verdict:** The game is mechanically ready but has 4 "first-5-minutes" gaps that will cause unnecessary bounce: no tutorial (high bounce risk), no gameplay visual on landing page (conversion loss), broken mobile rendering (50% of traffic affected), no win condition (goal-less play reduces motivation).

**Recommended pre-launch task order:**
1. Viewport meta tag (2 lines)
2. Fix landing page copy (1 line)
3. First-run tutorial overlay (small component)
4. Floor themes (data-driven visual variety)
5. Personal best tracking (localStorage)
6. Victory condition at floor 15 (win screen)
7. Gameplay screenshot/GIF on landing page (conversion)
8. Domain purchase + itch.io/RogueBasin pages
9. Community launch (Reddit/HN posts)

- Added 4 new P1 tasks and elevated 2 existing P2 tasks to P1 on TASK_BOARD.md
- Wrote findings to HUMAN_INBOX.md
- No money spent

### 2026-03-20 20:30 | developer | Floor themes (3 visual zones) + viewport fix + landing page copy fix

**Floor Themes — 3 Visual Zones:**
- Added `ZoneTheme` interface and `ZONE_THEMES` array to `config.ts` with `getZoneTheme()` and `getZoneTileColors()` helpers
- **Null Tunnels** (floors 1-4): Original purple palette — `#1a1a2e` floors, `#2d2d44` walls, cyan stairs
- **Crystal Depths** (floors 5-9): Cyan/blue palette — `#0f1a2e` floors, `#1a3a5c` walls, bright cyan stairs
- **Shadow Realm** (floors 10+): Dark red/black palette — `#1a0f0f` floors, `#3d1a1a` walls, red stairs, **-2 FOV radius**
- Updated `renderer.ts`: main render uses `getZoneTileColors()` for all tile drawing, zone background color, zone-tinted boss HP bar
- Updated `renderMinimap()`: minimap colors derived from zone palette using `lightenColor()` helper, zone-tinted border
- Updated `engine.ts`: floor descent message now shows zone name ("Floor 5 — Crystal Depths"), zone transition messages with atmospheric text and floating text announcements
- Updated `getAttunementFovRadius()` to incorporate `zone.fovModifier` — Shadow Realm stacks -2 FOV with Void Sight +2
- Added "Dungeon Zones" section to HelpOverlay with colored wall swatches and descriptions

**Quick Fixes:**
- Added `export const viewport: Viewport` to `layout.tsx` — fixes broken mobile rendering (launch blocker)
- Fixed "Unlock heroes and discover items" → "Collect runic loot and discover items" on landing page

**Build:** `npm run build` passes clean
- No money spent

### 2026-03-20 19:10 | developer | First-run tutorial overlay
- Added tutorial overlay that auto-shows on first game load for new players
- Detects first visit via `localStorage.getItem('nullcrawl_tutorial_seen')`
- Displays 3-line guide: WASD/Arrows to move, walk into enemies to attack, find > stairs to go deeper
- Styled as centered overlay on canvas with cyan void theme (matches game aesthetic)
- Dismissible via "Got it" button click, Enter, Space, or Escape key
- Sets `nullcrawl_tutorial_seen` in localStorage on dismiss — never shows again
- Blocks all game input while visible (keyboard handler early-returns)
- Includes "Press ? for full help" hint to guide players to the detailed help overlay
- Follows existing overlay pattern (absolute inset-0, pointer-events-none/auto, ref+state sync)

**Build:** `npm run build` passes clean. `npm run lint` passes clean.
- No money spent

### 2026-03-20 19:30 | developer | Floor 15 victory condition
- Added `VICTORY_FLOOR = 15` constant and `victory` boolean to `GameState` in config.ts
- Engine checks on stairs descent: if on floor 15 and victory not yet triggered, sets `gameOver = true` + `victory = true` instead of generating floor 16
- Victory screen: green/cyan palette ("YOU ESCAPED THE VOID!" + "Congratulations, Void Walker."), distinct from red death screen
- Full run stats grid (enemies, items, damage, floor, time) displayed on victory screen
- "COPY VICTORY SUMMARY" button generates trophy-emoji format: `🏆 NULLCRAWL 🏆 ESCAPED! Floor 15 | Level X | Y kills`
- "CONTINUE (ENDLESS)" button: calls `continueEndless()` which generates floor 16+ with victory flag preserved so the check doesn't re-trigger
- "NEW RUN" button restarts from floor 1 (resets victory flag)
- Death screen unchanged — only victory changes the visual treatment
- `continueEndless()` exported from engine, adds "endless mode" message on floor entry
- Daily challenge mode properly excluded from daily save on victory (only saves on death)

**Build:** `npm run build` passes clean. `npm run lint` passes clean.
- No money spent

### 2026-03-20 19:55 | strategist | Post-build player experience audit (eighth strategist session)
- **Analysis type:** Player Experience (type E, third pass — post-build deep audit)
- Audited the full codebase after all major content was built. Read config.ts, engine.ts, renderer.ts, GameCanvas.tsx, HelpOverlay.tsx, page.tsx. Cataloged complete content inventory (9 enemies + boss, 10 weapons/armor, 9 potions, 4 scrolls, 7 runics, 3 zones, 7 shrine effects, 2 attunement thresholds).

**5 NEW UX issues found (not previously on task board):**

1. **Keyboard dead on death/victory screen.** GameCanvas.tsx:311 blocks ALL keyboard input when `gameOver === true`. Players must use mouse clicks for "TRY AGAIN" / "NEW RUN" / "CONTINUE (ENDLESS)". Roguelike players are keyboard-first — this breaks flow. Fix: add keyboard handlers (R to restart, Enter to continue, C to copy summary) before the gameOver return guard.

2. **No item drop mechanic.** Inventory has 8 slots, only emptied by using consumables. When full, better weapons/armor can't be picked up ("Inventory full! Can't pick up item."). Players must waste consumables to make room. Fix: add D key + number to drop items to the ground tile. Essential inventory management.

3. **HUD ATK doesn't include attunement bonus.** `getStatsFromState()` computes attack as `player.attack + weaponAtk` but Void Strike (+3 ATK at 50% attunement) is computed separately in combat (engine.ts:1252). The displayed ATK is lower than actual damage output. This confuses players about their real power level. Fix: include attunement bonus in the displayed ATK number (it already shows the label separately, so the bonus would be visible in both places).

4. **Zero audio.** No sound effects anywhere in the codebase. Combat hits, level-ups, item pickups, boss encounters, zone transitions — all silent. For a game investing in visual feedback (floating text, hit animations, color bursts), the absence of audio is a noticeable gap in the feedback loop. Fix: add minimal Web Audio API sound layer with procedurally generated tones (no asset files needed).

5. **No floor/zone progress hint.** Players don't know that floor 5 has a boss, floor 5+ changes the visual theme, or floor 10+ reduces FOV. The zone transition messages only fire AFTER crossing the boundary. Adding a subtle zone indicator (e.g., "Null Tunnels 3/4" in the floor display) would create anticipation and give players a sense of progress toward the next zone.

**Assessment of previously-identified P1 items:**
- Gameplay screenshot on landing page (P1) — still needed, essential for conversion. The landing page has zero visual proof the game is fun.
- Personal best tracking (P1) — still needed, essential for "one more run" motivation. No comparison to previous runs on death.

**What's working well (no action needed):**
- Tutorial overlay: clean, minimal, dismissible via keyboard — good first-touch experience.
- Shrine prompt UI: atmospheric, clearly shows cost (+15 Attunement), Y/N controls are intuitive.
- Boss fight HUD: HP bar with phase indicator (ACTIVE/VULNERABLE) provides clear tactical information.
- Identification system: inventory shows descriptors with (?) until identified — creates discovery moments.
- Zone transitions: floating text + color shift + zone name message — dramatic and informative.
- Death/victory screen: good stat presentation, shareable clipboard copy, appropriate visual treatment.
- Daily challenge: one-attempt-per-day enforcement works correctly, shows previous result.

**Tasks added to TASK_BOARD.md:** 2 new P1 tasks (keyboard restart, item dropping), 3 new P2 tasks (sound effects, ATK display fix, zone progress hint).
- No money spent
