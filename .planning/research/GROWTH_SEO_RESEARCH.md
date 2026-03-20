# Growth, SEO, and Community Research: Voidcrawl

**Domain:** Browser roguelike discovery, growth, and community building
**Researched:** 2026-03-20
**Overall Confidence:** HIGH (multiple verified sources, strong case study evidence)
**Applicable to:** Voidcrawl - turn-based browser roguelike, Next.js 16, Vercel deployment

---

## Executive Summary

Browser roguelikes occupy a unique niche: they have zero friction (no download, no install, no account) but also zero built-in distribution (no Steam algorithm, no App Store featuring). Growth for games like Voidcrawl depends on a combination of (1) making the game instantly shareable, (2) being present in the right directories and communities, (3) having discoverable SEO, and (4) building word-of-mouth through devlog content and community participation.

The most successful browser roguelikes -- Rogule, DCSS WebTiles, Brogue web port, A Dark Room, Candy Box -- all share a pattern: they were discovered through Hacker News, Reddit (r/webgames, r/roguelikes), or a combination. None used paid advertising. The key differentiator between games that got 200 players and games that got 20,000 was whether they had a shareable hook (daily challenge + emoji summary, unique mechanic, developer narrative) that made people want to tell others.

Voidcrawl's current metadata is minimal (basic title and description, no Open Graph images, no structured data, no sitemap). This is the lowest-hanging fruit. The second priority is building a shareable run summary system. The third is systematic presence across game directories, Reddit communities, and Hacker News.

---

## 1. Distribution Channels: Where Browser Roguelikes Get Found

### Tier 1: Direct Reddit/HN Virality (Highest Impact, Free)

**r/WebGames** (131K members) is the single most important subreddit for browser games. Rules: games must be playable in-browser with no downloads, signups, or plugins. Use the game name at the start of the post title. No reposts within 3 months unless significant update.

