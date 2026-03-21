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
- [x] Add mini-map showing explored areas

### P1 - Game Design (NEW — strategist research 2026-03-20)
- [x] Unidentified consumables: randomize potion/scroll appearances per run ("Fizzing Potion", "Crimson Potion", "Tattered Scroll", etc.). Each of the 6 potion types and 4 scroll types gets a random cosmetic name from a pool of 12+ descriptors. First use identifies the type for the rest of the run. Add `identified: Map<ConsumableEffect, boolean>` to GameState and `appearances: Map<ConsumableEffect, string>` for per-run randomization. Inventory shows "Fizzing Potion (?)" until identified, then "Fizzing Potion (Haste)". This transforms existing content into a discovery system — every run starts with 10 unknowns to uncover. Research source: NetHack, Shattered PD, Golden Krone Hotel all prove identification systems are the #1 replayability driver for consumable-heavy roguelikes.
- [x] Shareable death screen: add "Copy Run Summary" button to death screen that copies a formatted text block to clipboard — `☠ VOIDCRAWL ☠ Floor 7 | Level 5 | 23 kills | 12:45 | Killed by Rift Wraith`. Include a simple emoji-bar visualization of how far they got (▓▓▓▓▓▓▓░░░░░░░░ Floor 7/15). Research source: Rogule (350K+ games played) proves shareable results drive browser roguelike growth. Low effort — death screen already has all the data.
- [x] Daily seeded challenge: one dungeon per day, same seed for all players, accessible from main menu as "Daily Void". Uses date string as RNG seed so all players get identical floor layouts, enemy spawns, and item drops. Show personal result vs. community stats (deepest floor reached today). Store daily results in localStorage. Research source: Rogule's entire growth model — daily puzzle format creates return visits and social sharing. Medium effort — requires seeded RNG wrapper around Math.random() calls in generation code.

### P1 - Content Depth (NEW — strategist content audit 2026-03-20)
- [x] Consumable variety: add 6 potion types beyond healing (Haste, Invisibility, Teleport, Fire, Poison, Strength) + new Scroll item category with 4 types (Magic Mapping, Enchanting, Fear, Summon Ally) — only healing potions exist; zero tactical consumable decisions. Symbol `?` for scrolls. This is the single highest-impact content addition per effort.
- [x] Enemy special abilities: retrofit existing 9 enemies with unique mechanics (Void Beetle: armored -1 dmg; Shadow Wisp: 30% phase/dodge; Dark Slime: splits into 2 Mini Slimes on death; Shade: life drain heals 50% of damage; Void Walker: teleports when hit; Abyssal Hound: howl alerts other hounds; Rift Wraith: moves through walls, only vulnerable on floor tiles) — enemies are currently pure stat blocks, combat has no tactical variety
- [x] Floor 5 boss encounter: "Void Nucleus" (symbol `O`, cyan) — stationary, spawns add waves, players must manage spawns then DPS during pause. Boss room is a single large generated room with no corridor escape. Boss telegraphs special attack 1 turn before via message. Guaranteed rare+ loot drop on kill.
- [x] Weapon/armor runic effects: add `runic` property to Item interface. Weapon runics: Vampiric (heal 1 HP on kill), Flaming (25% burn DoT), Stunning (20% skip enemy turn), Vorpal (2x dmg below 30% HP). Armor runics: Reflective (15% reflect damage), Regenerating (1 HP per 10 turns), Thorned (1 dmg to melee attackers). Uncommon items get 25% runic chance, Rare get 60%. Makes loot decisions interesting beyond "bigger number."

