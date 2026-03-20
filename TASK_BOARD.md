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

- [ ] Add run stats to death screen (enemies killed, items found, damage dealt/taken, deepest floor, time played) — gives players a reason to care about each run
- [ ] Pause menu (Escape key) with Resume, Help, Restart, Quit to Menu — currently no way to pause or access help mid-game
- [ ] Add floating damage numbers on canvas (brief "+5 HP", "-3 DMG" over entities) — combat currently has zero visual feedback beyond message log

### P1 - Core Gameplay
- [ ] Add more enemy variety per floor tier
- [ ] Add mini-map showing explored areas

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

### P2 - Content Depth
- [ ] Add multiple hero classes (Warrior, Mage, Rogue)
- [ ] Add floor themes (void caves, crystal depths, shadow realm)
- [ ] Add boss enemies every 5 floors
- [ ] Add special/rare items with unique effects
- [ ] Add environmental hazards (traps, lava, etc.)

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