- Top posts get 700-1500 upvotes (agar.io, 2048, It's A(door)able)
- Rogule was posted here and "got picked up and snowballed" to Hacker News
- **Post format:** "Voidcrawl - Turn-based roguelike dungeon crawler, playable in your browser"

**Hacker News (Show HN)** is responsible for the biggest traffic spikes in browser game history. Rogule hit 19,000 players in a single day from the HN front page. A Dark Room got its initial web traction from HN.

- Post on Sunday (less competition)
- Use "Show HN:" prefix
- Factual, direct language -- no marketing speak
- Reply to every comment in the first hour
- The HN "second-chance pool" gives failed posts another shot
- Technical angle matters: "Built with Next.js + HTML5 Canvas, no dependencies" resonates with HN audience

**r/roguelikes** (160K+ members) is the primary roguelike community. Self-promotion is tolerated if you're a genuine community member. The 10% rule applies: for every self-promotional post, have 9 community contributions.

**r/roguelikedev** (60K+ members) is the developer community. The **Sharing Saturday** weekly thread is the primary showcase mechanism:
- 500+ weekly threads and counting (long-running tradition)
- Most activity in the first hour -- post early
- Show development progress, not just announce
- Participate in the annual summer tutorial event for credibility

**r/indiegaming** (390K) and **r/indiegames** (235K) accept browser game posts. Development logs with GIFs get the most engagement. One case: a two-person dev team earned 11,000 Steam wishlists from a single Reddit post.

### Tier 2: Game Platforms and Directories (Sustained Traffic)

**itch.io** -- The primary platform for indie browser games.
- No approval process
- Developer controls pricing (free, pay-what-you-want, fixed)
- Default 90/10 revenue split (90% to creator)
- Tags are critical: "roguelike", "traditional-roguelike", "browser", "dungeon-crawler", "turn-based"
- Devlogs on itch.io appear in follower feeds
- Game jam submissions (7DRL, itch.io jams) get algorithmic boost on the platform
- **Action:** Create an itch.io page that embeds the game or links to the Vercel deployment

**CrazyGames** -- 35 million monthly players, ad-revenue-share model.
- Requires SDK integration for ads (banner, interstitial, rewarded)
- 2-month exclusivity option gives 50% revenue boost
- Every new game starts on the home page for initial exposure
- Two-stage launch: Basic Launch then Full Launch based on performance metrics
- **Fit for Voidcrawl:** MAYBE. CrazyGames audience skews casual. A turn-based roguelike may underperform vs. action games. Worth testing but not a priority.

**Poki** -- 65-100 million monthly players, 50/50 revenue share.
- Very selective (harder to get accepted)
- Requires 5-8 MB file size, mobile/tablet compatible, quick load
- Full QA support and UI/UX assistance if accepted
- 200+ developer Discord community
- **Fit for Voidcrawl:** LOW. Poki is extremely selective and their audience is primarily casual. Traditional roguelikes are a hard sell here.

**Newgrounds** -- Established indie game community, strong brand loyalty.
- HTML5 games accepted (ZIP archive upload)
- Newgrounds.io API supports medals and scoreboards
- API works even when game is hosted elsewhere (no need to host on Newgrounds)
- Cultural fit is good -- Newgrounds appreciates indie/experimental games
- **Fit for Voidcrawl:** GOOD. The audience appreciates unique indie games and turn-based/retro aesthetics.

**RogueBasin** -- The roguelike wiki. Every roguelike should have a page here.
- Create account, create a page for Voidcrawl
- Add to the "Browser" category list
- Free, permanent, and discoverable by the core roguelike audience
- **Action:** Create a RogueBasin page immediately upon launch

**GameJolt** -- Indie game platform with community features.
- Supports web games
- Lower traffic than itch.io but dedicated indie audience

**Other aggregators:** idev.games, roguelikegames.online, Y8 (50% ad revenue, 10% multiplayer bonus)

### Tier 3: Content Platforms (Slow Burn, Authority Building)

**Dev.to / Medium** -- Devlog posts about building Voidcrawl with Next.js and Canvas.
**YouTube** -- Devlog videos, though this requires ongoing video effort.
**Twitter/X** -- Screenshot Saturday (hashtag #screenshotsaturday), #indiedev, #roguelike
**Mastodon** -- gamedev.place instance has active roguelike dev community

**Confidence:** HIGH. Based on multiple case studies (Rogule, A Dark Room, Candy Box) and verified platform data.

---

## 2. SEO Strategy: Ranking for Browser Roguelike Searches

### Current State: Minimal

Voidcrawl's current metadata:
```typescript
export const metadata: Metadata = {
  title: "Voidcrawl - Browser Roguelike",
  description: "A turn-based browser roguelike...",
};
```

No Open Graph tags. No Twitter Card tags. No structured data. No sitemap. No robots.txt. This is the single biggest quick win available.

### Competitive Landscape

Searching "browser roguelike" or "play roguelike online" returns:
1. itch.io tag pages (dominant)
2. CrazyGames tag pages
3. roguelikegames.online (dedicated aggregator)
4. idev.games/games/tag/roguelike
5. Individual games (Rogule, Brogue web port)
6. Quora "Are there any good browser-based roguelikes?"

**Key insight:** Very few individual browser roguelikes rank on page 1. The aggregators dominate. This means Voidcrawl should target long-tail keywords where individual games can compete.

### Target Keywords (by priority)

**Primary (landing page):**
- "voidcrawl" (brand -- own this immediately)
- "browser roguelike" (competitive, but worthwhile)
- "play roguelike online" (moderate competition)
- "free browser dungeon crawler" (low competition)
- "turn-based browser game" (low competition)

**Long-tail (blog/content pages):**
- "roguelike game no download"
- "browser dungeon crawler free"
- "procedural dungeon game online"
- "void themed roguelike"

### Technical SEO Implementation (Next.js 16 Specific)

**1. Enhanced Metadata in `layout.tsx`:**

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Voidcrawl - Free Browser Roguelike Dungeon Crawler",
    template: "%s | Voidcrawl",
  },
  description: "Descend through procedurally generated void dungeons in this free turn-based roguelike. No download required -- play instantly in your browser. Permadeath, tactical combat, loot.",
  keywords: ["roguelike", "browser game", "dungeon crawler", "turn-based", "free", "no download", "procedural generation", "HTML5 game"],
  authors: [{ name: "Vincent" }],
  creator: "Vincent",
  metadataBase: new URL("https://voidcrawl.vercel.app"), // Update with production URL
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://voidcrawl.vercel.app",
    siteName: "Voidcrawl",
    title: "Voidcrawl - Free Browser Roguelike",
    description: "Turn-based dungeon crawler. Procedural dungeons, tactical combat, permadeath. Play free in your browser.",
    images: [
      {
        url: "/og-image.png",    // 1200x630px
        width: 1200,
        height: 630,
        alt: "Voidcrawl - Descend into the void",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voidcrawl - Free Browser Roguelike",
    description: "Turn-based dungeon crawler. Play free in your browser.",
    images: ["/twitter-card.png"], // 1200x600px (2:1)
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};
```

**2. Sitemap (`src/app/sitemap.ts`):**

```typescript
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://voidcrawl.vercel.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://voidcrawl.vercel.app/play",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
```

**3. Robots.txt (`src/app/robots.ts`):**

```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://voidcrawl.vercel.app/sitemap.xml",
  };
}
```

**4. Structured Data (JSON-LD in landing page):**

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Voidcrawl",
  "description": "A turn-based browser roguelike dungeon crawler...",
  "genre": ["Roguelike", "Dungeon Crawler", "Turn-based"],
  "gamePlatform": "Web Browser",
  "operatingSystem": "Any (web browser)",
  "applicationCategory": "Game",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "url": "https://voidcrawl.vercel.app",
  "image": "https://voidcrawl.vercel.app/og-image.png",
};
```