### P1 - Growth & Discoverability (NEW — strategist Growth/SEO analysis 2026-03-20)
- [ ] Add full Open Graph + Twitter Card metadata to `layout.tsx`: og:title, og:description, og:image, og:type, twitter:card, twitter:image, keywords, metadataBase, canonical URL, theme-color. Currently only title and description exist — every link shared on Discord/Twitter/Reddit shows a bare text link with no preview image. This is the single lowest-effort, highest-impact growth fix. Code example in `.planning/research/SEO_TECHNICAL_RESEARCH.md`.
- [ ] Create dynamic OG image via `src/app/opengraph-image.tsx` using Next.js ImageResponse API — dark void background, "VOIDCRAWL" in glowing cyan, "FREE BROWSER ROGUELIKE" tagline, feature pills. 1200x630px PNG. This auto-generates the og:image for all social platforms. Without this, shared links are invisible in feeds.
- [ ] Add `src/app/sitemap.ts` and `src/app/robots.ts` — Next.js 16 has built-in support. sitemap.xml enables Google to index pages; robots.txt controls crawling. Both are 5-10 lines of code each. Required for Google Search Console submission.
- [ ] Add JSON-LD structured data (schema.org/VideoGame + SoftwareApplication co-type) to landing page — enables Google rich results (price, platform, genre display in search). Create `src/app/json-ld.tsx` component, add to layout. Code example in research file.
- [x] Remove `"use client"` from `src/app/play/page.tsx` — the page already uses `dynamic()` to import GameCanvas client-side, so the page itself should be a Server Component. This enables adding page-level metadata exports for the /play route (currently impossible because metadata can only be exported from Server Components).
- [ ] Add descriptive SEO paragraph to landing page (`src/app/page.tsx`) — currently almost no crawlable text content. Add a "What is Voidcrawl?" section below the fold with natural keyword usage: "free turn-based roguelike", "browser dungeon crawler", "procedural generation", "no download required". One paragraph hits 8+ target keywords.
- [ ] Create itch.io page for Voidcrawl — link to Vercel deployment, add 3+ screenshots, cover image (630x500), tags (roguelike, dungeon-crawler, turn-based, browser, HTML5, free). itch.io is the #1 platform for indie browser game discovery. No approval process needed. Research: Rogule, A Dark Room, and most successful browser roguelikes list on itch.io.
- [ ] Create RogueBasin wiki page for Voidcrawl — RogueBasin is THE roguelike database. Every roguelike should have a page. Self-service wiki, free, permanent discoverability by core roguelike players. Include: name, developer, platform (Web), language (TypeScript), status, description, screenshots, link.

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

### P2 - Game Systems (NEW — strategist research 2026-03-20)
- [ ] Void Attunement system — the game's unique mechanical hook. A 0-100 meter that increases when the player interacts with void elements: using void shrines (+15), descending floors (+5 per floor), absorbing certain item effects. At thresholds, player gains BOTH a power and a curse. 25%: Void Sight (+2 FOV radius) / enemies detect from +3 further. 50%: Void Step (can phase through 1 wall per floor) / max HP reduced by 15%. 75%: Void Strike (+3 ATK) / healing 50% less effective. 100%: Void Avatar (double damage, see entire floor) / lose 1 HP per turn. Purification Scroll (new rare consumable) reduces attunement by 25. This creates the game's central risk-reward axis: every run becomes a story about how much void power the player chose to embrace. Render as a purple meter in HUD next to HP. Research source: community consensus says every successful roguelike needs a unique hook (Cogmind=modular robots, Hoplite=geometry, 868-HACK=siphon economy). Void Attunement makes the theme mechanical, not just cosmetic.
- [ ] Void shrines: interactive `$` tiles (purple) that spawn 1 per floor in a random room. Walking onto one prompts "Commune with the Void? (Y/N)". Effects drawn from weighted pool: Heal 50% HP (20%), +1 permanent stat (15%), Identify all items (15%), Random consumable (15%), Spawn 2 enemies nearby (15%), Curse equipped weapon or armor (10%), Teleport to stairs (10%). Each use adds +15 Void Attunement. Creates gambling moments and memorable run stories. Research source: NetHack altars/fountains — the most-remembered moments in roguelikes come from gamble tiles.
- [ ] Cursed equipment: 15% of Uncommon and 30% of Rare weapons/armor spawn cursed. Cursed items have a hidden negative runic (weapon: -2 ATK penalty, armor: -2 DEF penalty) and CANNOT be unequipped until a Scroll of Remove Curse (new uncommon scroll) is used. Unidentified until equipped — pairs with the identification system. Wearing a cursed item shows red "(cursed)" tag in inventory. Creates genuine tension when finding new gear: "Do I risk equipping this unidentified Rare sword?" Research source: NetHack, Shattered PD — cursed items are a core risk-reward mechanic in every major roguelike.
- [ ] Enemy intent telegraphing: enemies display a 1-character intent indicator above their sprite on the canvas. `!` (red) = will attack next turn, `?` (yellow) = has detected player and is approaching, `~` (gray) = wandering/idle, `↓` (blue) = fleeing. Update each enemy's intent in moveEnemies() based on distance to player and AI behavior. Renders via renderer with small offset above entity. Makes combat a solvable positioning puzzle instead of bump-and-react. Research source: Hoplite, Slay the Spire — showing enemy intent is the single biggest tactical depth improvement in modern roguelikes.
- [ ] Run narrative recap on death screen: auto-generate a floor-by-floor highlight log from key game events. Track `narrativeEvents: Array<{floor, turn, text}>` in GameState. Record: first enemy kill, boss encounters, near-death moments (HP < 20%), rare item finds, level ups, potion identifications. Death screen shows a scrollable "Your Story" section: "Floor 1: Found a Void Blade. Floor 3: Nearly died to Dark Slime (2 HP remaining). Floor 5: Reached Level 4." Makes each run feel like a story worth remembering and sharing. Research source: Caves of Qud's emergent narrative — the best roguelike moments are player-generated stories.

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

