# Human Inbox

Messages from agents that need human attention. Do NOT delete entries — only append.

---

### 2026-03-20 | developer | Project initialized
Voidcrawl has been set up with a playable MVP. The following items need human action:

1. **GitHub repo**: Need to create `benwalker14/voidcrawl` on GitHub (or preferred name)
human response: done
2. **Vercel deployment**: Connect the repo to Vercel for auto-deploy
human response: done
3. **Domain**: Eventually need a domain (voidcrawl.io, voidcrawl.gg, etc.) — no rush
human response: deferring till later
4. **Agent scheduling**: Set up Windows Task Scheduler tasks (same pattern as DevBolt)
human response: done.

---

## 2026-03-20 12:00 - Daily Report

**From:** Reporter Agent
**Priority:** Info

### What Happened
- **Developer agent** completed initial project setup: Next.js 16 scaffold, core game engine (dungeon generation, combat, FOV, canvas rendering), and playable MVP with procedural dungeons, enemies, and floor progression
- **Human** responded to all 4 pending items: GitHub repo created, Vercel connected, domain deferred, agent scheduling set up
- No other agent activity logged yet (health, designer, strategist agents have not run)

### Current Status
- Tasks completed: 10 (full MVP foundation)
- Tasks in progress: 0
- Tasks pending: ~25 across P0–P3
- App health: Unknown — no health agent run yet. Recommend triggering a health check to confirm build and deployment status.

### Game State
- **Current feature set:** Procedural dungeon generation, player movement (arrow keys/WASD), turn-based bump-to-attack combat, enemy AI (chase behavior), field of view, HUD (HP/floor/turns), message log, death/restart flow, floor progression via stairs
- **Next priorities:**
  1. **P0** — Deploy to Vercel and confirm production URL is live
  2. **P0** — Add ESLint config (partially done, file exists but may need verification)
  3. **P1** — Add item/loot system (weapons, armor, potions) — this is the biggest gameplay gap

### Financial Summary
- Total spent: $0 (all services on free tiers)
- Total revenue: $0 (pre-launch)

### Decisions Needed
- **Production URL**: Vercel is connected — what is the production URL? Please update CLAUDE.md with it.
- **Agent run frequency**: Scheduler is set up, but no agents beyond the developer have run yet. Worth confirming the schedule is triggering correctly.
- **ESLint config**: There's a modified `eslint.config.mjs` in the working tree (unstaged). Should this be committed, or is it still being tuned?

---

### 2026-03-20 | strategist | Player Experience Audit — decisions needed

**From:** Strategist Agent (first session)
**Priority:** Medium

I completed a full UX audit of the game. Here's what I found and what needs your input:

#### Key Findings
The game's core loop is solid (movement, combat, loot, leveling, AI are all working well), but the **player-facing experience** has significant gaps that will hurt retention:

1. **No way to learn the game** — No help screen, no tutorial, no legend for enemy types or item rarities. Players must figure everything out by trial and error. This is the single biggest friction point.
2. **Zero visual combat feedback** — Combat only shows text in the message log. No damage numbers, no color changes, no animations. The game *feels* static even though the systems underneath are deep.
3. **Death screen undersells the run** — Only shows level/floor/turns. Adding enemies killed, items found, and personal bests would create "one more run" motivation.
4. **Mobile is completely broken** — No viewport meta tag (rendering will be wrong), no touch controls (literally unplayable on phones).

#### Decision Needed: Mobile Priority

Mobile browser games are a huge potential audience, but adding touch controls and responsive layout is moderate effort. Options:

- **A) Prioritize mobile now (P1)** — Build touch controls and responsive layout before adding more content. Gets more players in sooner.
- **B) Defer mobile (keep at P3)** — Focus on desktop experience and content depth first. Add mobile later when the game has more to offer.
- **C) Minimal mobile (P2)** — Just add the viewport meta tag and basic touch controls (virtual D-pad). Skip full responsive redesign.

I've set mobile tasks at P2 for now (option C). Let me know if you want to reprioritize.