Note: Google says VideoGame is not a valid node type for SoftwareApplication rich results, but it is a valid Schema.org type that other search engines and services use. Include it alongside `WebApplication` type for maximum coverage.

**5. Landing Page SEO Content:**

The current landing page is visually clean but has almost no crawlable text content. Add:
- An H1 with the game name (already present)
- Descriptive paragraph with target keywords
- Feature descriptions that include searchable terms ("procedurally generated dungeons", "turn-based combat", "permadeath")
- A "What is Voidcrawl?" section below the fold with 2-3 sentences of descriptive text

**Confidence:** HIGH. Based on Next.js official documentation and SEO best practices verified through multiple sources.

---

## 3. Social Sharing Mechanics: The Rogule/Wordle Playbook

### Why This Matters More Than Anything Else

Wordle grew from 90 to 300,000 players in two months after adding a single feature: copy-paste emoji grid sharing. Rogule peaked at 19,000 daily players and sustains 2,000/day. Both games are mechanically simple -- the sharing mechanic IS the growth engine.

### How Wordle's Sharing Works

- After completing a puzzle, player can "Copy results"
- Results are a grid of colored emoji squares (green/yellow/black)
- Grid is spoiler-free (shows performance without revealing answers)
- Format includes the game name and puzzle number for discoverability
- People share on Twitter, Discord, group chats, Mastodon
- The grid creates FOMO: "What was yours?" drives friends to try

### How Rogule's Sharing Works

- Daily dungeon (seeded from date, same for everyone)
- One chance per day to play
- End-of-run emoji summary showing dungeon layout and performance
- Emoji-based graphics (Twemoji sprites) make the game itself visually shareable
- Players share on Twitter and Mastodon with results

### Voidcrawl Run Summary Design

Voidcrawl should implement a **death/victory summary** with a **"Copy Run Summary"** button. The summary should be:

1. **Spoiler-free** -- shows stats, not strategy
2. **Compact** -- fits in a tweet/Discord message
3. **Visually distinctive** -- uses emoji or Unicode that stands out in a feed
4. **Branded** -- includes "Voidcrawl" and a URL

**Proposed format:**

```
VOIDCRAWL - Floor 7

    Depth: 7 | Turns: 342
    Kills: 23 | Gold: 1,847

    Cause of Death: Void Wraith

    voidcrawl.vercel.app
```

**Alternative emoji-enhanced format:**

```
VOIDCRAWL | Floor 7
-------------------
Depth  7  | Turns  342
Kills  23 | Items  12
HP     0/45

Slain by: Void Wraith

voidcrawl.vercel.app
```