### P2 - Monetization Foundation (REDESIGNED — strategist monetization analysis 2026-03-20)
- [ ] Set up Ko-fi page for Voidcrawl — 0% platform fee on tips, instant payout via PayPal/Stripe. Add "Support the Developer" link to landing page and death screen. Zero cost, takes 15 minutes. Ko-fi outperforms Buy Me a Coffee (5% fee) and doesn't require content cadence like Patreon. This is the lowest-friction way to accept supporter money before the game has paid content.
- [ ] Set up GitHub Sponsors for benwalker14 — 0% platform fee (GitHub absorbs all fees). Add sponsor button to GitHub repo. Developer-audience tip jar that pairs with the dev.to/HN growth strategy. Roguelike devs who find the game via code will discover the sponsor option naturally.
- [ ] Add `isPremium` flag to Item interface and `premiumPack?: string` field — the content unlock system needs a data model before content packs can be built. Items with `isPremium: true` are filtered from the base loot pool. When a pack is purchased, its items are added to the pool. Store unlocked packs in localStorage (with optional backend validation later). This is the minimal architecture needed — no payment integration required yet.
- [ ] Design 3 content packs with specific items, pricing, and value propositions (see details below). Each pack should feel like a meaningful expansion, not a nickel-and-dime extraction:
  - **"Crystalline Depths" ($1.99):** Crystal zone theme (floors 5-9 visual overhaul: cyan/blue palette, crystal walls, ice floor tiles) + 2 new crystal-themed enemies (Crystal Golem: reflects 25% damage, Crystal Spider: web trap on death slows player) + 1 crystal boss (Crystal Warden, floor 7) + 3 crystal weapons/armor with unique runics. Content-only, no stat advantage over base game equivalents.
  - **"Heroes of the Void" ($2.99):** 3 hero classes (Warrior: +HP/+ATK; Mage: enhanced scrolls + starts with 2; Rogue: dodge chance + enhanced detection) + class-specific starting items + 1 cosmetic death screen theme per class. Each class changes playstyle without being strictly better than the default.
  - **"Shadow Realm" ($1.99):** Shadow zone theme (floors 10+ visual overhaul: dark red/black palette, reduced FOV, shadow particles) + 2 shadow enemies + 1 shadow boss (Shadow Twin, floor 10) + 3 shadow weapons/armor. Late-game expansion for experienced players.
  - **"Void Champion Bundle" ($4.99):** All 3 packs at 28% discount vs. individual ($6.97 value). Price anchor makes individual packs feel reasonable.