#### What I Added to the Task Board
- 5 new P1 tasks: help overlay, color-coded messages, rich death screen, pause menu, floating damage numbers
- 6 new P2 tasks: mobile touch controls, viewport meta, larger fonts, personal best tracking, item comparison tooltips, movement animation
- 3 new P3 tasks: colorblind mode, ARIA screen reader support, semantic HTML

All suggestions comply with the ethics rules (no dark patterns, no monetization hooks).

---

### 2026-03-20 | strategist | Content Depth Audit — decisions needed

**From:** Strategist Agent (second session — Content Planning)
**Priority:** Medium-High

I audited the game's full content inventory and compared it against 6 benchmark roguelikes (Brogue, DCSS, Shattered PD, Hades, Caves of Qud, Slay the Spire). The core systems (combat, AI, loot, leveling) are solid, but the **content depth is well below the minimum for player retention**.

#### The Numbers

| Content | Voidcrawl Now | Minimum for 10+ hrs | Gap |
|---------|--------------|---------------------|-----|
| Enemy types | 9 | 20-25 | Big |
| Bosses | 0 | 3-4 | Critical |
| Consumable types | 1 (healing only) | 6-8 | Critical |
| Floor themes | 0 | 3 | Big |
| Item special effects | 0 | 5-8 | Big |
| Environmental hazards | 0 | 3-4 | Moderate |

#### What I Recommend Building First (in order)

1. **Consumable variety** — Add 6 potion types (Haste, Invisibility, Teleport, Fire, Poison, Strength) + 4 scrolls (Magic Mapping, Enchanting, Fear, Summon). This is the single biggest bang-for-buck content addition. Every successful roguelike has 8-15 consumable types because they create tactical decisions every turn.

2. **Enemy special abilities** — Retrofit existing enemies with unique mechanics (slime splits on death, shade drains life, wisp phases through attacks, wraith moves through walls). Zero new sprites needed, just behavior code. Makes every enemy encounter tactically different.

3. **Floor 5 boss** — "Void Nucleus" that spawns adds and must be focus-fired during pauses. Gives players their first concrete milestone goal. Guaranteed rare loot on kill.

4. **Weapon/armor runics** — Vampiric sword, flaming blade, thorned armor, etc. Makes loot decisions interesting beyond "bigger number = better."

5. **3 floor themes** — Color palette swaps + distinct enemy pools per zone. Massive perceived variety for minimal code.

#### Decision Needed: Content vs. Polish Priority

The game currently has ~2 hours of unique content before repetition sets in. Two paths:

- **A) Content-first:** Prioritize items 1-5 above. Delay visual polish (sprites, animations, screen shake) until the game has enough content to retain players. This is the Dwarf Fortress / Brogue philosophy — depth over looks.

- **B) Polish-first:** Continue with P1 visual polish tasks (floating damage numbers, animations). Ship a beautiful but shallow game, add content later. Risk: players try the game once, see its pretty but shallow, and don't return.

- **C) Interleave:** Alternate content and polish tasks. Slower on both fronts but steady progress on each.

**My recommendation: Option A (content-first).** The game's ASCII art style is already working — players of browser roguelikes expect this aesthetic. What they won't tolerate is running out of new things to discover on floor 3. Consumables + enemy abilities + one boss would 3x the game's tactical depth.

I've promoted the top 4 content items to **P1** on the task board. Let me know if you want to reprioritize.

human response: content first sounds good to me.

#### Key Design Principle Discovered

Across all 6 benchmark games: **replayability comes from combinatorial interactions, not raw content volume.** Brogue has 68 enemies and ~70 items but achieves extraordinary depth because items interact with enemies and the environment. Every new element we add should multiply the possibility space — a Fire potion should interact with slime splitting, a Stun runic should synergize with Vorpal (stun then execute). I've flagged this for the developer agents to keep in mind.

---

### 2026-03-20 | strategist | Game Design Research — 3 decisions needed

**From:** Strategist Agent (third session — Game Design Research)
**Priority:** Medium-High

I researched 12+ roguelikes and the browser roguelike market to identify mechanics that would make Voidcrawl more engaging and replayable. Added 8 new tasks to the task board. Three findings need your input:

#### Decision 1: Void Attunement System (Unique Mechanical Hook)

Every successful roguelike has one mechanic that makes it stand out. Voidcrawl's void theme is currently cosmetic only. I'm proposing a **Void Attunement** system — a corruption meter (0-100%) that grants both powers AND curses at thresholds:

- 25%: Better vision / enemies detect you from further
- 50%: Phase through walls / reduced max HP
- 75%: Bonus damage / healing less effective
- 100%: Godlike power / constant HP drain

Players would gain attunement from void shrines, descending floors, and certain items. This creates a central risk-reward decision: "How much void am I willing to embrace?" and makes every run a unique story.

**This is potentially the most impactful feature for differentiating Voidcrawl from other roguelikes.** But it's also a significant design commitment that touches combat, exploration, and item systems.

- **A) Build it** — Make Void Attunement a core system. Commit to the risk-reward corruption design.
- **B) Prototype first** — Have a developer build a minimal version (just the meter + 2 thresholds) to test if it feels good before committing.
- **C) Skip it** — Focus on content variety instead of a unique mechanic. The game can succeed without a distinctive hook, just with more stuff.

My recommendation: **Option B** (prototype). The mechanic is theoretically strong but needs playtesting before committing the full 4-threshold system.

#### Decision 2: Daily Seeded Challenge

Rogule (a daily browser roguelike) got 350K+ plays using the Wordle model — one dungeon per day, same for everyone. This could be a powerful growth driver for Voidcrawl and naturally creates return visits + social sharing. However, it requires:
- Seeded RNG (all Math.random calls go through a seedable wrapper)
- A separate game mode entry point
- Community stats display

Should the developer prioritize this alongside content work, or defer until more content exists?

- **A) Build soon** — The daily format works even with current content levels (Rogule has less content than Voidcrawl).
- **B) Defer until more content** — Wait until bosses + floor themes + enemy abilities are in, so the daily challenge has more variety.

My recommendation: **Option A**. Rogule has far less content than Voidcrawl and still thrives. The seeded RNG infrastructure also benefits regular gameplay (reproducible bugs, share-a-seed with friends).

#### Decision 3: Unidentified Consumables

Should potions and scrolls have randomized names per run (NetHack/Shattered PD style)? "Fizzing Potion" could be Haste OR Poison until you try it. This transforms existing content into a discovery puzzle but adds friction to consumable use.

- **A) Yes, full identification** — Randomize all consumable appearances. First use identifies. Add Scroll of Identify as a new consumable.
- **B) Partial** — Only randomize potions (not scrolls). Scrolls are labeled because "you can read them."
- **C) No** — Keep consumables pre-identified. Focus on adding more types instead of obscuring existing ones.

My recommendation: **Option B** (partial). Randomize potions but keep scrolls labeled — this is the Shattered Pixel Dungeon approach and feels most natural. It adds discovery to the most common consumable type without making scrolls feel illogical.

---

### 2026-03-20 | strategist | Growth & SEO Analysis — 3 decisions needed

**From:** Strategist Agent (fourth session — Growth & SEO Research)
**Priority:** High

I researched how browser roguelikes get discovered, studied 6+ case studies (Rogule, Wordle, A Dark Room, Candy Box, DCSS), and analyzed SEO, social sharing, Reddit strategy, and game directories. Full research saved in `.planning/research/`. Here's what needs your input:

#### The Big Picture

Voidcrawl has substantial gameplay content now (17 items, 9 enemies + boss, 7 runics, 11 status effects), but **zero discoverability infrastructure**. No OG images, no social cards, no sitemap, no structured data, no shareable run summaries, no presence on itch.io or RogueBasin. Every link shared anywhere shows as a bare text URL with no preview. This is the single biggest gap.

The proven growth funnel for browser roguelikes is: **Technical SEO + Shareable Results → r/WebGames post → Hacker News pickup → viral spike → sustained community**. Rogule followed this exact path to 19,000 players in one day, settling to 2,000/day sustained.

#### Decision 1: Production URL

All SEO tasks (metadata, sitemap, OG images, Google Search Console, directory listings) require knowing the production URL. The Vercel deployment is connected but the URL hasn't been documented. Options:

- **A) Use the Vercel auto-generated URL** (e.g., `voidcrawl.vercel.app`) — free, immediate, good enough for now
- **B) Buy a custom domain** (voidcrawl.com, voidcrawl.gg, voidcrawl.io) — more professional, better brand recall, ~$10-15/year

My recommendation: **Option A for now, B later**. Use the Vercel URL to unblock all SEO work immediately. Add a custom domain when there's player traction to justify it. The domain question was deferred earlier — this is fine, but we need the Vercel URL documented in CLAUDE.md to unblock the developer agents.

**Action needed:** Please share the Vercel deployment URL so agents can configure metadata.

#### Decision 2: Growth Task Priority vs. Content/Game Design Tasks

The task board now has tasks across 4 competing priorities:
1. **Content depth** (P1 — unidentified consumables, floor themes, new enemies, etc.)
2. **Game design systems** (P2 — Void Attunement, shrines, cursed equipment, enemy intent)
3. **Growth infrastructure** (NEW P1 — OG images, sitemap, SEO text, itch.io page)
4. **Shareability features** (P1 — shareable death screen, daily challenge)

Options:

- **A) Growth-first sprint:** Developer agents do 1-2 days of pure SEO/metadata work (items 1-6 in new P1 Growth section). Then alternate content and growth tasks. Rationale: the SEO foundation takes ~2 hours total and multiplies the value of everything else.
- **B) Continue content-first:** Keep building content depth (you already chose content-first last session). Add growth tasks whenever content work is done. Rationale: the game needs more content before it's worth promoting.
- **C) Interleave:** Developer does one content task, then one growth task, alternating. Steady progress on both fronts.

My recommendation: **Option A** (growth sprint, then content). The growth tasks are tiny (metadata is 30 min, sitemap is 5 min, robots.txt is 5 min, OG image is 45 min, SEO paragraph is 15 min). Total: ~2 hours. This one-time investment makes every future content addition more visible. After the sprint, resume content-first development. The game already has more content than Rogule (which sustains 2K daily players with far less).

#### Decision 3: CrazyGames / Poki Submission

CrazyGames (35M monthly players) and Poki (65-100M monthly players) are major web game platforms. However:
- Both require ad SDK integration (banner, interstitial, rewarded ads)
- Their audiences skew casual — a turn-based roguelike may underperform
- CrazyGames offers a 2-month exclusivity option for 50% revenue boost
- Poki is very selective and requires mobile compatibility

This may conflict with the "no predatory monetization" ethic depending on how ads are implemented (interstitial ads between runs are mildly annoying but ethical; forced video ads before every run are not).

- **A) Submit to CrazyGames** (lower bar, worth testing)
- **B) Skip both** (focus on itch.io, Newgrounds, direct traffic)
- **C) Evaluate later** (wait until the game has mobile support and more content)

My recommendation: **Option B** (skip both for now). The ad SDK requirement adds complexity and doesn't align with Voidcrawl's ethos. itch.io + direct traffic + Newgrounds are better fits. Revisit if player numbers justify the effort.

#### What I Added to the Task Board

- **8 new P1 tasks** (Growth & Discoverability): OG metadata, dynamic OG image, sitemap/robots, JSON-LD, fix play page server component, SEO landing page text, itch.io page, RogueBasin page
- **8 new P2 tasks** (Growth & Community): Google Search Console, press kit, r/WebGames post, r/roguelikes post, Sharing Saturday participation, Hacker News post, dev.to blog post, Newgrounds submission
- **6 new P3 tasks** (expanded Growth): social sharing channels, additional directories, 7DRL jam, remove Phaser dependency, Discord timing, bundle analyzer

All recommendations are zero-cost. No money spent.

---

### 2026-03-20 | strategist | Monetization Strategy — 3 decisions needed

**From:** Strategist Agent (fifth session — Monetization Strategy)
**Priority:** Medium

I researched ethical monetization models for browser roguelikes, studying 15+ comparable games and 6 payment/supporter platforms. Full analysis logged to AGENT_LOG.md. Here's what needs your input:

#### The Monetization Model

I've designed a 4-tier model that complies fully with the ethics rules (no loot boxes, no timers, no FOMO, no pay-to-win):

| Tier | What | Expected Revenue |
|------|------|-----------------|
| **Free** | Full base game in browser, forever | $0 (audience builder) |
| **Supporter tips** | Ko-fi + GitHub Sponsors + itch.io PWYW | $100-400/month at scale |
| **Content packs** | 3 themed expansions ($1.99-$2.99 each) + bundle ($4.99) | $500-1,500/month at 10K MAU |
| **Steam (future)** | Premium version with all content at $4.99-$7.99 | One-time revenue spike |

**Key numbers:** Only 2-3% of free browser game players will pay anything. At 10K monthly active users, that's ~250 payers at ~$4 average = ~$1,000/month. Revenue is proportional to audience size, which is why growth infrastructure (SEO, sharing, directories) should precede monetization infrastructure.

#### Decision 1: Monetization Timing

Two approaches:

- **A) Build tip infrastructure now, content packs later.** Set up Ko-fi + GitHub Sponsors immediately (15 minutes each, $0 cost, 0% fees). Add "Support the Developer" link to landing page. This captures any early supporter money while the game grows. Defer content packs and Lemon Squeezy integration until there's a meaningful player base (1K+ MAU). **My recommendation.**

- **B) Build everything now.** Set up tips, design content packs, integrate Lemon Squeezy, build the premium content flag system, create the shop UI. Front-loads engineering effort (~8-12 hours developer time) but has everything ready for when players arrive.

- **C) Defer all monetization.** Focus entirely on content and growth. Add monetization only when there's player traction. Risk: no supporter capture during the growth phase.

**My recommendation: Option A.** The tip platforms are free and take minutes to set up. Content packs need actual content to sell (hero classes, zone themes aren't built yet), so the pack infrastructure should be built alongside the content, not before it.

#### Decision 2: Payment Platform — Lemon Squeezy vs. Stripe

When content packs are ready:

- **Lemon Squeezy** (5% + $0.50/transaction): Merchant of Record — handles global sales tax automatically. Official Next.js SDK. Built-in license key generation. Less code, less liability. Higher per-transaction fee.

- **Raw Stripe** (2.9% + $0.30/transaction): Lower fees but YOU handle sales tax compliance (or pay extra 0.5% for Stripe Tax). More flexible but more engineering work. You build your own license key system.

On a $2.99 content pack:
- Lemon Squeezy takes: $0.65 (21.7%)
- Stripe takes: $0.39 (13.0%) + tax compliance burden

**My recommendation: Lemon Squeezy.** The tax compliance burden alone justifies the fee difference for a solo dev. You don't want to research sales tax laws for 50+ jurisdictions. Lemon Squeezy was acquired by Stripe in 2024 so it uses Stripe's infrastructure under the hood.

#### Decision 3: Content Pack Pricing Validation

I've proposed:
- "Crystalline Depths" (zone theme + enemies + boss + gear): **$1.99**
- "Heroes of the Void" (3 hero classes + starting items + cosmetics): **$2.99**
- "Shadow Realm" (zone theme + enemies + boss + gear): **$1.99**
- "Void Champion Bundle" (all 3 packs): **$4.99** (28% discount)

These prices are benchmarked against Vampire Survivors DLCs ($1.99), Hoplite IAP ($3), and Shattered PD iOS ($4.49). The bundle acts as a price anchor that makes individual packs feel reasonable.

**Does this pricing feel right for Voidcrawl?** The content must justify the price — each pack should add 2-3 hours of meaningfully different gameplay, not just reskins.

#### What I Changed on the Task Board

- **Replaced** old P3 Monetization (4 vague tasks) with **P2 Monetization Foundation** (6 detailed tasks with pricing, platform choices, and implementation specs)
- **Added** P3 Monetization Long-Term (5 tasks: itch.io PWYW, Steam release, sponsorware model, cosmetic death screens, premium skins)
- All 11 new tasks are zero-cost to implement. No money spent. No money will be spent without logging to FINANCES.md and writing here first.

---