**Key design decisions:**
- Include the URL in the share text (drives click-through)
- Include the floor reached (creates competition: "I only got to floor 3, how did you get to 7?")
- Include cause of death (conversation starter, humor value)
- Keep it under 280 characters for Twitter compatibility
- Consider a daily challenge mode (same seed for everyone) to enable direct comparison

### Daily Challenge Mode (Recommended)

Based on Rogule's success (1,500-2,000 daily players sustained), a daily challenge mode would:
- Give everyone the same dungeon seed each day
- Allow direct comparison of results ("I beat Floor 5, can you?")
- Create a natural daily engagement loop
- Provide shareable, comparable content
- NOT violate the "no FOMO" ethic IF it's optional and the regular mode is always available

**Important:** This does NOT conflict with the project's ethics guidelines. A daily challenge is opt-in content that creates fun competition -- it is not a streak mechanic, energy timer, or FOMO pressure system. The regular game remains fully playable at any time.

**Confidence:** HIGH. Verified through Wordle growth data (300,000 in 2 months), Rogule sustained engagement (2,000/day), and multiple sources confirming the emoji-share pattern as the primary growth mechanism.

---

## 4. Reddit Strategy: Specific Subreddits and Tactics

### Priority Subreddits (Ranked by Impact for Voidcrawl)

| Subreddit | Members | Fit | Strategy |
|-----------|---------|-----|----------|
| r/WebGames | 131K | PERFECT | Direct game link post. "Voidcrawl - Turn-based roguelike dungeon crawler [browser]" |
| r/roguelikes | 160K+ | HIGH | Participate first, then share. Show the game in context of the genre. |
| r/roguelikedev | 60K+ | HIGH | Sharing Saturday every week. Show development progress. |
| r/IndieGaming | 390K | GOOD | Dev story + gameplay GIF. Devlog-style narrative posts perform best. |
| r/indiegames | 235K | GOOD | GIF/video posts with brief description. |
| r/IndieDev | 263K | GOOD | Development journey angle. Behind-the-scenes. |
| r/gamedev | 1.9M | MODERATE | Only for dev-focused posts. "How I built a roguelike with Next.js" angle. |
| r/WebGames game jam | varies | GOOD | Participate in r/WebGames game jams hosted on itch.io |

### Post Types That Get Traction (in order of effectiveness)

1. **GIFs of gameplay** -- 5-15 second loops showing combat, dungeon generation, or death
2. **Devlogs with narrative** -- "I built X because Y, here's what happened"
3. **Playtest announcements** -- "I need testers for my browser roguelike"
4. **Behind-the-scenes tech** -- "How procedural dungeon generation works in Voidcrawl"
5. **Launch announcements** -- Only effective if you've built up community presence first

### Etiquette Rules

- **10% Rule:** For every self-promotional post, make 9 non-promotional contributions (comments, helping others, genuine discussions)
- **Read each subreddit's rules** before posting (they vary significantly)
- **Never cross-post the same link to 5+ subreddits simultaneously** -- this triggers spam detection and feels disingenuous
- **Respond to every comment** on your posts, especially critical feedback
- **Never delete negative comments** or get defensive
- **Time your posts:** Tuesday-Thursday mid-morning EST for US engagement, avoid weekends for smaller subreddits
- **r/roguelikedev Sharing Saturday** posts early in the thread (first hour gets the most views)

### Reddit Content Calendar (Pre-Launch to Launch)

**Weeks 1-4 (Pre-launch):**
- Comment regularly on r/roguelikes and r/roguelikedev discussions
- Share in Sharing Saturday with development screenshots
- Post a "How I'm building a browser roguelike with Next.js" devlog on r/gamedev

**Week 5 (Soft launch):**
- Post to r/WebGames with direct play link
- Share on r/roguelikes as a discussion, not announcement
- Continue Sharing Saturday updates

**Week 6+ (Post-launch):**
- Gather feedback, implement changes
- Post significant updates to r/WebGames (wait 3+ months between posts per rules)
- Continue Sharing Saturday for ongoing visibility

**Confidence:** HIGH. Based on verified subreddit data, Rogule's growth path (r/webgames -> HN), and confirmed subreddit rules.

---

## 5. Open Graph and Social Cards: Making Links Click-Worthy

### Current State