- [ ] Integrate Lemon Squeezy for content pack purchases — Lemon Squeezy (acquired by Stripe 2024) is a Merchant of Record that handles global sales tax collection/remittance. 5% + $0.50 per transaction. Has official Next.js SDK, built-in license key generation for validating purchases, and checkout overlay. Better than raw Stripe for a solo dev (Stripe requires you to handle sales tax yourself or pay an extra 0.5% for Stripe Tax). Better than Gumroad (10% + $0.50 fee). Create `/api/webhooks/lemonsqueezy` route handler for purchase validation.
- [ ] Add "Support" section to landing page — simple row below the game features: Ko-fi tip button + "Content Packs" link (disabled until packs ship, shows "Coming Soon"). Keep it tasteful — one line, not a storefront. The game sells itself through gameplay, not a sales pitch.

### P3 - Monetization Long-Term (NEW — strategist monetization analysis 2026-03-20)
- [ ] Add "Support the Void" PWYW option on itch.io page — suggested $5, minimum free. itch.io data shows players pay ~$1.50 above minimum on average. 30% of all itch.io money spent is "extra" above the minimum price. Good supplementary revenue alongside content packs.
- [ ] Consider Steam release at $4.99-$7.99 when game has 3+ content packs and 10+ hours of content. Include all content packs in the Steam price. Steam provides: payment infrastructure, wishlist system, community hub, visibility via algorithm. A Dark Room went from free browser game to $0.99 iOS (#1 App Store, $697K over 2 years). Dwarf Fortress sold 160K copies at $29.99 in 24 hours on Steam after being free for 15 years. The browser version stays free forever — Steam version is a "deluxe edition."
- [ ] Sponsorware model for new content releases — new hero classes/themes are Ko-fi/GitHub Sponsors exclusive for 2 weeks, then released free to all players. This rewards supporters without permanently gating content. Caleb Porzio (Alpine.js) grew from $573/month to $100K/year using this model. Requires a supporter authentication system (email-based unlock codes from Ko-fi/Sponsors webhooks).
- [ ] Cosmetic death screen themes — 3-5 visual variants for the death screen (Void Purple, Crimson, Celestial Gold, Neon Synthwave, Parchment). $0.99 each or $2.99 for all. Purely cosmetic, visible in shareable run summaries (adds a visual signature when shared). Low effort — mostly color palette and layout tweaks to existing death screen.
- [ ] Premium hero skins — alternate visual representations for the player character. ASCII variant packs (different symbols + color schemes) or pixel art skins when sprites are added. $0.99-$1.99 per pack. Zero gameplay impact.

### P2 - Growth & Community (NEW — strategist Growth/SEO analysis 2026-03-20)
- [ ] Set up Google Search Console: verify site ownership, submit sitemap.xml, request indexing of `/` and `/play`. Monitor "Performance" tab for search queries and impressions. Free, takes 15 minutes, essential for understanding how players find the game.
- [ ] Create press kit page (`/press` route): game description (short + long), 5-8 downloadable screenshots, logo PNG, gameplay GIF, fact sheet (genre, platform, price, developer, contact), download links. Reference format: dopresskit.com. Enables press coverage and blog/review sites to write about Voidcrawl.
- [ ] Post to r/WebGames (131K members): "Voidcrawl - Turn-based roguelike dungeon crawler [browser]". Direct game link, respond to every comment. r/WebGames → Hacker News is the exact funnel Rogule used to get 19,000 players in one day. Timing: when game has shareable death screen + OG images.
- [ ] Post to r/roguelikes (160K+ members): genuine community participation first (10:1 ratio of contributions to self-promotion), then share Voidcrawl. The audience perfectly matches the game.
- [ ] Start weekly r/roguelikedev Sharing Saturday participation: show development progress weekly. 500+ weekly threads and counting — the primary showcase mechanism for roguelike developers. Post early in the thread (first hour gets most views).
- [ ] Submit "Show HN: Voidcrawl – a turn-based browser roguelike" to Hacker News: post on Sunday (less competition), use "Show HN:" prefix, factual language, technical angle ("Built with Next.js + HTML5 Canvas"). Reply to every comment in the first hour. Rogule hit #1 on HN and got 19K players that day.
- [ ] Write dev.to post: "Building a Browser Roguelike with Next.js and HTML5 Canvas" — targets developer keywords, generates backlinks, builds credibility in dev community. Cross-post to Hashnode/Medium.
- [ ] Submit to Newgrounds as HTML5 game — established indie game community with strong appreciation for retro/ASCII aesthetics. Good cultural fit for Voidcrawl.

### P3 - Growth (EXPANDED — strategist Growth/SEO analysis 2026-03-20)
- [ ] Social sharing channels: Twitter/X post button (using Web Share API or tweet intent URL), Reddit-formatted run summary, itch.io community integration. Builds on the P1 shareable death screen clipboard copy.
- [ ] Submit to additional game directories: BBOGD, Top Web Games, iDev Games, Armor Games, GameJolt, FreeToGame. Lower traffic individually but compound over time.
- [ ] Enter next year's 7DRL jam with a Voidcrawl spin-off variant (e.g., "Voidcrawl: The Breach" — 7-floor speed-run). Cannot submit existing game (violates rules), but a standalone variant built during jam week links back to the main game. 7DRL is the #1 roguelike-specific jam.
- [ ] Remove unused Phaser dependency from package.json (~1MB) — it's listed as a dependency but the game uses vanilla HTML5 Canvas. Reduces bundle size and improves PageSpeed scores.
- [ ] Consider Discord server when daily active players exceed 50. Premature Discord servers feel empty and deter joiners. Until then, community lives on Reddit threads, itch.io comments, and GitHub Issues.
- [ ] Run `@next/bundle-analyzer` to measure bundle sizes and confirm game engine is properly code-split. Add "analyze" script to package.json.

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
- [x] Consumable variety: 6 new potion types (Haste, Invisibility, Teleport, Fire, Poison, Strength) + 4 scroll types (Mapping, Enchanting, Fear, Summoning) with full status effect system
- [x] Enemy special abilities: 7 unique mechanics (Beetle armored, Wisp phase/dodge, Slime split-on-death, Shade life drain, Walker teleport-on-hit, Hound howl alert, Wraith wall-phasing + floor-only vulnerability)
- [x] Floor 5 boss encounter: "Void Nucleus" — stationary boss in large arena room, spawns Void Fragment adds in waves, telegraphs AoE attack, alternates active/vulnerable phases, boss HP bar in HUD, guaranteed rare+ loot on kill
- [x] Weapon/armor runic effects: 4 weapon runics (Vampiric, Flaming, Stunning, Vorpal) + 3 armor runics (Reflective, Regenerating, Thorned). Uncommon items 25% runic chance, Rare 60%. Runics displayed in purple [brackets] in HUD, inventory, and help overlay. Burns and stuns affect enemy behavior each turn.
- [x] Unidentified consumables: 12 potion descriptors + 12 scroll descriptors randomly assigned per run. 7 potion effects and 4 scroll effects start unidentified. First use reveals the type for the rest of the run. Inventory shows "Fizzing Potion (?)" until identified, then "Fizzing Potion (Haste)". Identification state persists across floors. Help overlay explains the system.
- [x] Mini-map: canvas overlay in top-right corner showing full 40x30 dungeon. Explored tiles dimmed, visible tiles bright, player as cyan dot, enemies in red, boss in yellow, stairs in cyan. Viewport rectangle shows current camera view. Toggle with M key. On by default.
- [x] Daily seeded challenge: "Daily Void" mode accessible from main menu. Uses date string as RNG seed (mulberry32 PRNG) so all players get identical floor layouts, enemy spawns, item drops, and consumable appearances. One attempt per day stored in localStorage. Completion screen shows stats and prevents replay. Seeded RNG re-seeds per floor for deterministic generation. Death screen includes daily tag in share text.