Voidcrawl has NO Open Graph images configured. When shared on Twitter, Discord, or Reddit, it shows as a bare text link with a generic preview. This is a significant missed opportunity.

### Required Assets

**1. Primary OG Image (1200x630px, PNG)**
- Used by: Facebook, LinkedIn, Discord, iMessage, most platforms
- Content: Game title "VOIDCRAWL" in the void-cyan color on dark background, with a gameplay screenshot or stylized dungeon map, tagline "Turn-based browser roguelike"
- Style: Match the game's visual identity (dark background, cyan accents)
- File: `/public/og-image.png`

**2. Twitter Card Image (1200x600px, PNG)**
- Used by: Twitter/X (falls back to OG image if not present)
- Content: Similar to OG image but 2:1 aspect ratio
- Use `summary_large_image` card type for maximum visual impact
- File: `/public/twitter-card.png`

**3. Dynamic Run-Share Images (Optional, Advanced)**
- Generate OG images for shared run URLs (e.g., `voidcrawl.vercel.app/run/abc123`)
- Next.js supports dynamic OG image generation via `opengraph-image.tsx`
- Could show a mini dungeon map, stats, and cause of death
- This is an advanced feature for later phases

### Discord-Specific Considerations

Discord auto-generates embeds from OG tags. For games:
- Discord shows the og:title, og:description, and og:image
- Animated GIFs work in Discord embeds (could use a short gameplay loop)
- The embed color can be set via `<meta name="theme-color" content="#00ffff">` (void-cyan)

### Implementation in Next.js 16

The metadata export in `layout.tsx` handles all OG tags. Add the `theme-color` meta tag:

```typescript
export const metadata: Metadata = {
  // ... other metadata
  other: {
    "theme-color": "#00ffff", // void-cyan for Discord embeds
  },
};
```

**What makes someone click a game link:**
- A visually distinctive preview image (not generic, not stock)
- Clear indication it's playable NOW (not "coming soon", not "wishlist")
- The word "free" or "play in browser" in the description
- A screenshot or visual that shows actual gameplay

**Confidence:** HIGH. Based on verified OG tag specifications and Next.js documentation.

---

## 6. Case Studies: How Browser Roguelikes Got Their First Players

### Rogule (2,000 daily players sustained)

**Origin:** 7DRL game jam entry (2022). Built with ClojureScript and ROT.js.

**Growth path:**
1. Created during 7DRL jam
2. Iterated post-jam
3. Posted to r/webgames ~1 month before viral moment
4. Picked up by community members and submitted to Hacker News
5. Hit #1 on HN front page
6. Retweeted by GitHub's official Twitter account
7. Featured on Japanese tech site Gigazine
8. Peaked at 19,000 players/day
9. Settled to 2,000 players/day baseline

**What made it work:**
- Zero friction (click and play)
- Daily challenge (same dungeon for everyone)
- One-minute sessions (extremely low commitment)
- Emoji-based visuals (inherently shareable)
- Wordle-like familiarity (daily puzzle with sharable results)

**Lesson for Voidcrawl:** The daily challenge + sharable results pattern is proven. Voidcrawl should implement this as an optional mode.

### A Dark Room (2.26 million downloads, #1 iOS app)

**Origin:** Web game built by Michael Townsend (2013), inspired by Candy Box.

**Growth path:**
1. Released as free web game
2. Featured on Hacker News (initial web traction)
3. Forbes and Paste listed it as top game of 2013
4. Amir Rajan ported to iOS ($0.99)
5. iOS version had only 80 downloads on launch day
6. Unexplained viral moment in UK (jumped to 8,000 downloads/day)
7. Hit #1 in UK App Store
8. Then hit #1 in US App Store for 18 days

**Marketing tactics that worked:**
- Complete developer transparency (public revenue numbers, download stats)
- Active on r/gamedev, r/apphookup (promo codes for engagement)
- Personal brand building at local gamedev events
- Audio developer commentary unlocked after beating the game (encouraged gifting)
- $0.99 pricing to maximize word-of-mouth spread
- Thanked every person who mentioned the game publicly

**Lesson for Voidcrawl:** Developer transparency and community engagement matter more than marketing spend. Share the development journey publicly.

### Candy Box! (350,000+ gamesaves)

**Origin:** Created by an 18-year-old French university student (2013).

**Growth path:**
1. Built as a personal exercise
2. Shared online
3. Went viral through word of mouth
4. Covered by Kotaku and other gaming outlets
5. The "what is this?" factor drove organic sharing

**What made it work:**
- Completely novel mechanic (incremental/idle + ASCII RPG)
- The surprise/discovery factor (game reveals complexity over time)
- Ultra-low friction (text in a browser tab)

**Lesson for Voidcrawl:** Novelty drives initial sharing. Having a unique hook (the "void" theme, specific mechanic) gives people something to talk about.

### DCSS WebTiles (Long-running community)

**Growth approach:** Entirely different model -- open source, community-driven development over 25+ years.

- Multiple public servers hosting WebTiles
- Active IRC, Discord, subreddit (r/dcss)
- Community wiki
- Spectator mode (watch other players live)
- Ghost system (encounter dead characters of other players)

**Lesson for Voidcrawl:** Long-term community features (leaderboards, shared dungeon seeds, spectating) create sustainable engagement that goes beyond launch buzz.

**Confidence:** HIGH. Based on verified Indie Hackers post, Wikipedia entries, and developer interviews.

---

## 7. Game Jam Strategy: 7DRL and Beyond

### 7DRL Challenge (Annual, February/March)

The 7DRL Challenge is the most important game jam for roguelikes. The 2026 event ran February 28 - March 8.

**Rules regarding existing games:**
- You CAN start from an existing game if you're turning it into something unique
- You CANNOT submit a game developed outside the time frame just for exposure (entries will be deleted)
- You CAN take a 7DRL entry and extend it into a full game after the jam

**Strategy for Voidcrawl:**
- Do NOT submit the existing Voidcrawl game to 7DRL (violates rules)
- DO create a standalone spin-off or themed variant during next year's 7DRL
- Example: "Voidcrawl: The Breach" -- a 7-floor speed-run variant built during jam week
- After the jam, link back to the main Voidcrawl game

### Ludum Dare (Multiple times per year)

- Broader audience (not roguelike-specific)
- Post-jam marketing is critical: 1/3 of entrants fail to get 20 ratings
- Stream your Ludum Dare entry on Twitch for visibility
- Write a post-mortem and share on r/gamedev
- Use hashtags: #ldjam, #ludumdare

### itch.io Game Jams

- r/WebGames hosts game jams on itch.io
- Roguelike-specific jams (Roguelike Jam) run periodically
- Genre jams (Dungeon Crawler Jam, etc.) provide additional visibility
- Jam submissions get algorithmic boost in itch.io discovery

### Game Jam Effectiveness for Visibility

Game jams provide:
- A deadline that forces a polished, playable build
- A built-in audience of jam participants who rate and play entries
- Blog/devlog content opportunities (post-mortems)
- Credibility in the roguelike community
- Connections with other developers

Game jams do NOT provide:
- Sustained traffic (spike then decline)
- Large player numbers on their own (most jam entries get 20-100 plays)
- A substitute for ongoing community engagement

**Verdict:** Game jams are excellent for credibility-building and creating shareable content, but they are a supplement to other growth strategies, not a primary channel.

**Confidence:** HIGH. Based on verified 7DRL rules, Ludum Dare documentation, and itch.io jam data.

---

## 8. Community Building: Discord and Beyond

### Does a Browser Roguelike Need a Discord?

**Short answer:** Not at launch. Premature Discord servers feel empty and discourage joiners.

**When to create a Discord:**
- After you have 50+ regular daily players
- After you receive repeated requests for a community space
- After you have enough content to fill 3-4 channels

### Minimum Viable Discord Setup (When Ready)

| Channel | Purpose |
|---------|---------|
| #announcements | Updates, patch notes (read-only) |
| #general | Discussion |
| #screenshots | Share run results, deaths, high scores |
| #feedback | Bug reports, suggestions |
| #daily-challenge | Daily challenge results and discussion |

**Key principles:**
- Set up a welcome message immediately (barren servers deter new members)
- Seed initial conversation yourself (post daily, respond to everyone)
- Keep the channel count LOW (3-5 channels max at start)
- Add a bot for leaderboard tracking or daily challenge results
- Link Discord from the game's death/victory screen and landing page

### Before Discord: Where Community Lives

Until Discord is warranted, community interaction should happen:
1. **Reddit threads** (r/roguelikedev Sharing Saturday, r/roguelikes)
2. **itch.io comments** (on the game page)
3. **GitHub Issues/Discussions** (for technically-inclined players)
4. **Twitter/Mastodon** (for devlog followers)

### Community Growth Pattern

```
Phase 1: Developer shares in existing communities (Reddit, HN)
Phase 2: Players start sharing with each other (run summaries on Twitter/Discord)
Phase 3: Players request a dedicated space -> Create Discord
Phase 4: Discord community becomes self-sustaining with peer-to-peer interaction
```

**Confidence:** HIGH. Based on Discord's official indie game community guide and verified community growth patterns.

---

## 9. Landing Page Optimization

### Current Issues

The current landing page (`src/app/page.tsx`) is:
- Visually clean and on-brand
- Missing SEO content (very little text for crawlers)
- Missing a "play now" CTA button (it says "ENTER THE VOID" which is atmospheric but not clear to new visitors)
- Missing social proof (no player count, no mentions)
- Missing any screenshot or gameplay preview

### Recommended Above-the-Fold Changes

1. **Keep "VOIDCRAWL" heading** -- it's strong
2. **Clarify the CTA** -- add "PLAY FREE" or "PLAY NOW" below/alongside "ENTER THE VOID"
3. **Add a gameplay screenshot or animated GIF** between the heading and features
4. **Add a one-liner**: "Free turn-based roguelike -- play instantly in your browser"

### Below-the-Fold Additions

5. **"How to Play" section** with brief controls explanation
6. **"What is Voidcrawl?" paragraph** with SEO-friendly descriptive text
7. **Daily Challenge callout** (when implemented)
8. **Social links** (GitHub, itch.io, Twitter)

### Performance

- CTA above the fold can drive 317% higher conversions
- The game loads via Next.js + Vercel edge network, which is already fast
- Ensure the `/play` page loads quickly (preload critical game assets)

**Confidence:** HIGH. Based on verified landing page conversion data and game-specific best practices.

---

## 10. Comprehensive Action Plan (Prioritized)

### Phase 1: Foundation (Do Immediately, 1-2 days of work)

1. **Add full metadata** to `layout.tsx` (OG tags, Twitter cards, description, keywords)
2. **Create OG image** (1200x630px) -- dark background, "VOIDCRAWL" text, gameplay screenshot
3. **Create Twitter card image** (1200x600px)
4. **Add `sitemap.ts`** and **`robots.ts`** to the app directory
5. **Add JSON-LD structured data** to the landing page
6. **Add theme-color meta tag** for Discord embeds
7. **Create a RogueBasin wiki page** for Voidcrawl
8. **Verify the site with Google Search Console**

### Phase 2: Shareability (1-2 weeks)

9. **Build run summary screen** with stats (floor, kills, cause of death, turns)
10. **Add "Copy Run Summary" button** that copies formatted text to clipboard
11. **Include voidcrawl URL in copied text**
12. **Create itch.io page** linking to the Vercel deployment
13. **Update landing page** with gameplay screenshot and SEO content

### Phase 3: Community Seeding (2-4 weeks, ongoing)

14. **Start participating in r/roguelikedev Sharing Saturday** weekly
15. **Comment regularly on r/roguelikes** discussions (build reputation)
16. **Post to r/WebGames** when game is polished
17. **Write a dev.to post**: "Building a browser roguelike with Next.js and HTML5 Canvas"
18. **Submit to Hacker News** as "Show HN: Voidcrawl -- a turn-based browser roguelike"

### Phase 4: Daily Challenge (2-4 weeks, feature work)

19. **Implement daily challenge mode** (seeded from date, same dungeon for everyone)
20. **Add emoji-enhanced shareable for daily challenge results**
21. **Add in-game leaderboard** for daily challenge scores
22. **Post about the daily challenge update** across communities

### Phase 5: Platform Expansion (Ongoing)

23. **Submit to Newgrounds** (HTML5 upload)
24. **Submit to CrazyGames** (evaluate SDK requirements)
25. **Enter next year's 7DRL** with a Voidcrawl spin-off variant
26. **Participate in itch.io game jams** (roguelike jams, browser game jams)
27. **Consider Discord server** when daily active players exceed 50

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Distribution channels | HIGH | Verified platform data, Rogule case study, multiple sources |
| SEO implementation | HIGH | Next.js official documentation, Schema.org specs |
| Social sharing mechanics | HIGH | Wordle growth data (300K in 2 months), Rogule (19K peak) |
| Reddit strategy | HIGH | Verified subreddit rules, Cloutboost 2025 guide, community analysis |
| Open Graph / social cards | HIGH | OG specification, Discord docs, multiple implementation guides |
| Case studies | HIGH | Indie Hackers interviews, Wikipedia, developer blog posts |
| Game jam strategy | HIGH | 7DRL official rules, Ludum Dare documentation |
| Community building | MEDIUM | Discord official guide, but individual results vary |
| Landing page optimization | MEDIUM | General CRO data, not game-specific A/B testing |

---

## Key Sources

- [Rogule Indie Hackers Post - 2000 players/day](https://www.indiehackers.com/post/2000-people-per-day-are-playing-rogule-cf104c6362)
- [Rogule DEV.to - "I made a daily roguelike that works like Wordle"](https://dev.to/chr15m/i-made-a-daily-roguelike-game-that-works-like-wordle-3pea)
- [A Dark Room - Indie Hackers Interview](https://www.indiehackers.com/interview/creating-a-hit-mobile-game-and-reaching-1-on-the-app-store-45ea61e1c4)
- [A Dark Room - From Sabbatical Year to $800,000](https://www.failory.com/blog/battle-scars)
- [The Huge Hidden Web Game Market - Gamedeveloper.com](https://www.gamedeveloper.com/business/the-huge-hidden-web-game-market-no-one-talks-about-and-how-to-get-in-)
- [Web Gaming Platforms for Indie Developers](https://hology.app/blog/web-gaming-1)
- [Reddit Marketing for Games - Cloutboost 2025 Guide](https://www.cloutboost.com/blog/how-to-market-a-video-game-on-reddit-the-complete-2025-guide-for-game-developers)
- [Sharing Saturday Stats - r/roguelikedev](https://familiarcycle.net/2018/stats-on-r-roguelikes-sharing-saturday)
- [Next.js Metadata Documentation](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Schema.org VideoGame](https://schema.org/VideoGame)
- [Gaming SEO with Schema Markup - Playwire](https://www.playwire.com/blog/gaming-website-seo-recommendations-how-to-use-schema-markup)
- [Game SEO Guide - Genieee](https://genieee.com/game-seo-guide-how-to-get-your-game-discovered/)
- [7DRL Challenge 2026](https://itch.io/jam/7drl-challenge-2026)
- [Ludum Dare Post-Jam Marketing Guide](https://rumorgames.com/ludum-dare-honest-guide/)
- [CrazyGames Developer Portal](https://developer.crazygames.com/)
- [Poki Developer Portal](https://developers.poki.com/)
- [Newgrounds.io Developer API](https://www.newgrounds.io/)
- [RogueBasin Browser Games List](https://www.roguebasin.com/index.php/Browser)
- [OG Meta Tags Guide - VelTools](https://www.veltools.com/blog/open-graph-meta-tags-guide)
- [Discord Indie Game Community Guide](https://discord.com/blog/how-to-build-an-active-and-engaged-indie-game-community-with-discord)
- [r/WebGames Subreddit Stats](https://gummysearch.com/r/WebGames/)
- [How to Hack Hacker News - Indie Hackers](https://www.indiehackers.com/post/how-to-hack-hacker-news-and-consistently-hit-the-front-page-56b4a04e12)
- [Wordle Emoji Sharing History - Know Your Meme](https://knowyourmeme.com/memes/subcultures/wordle)
- [Indie Game Landing Page Guide - Gamedeveloper.com](https://www.gamedeveloper.com/business/indie-game-marketing-guide-part-1---how-to-create-landing-pages)
