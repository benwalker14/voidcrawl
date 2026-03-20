# SEO & Discoverability Research: Voidcrawl

**Domain:** Browser-based indie game (turn-based roguelike)
**Researched:** 2026-03-20
**Overall confidence:** HIGH (verified against official Next.js 16.2 docs, schema.org specs, and current platform requirements)

---

## Table of Contents

1. [Technical SEO for Next.js Games](#1-technical-seo-for-nextjs-games)
2. [Landing Page Optimization](#2-landing-page-optimization)
3. [Keyword Research](#3-keyword-research)
4. [Social Card Preview Images](#4-social-card-preview-images)
5. [PageSpeed and Core Web Vitals](#5-pagespeed-and-core-web-vitals)
6. [Game Directories and Aggregators](#6-game-directories-and-aggregators)
7. [Backlink Strategies](#7-backlink-strategies)
8. [Implementation Priority](#8-implementation-priority)

---

## 1. Technical SEO for Next.js Games

### Current State (Gap Analysis)

The current `layout.tsx` has minimal metadata:
```typescript
export const metadata: Metadata = {
  title: "Voidcrawl - Browser Roguelike",
  description: "A turn-based browser roguelike...",
};
```

Missing: `metadataBase`, Open Graph, Twitter cards, robots directives, JSON-LD structured data, canonical URLs, keywords, verification tags, sitemap, robots.txt.

### Complete Root Layout Metadata

**Confidence: HIGH** (verified against Next.js 16.2.0 official docs at https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

Replace the metadata export in `src/app/layout.tsx` with:

```typescript
import type { Metadata } from "next";

// IMPORTANT: Replace with actual production URL once deployed
const SITE_URL = "https://voidcrawl.com"; // or https://voidcrawl.vercel.app

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Voidcrawl - Free Browser Roguelike Dungeon Crawler",
    template: "%s | Voidcrawl",
  },

  description:
    "Play Voidcrawl free in your browser. A turn-based roguelike dungeon crawler with procedural generation, tactical combat, permadeath, and deep loot systems. No download required.",

  keywords: [
    "browser roguelike",
    "free roguelike",
    "play roguelike online",
    "web roguelike",
    "turn based browser game",
    "dungeon crawler online",
    "browser dungeon crawler",
    "roguelike no download",
    "HTML5 roguelike",
    "procedural dungeon game",
    "permadeath browser game",
    "tactical roguelike",
    "free browser game",
    "indie roguelike",
  ],

  applicationName: "Voidcrawl",
  category: "games",
  creator: "Vincent",
  publisher: "Vincent",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Voidcrawl",
    title: "Voidcrawl - Free Browser Roguelike Dungeon Crawler",
    description:
      "Descend into procedurally generated void dungeons. Turn-based tactical combat, permadeath, deep loot. Play free in your browser.",
    images: [
      {
        url: "/og-image.png", // resolved to SITE_URL/og-image.png via metadataBase
        width: 1200,
        height: 630,
        alt: "Voidcrawl - A void-themed dungeon with glowing cyan corridors and lurking enemies",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Voidcrawl - Free Browser Roguelike",
    description:
      "Turn-based dungeon crawling in your browser. Procedural dungeons, tactical combat, permadeath. No download.",
    images: ["/og-image.png"],
    // creator: "@voidcrawl", // uncomment when Twitter/X account exists
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  // Uncomment after setting up Google Search Console:
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_CODE",
  // },

  other: {
    "mobile-web-app-capable": "yes",
  },
};
```

### Play Page Metadata

The `/play` page needs its own metadata. Since it uses `"use client"`, the metadata must be in a separate server component or exported from a page that wraps the client component.

**Current problem:** `src/app/play/page.tsx` has `"use client"` at the top, which prevents metadata exports (metadata must come from Server Components).

**Solution:** Remove `"use client"` from the page file. It already uses `dynamic()` import for the client component, so the page itself can be a Server Component:

```typescript
// src/app/play/page.tsx
// NOTE: Do NOT add "use client" here. The page is a Server Component.
// GameCanvas is loaded client-side via dynamic import.

import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Play Voidcrawl",
  description:
    "Play Voidcrawl right now in your browser. Turn-based roguelike dungeon crawler with procedural generation and permadeath.",
  openGraph: {
    title: "Play Voidcrawl - Browser Roguelike",
    description:
      "Descend into the void. Play this turn-based roguelike dungeon crawler free in your browser.",
    url: "/play",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p
        style={{ color: "var(--void-cyan)" }}
        className="text-xl tracking-widest animate-pulse"
      >
        DESCENDING INTO THE VOID...
      </p>
    </div>
  ),
});

export default function PlayPage() {
  return <GameCanvas />;
}
```

### JSON-LD Structured Data

**Confidence: HIGH** (verified against schema.org/VideoGame specification)

Next.js recommends adding JSON-LD as a `<script>` tag in a Server Component. Add this to the root layout or homepage:

```typescript
// src/app/json-ld.tsx (create this file)

export function GameJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["VideoGame", "SoftwareApplication"],
    name: "Voidcrawl",
    url: "https://voidcrawl.com",
    description:
      "A turn-based browser roguelike dungeon crawler. Descend through procedurally generated void-themed dungeons, fight enemies, collect loot, and try to survive as deep as possible.",
    genre: ["Roguelike", "Dungeon Crawler", "Turn-Based Strategy"],
    gamePlatform: ["Web Browser"],
    applicationCategory: "Game",
    applicationSubCategory: "Browser Game",
    operatingSystem: "Any (Web Browser)",
    availableOnDevice: "Desktop, Mobile",
    playMode: "SinglePlayer",
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      value: 1,
    },
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: {
      "@type": "Person",
      name: "Vincent",
    },
    inLanguage: "en",
    isFamilyFriendly: true,
    contentRating: "Everyone",
    image: "https://voidcrawl.com/og-image.png",
    screenshot: "https://voidcrawl.com/screenshots/gameplay-1.png",
    // datePublished: "2026-XX-XX", // set on launch
    softwareVersion: "0.1.0",
    featureList: [
      "Procedural dungeon generation",
      "Turn-based tactical combat",
      "Permadeath",
      "Deep loot system",
      "Multiple enemy types with unique abilities",
      "Boss encounters",
    ],
    keywords:
      "browser roguelike, free roguelike, dungeon crawler, turn-based, permadeath",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

Then add `<GameJsonLd />` to your root layout body or homepage.

**Important note on co-typing:** Google does not show rich results for the VideoGame type alone. By co-typing as `["VideoGame", "SoftwareApplication"]`, the structured data becomes eligible for Google's Software App rich results (star ratings, price display in search results).

Source: https://developers.google.com/search/docs/appearance/structured-data/software-app

### robots.ts

**Confidence: HIGH** (verified against Next.js 16.2 docs)

Create `src/app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: "https://voidcrawl.com/sitemap.xml",
  };
}
```

This generates:
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

Sitemap: https://voidcrawl.com/sitemap.xml
```

### sitemap.ts

**Confidence: HIGH** (verified against Next.js 16.2 docs)

Create `src/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://voidcrawl.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/play`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Add these as you create the pages:
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/changelog`,
    //   lastModified: new Date(),
    //   changeFrequency: "weekly",
    //   priority: 0.6,
    // },
    // {
    //   url: `${baseUrl}/press`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.4,
    // },
  ];
}
```

---

## 2. Landing Page Optimization

### Current State

The homepage (`src/app/page.tsx`) has:
- Title with "VOIDCRAWL" heading
- One-line description
- Single "ENTER THE VOID" CTA
- Three feature cards (Turn-Based Combat, Procedural Dungeons, Loot & Progression)

This is minimal. Research shows game landing pages with visuals convert dramatically better.

### Recommended Landing Page Structure

**Confidence: MEDIUM** (pattern analysis from multiple successful browser game sites including Rogule, WebBrogue, CrazyGames listings)

**Above the fold (first viewport):**
1. Game title + tagline (already have this)
2. Animated screenshot or GIF of actual gameplay (MISSING - critical gap)
3. Primary CTA: "PLAY NOW - FREE" button (existing but could be stronger)
4. One-line value prop: "No download. No account. Just play."

**Below the fold:**
1. 3-4 gameplay screenshots or a short video/GIF loop
2. Feature bullets (expanded from current 3, target 4-6):
   - "Procedurally generated dungeons - every run is different"
   - "Turn-based tactical combat - think before you act"
   - "Permadeath - death is permanent, progress is knowledge"
   - "Deep loot system - weapons, armor, potions, scrolls"
   - "Boss encounters - unique mechanics every 5 floors"
   - "Play anywhere - works on desktop and mobile browsers"
3. "How to Play" quick guide (3-4 steps with icons)
4. Social proof section (when available): player count, positive quotes
5. Dev blog link / changelog link (helps SEO with regular content)
6. Footer with links

### Key Conversion Optimizations

- **Play button must be visible without scrolling** on all screen sizes
- **No registration wall** -- the play link goes straight to the game (Voidcrawl already does this correctly)
- **Loading time under 3 seconds** -- 53% of mobile users abandon after 3s
- **"No download required"** -- explicitly state this; it is the core advantage of a browser game
- **Screenshot/GIF is the #1 conversion driver** for game landing pages. Text-only landing pages for games perform poorly.

### Landing Page Content for SEO

The homepage should contain enough text for search engines to understand the page. The current page has very little indexable text. Add a paragraph or two of descriptive text (can be styled subtly):

```
Voidcrawl is a free turn-based roguelike dungeon crawler you can play
right in your browser. Descend through procedurally generated
void-themed dungeons, fight enemies with tactical turn-based combat,
discover weapons and armor with unique runic enchantments, and try to
survive as deep as possible. Every run is different. Death is permanent.
No download required.
```

This single paragraph hits multiple target keywords naturally.

---

## 3. Keyword Research

### Primary Target Keywords

**Confidence: MEDIUM** (derived from itch.io tag volumes, Google autocomplete, and competitor page titles; exact search volumes require paid tools like Ahrefs/SEMrush)

| Keyword | Estimated Competition | Strategy |
|---------|----------------------|----------|
| `browser roguelike` | Low-Medium | Primary target. Include in title tag, H1, description. |
| `free roguelike` | Medium | High intent. Use in page copy and meta description. |
| `play roguelike online` | Low | Long-tail, high intent. Use in page copy. |
| `web roguelike` | Low | Alternate phrasing. Use in body text. |
| `roguelike no download` | Low | High intent differentiator. Use in feature copy. |
| `browser dungeon crawler` | Low | Secondary keyword. Use in description. |
| `turn based browser game` | Low-Medium | Genre keyword. Use in meta tags. |
| `free browser game` | High | Very broad, competitive. Use but don't target primarily. |
| `HTML5 roguelike` | Very Low | Niche/technical. Good for directories and dev communities. |
| `online dungeon crawler free` | Low | Long-tail. Use in body copy. |

### Keyword Usage Map

| Location | Keywords to Use |
|----------|----------------|
| `<title>` | "Voidcrawl - Free Browser Roguelike Dungeon Crawler" |
| `<meta description>` | "Play Voidcrawl free in your browser. Turn-based roguelike dungeon crawler..." |
| H1 heading | "VOIDCRAWL" (brand) |
| H2 or subtitle | "Free Turn-Based Browser Roguelike" |
| Body text | Natural usage of "browser roguelike", "dungeon crawler", "play online", "no download" |
| Image alt text | "Voidcrawl gameplay screenshot - browser roguelike dungeon crawler" |
| OG title | "Voidcrawl - Free Browser Roguelike Dungeon Crawler" |

### Competitor Landscape

The browser roguelike space is relatively uncrowded in organic search. Key competitors:

| Competitor | URL | Notes |
|-----------|-----|-------|
| Rogule | rogule.com | Daily roguelike, minimalist. Strong brand, daily engagement. |
| WebBrogue | brogue.roguelikelike.com | Port of classic Brogue. Established community. |
| RuggRogue | tung.github.io/ruggrogue | Simple web-playable roguelike. GitHub Pages. |
| Dungeon Crawl Stone Soup (web) | crawl.develz.org | Major traditional roguelike with web tiles. |
| itch.io roguelikes | itch.io/games/html5/tag-roguelike | Aggregator listing. Many small games. |

**Opportunity:** Most browser roguelikes have minimal SEO. They rely on community word-of-mouth (Reddit, RogueBasin) rather than search optimization. A well-optimized landing page for Voidcrawl can rank quickly for long-tail terms like "browser roguelike dungeon crawler" and "play roguelike online free".

---

## 4. Social Card Preview Images

### Open Graph Image Specifications

**Confidence: HIGH** (verified dimensions against platform docs)

| Platform | Recommended Size | Aspect Ratio | Max File Size |
|----------|-----------------|--------------|---------------|
| Facebook/LinkedIn | 1200 x 630 px | 1.91:1 | 300 KB |
| Twitter/X | 1200 x 630 px | 1.91:1 | 5 MB |
| Discord | 1200 x 630 px | 1.91:1 | 8 MB |
| Slack | 1200 x 630 px | 1.91:1 | -- |

**Use 1200 x 630 pixels, PNG format, under 300 KB.** This is the universal sweet spot.

### Content for the OG Image

For ASCII/pixel art games, effective OG images typically include:

1. **Game title** in large, stylized text (center-top or center)
2. **Gameplay screenshot** or stylized dungeon art as background
3. **Tagline** in smaller text below title: "Free Browser Roguelike"
4. **Dark background** matching the game's aesthetic (void theme = dark with cyan accents)
5. **No small text** -- the image is shown at ~600px wide on most platforms

**Recommended composition for Voidcrawl:**
```
+--------------------------------------------+
|                                            |
|         [Dark void background with         |
|          subtle dungeon tile grid]         |
|                                            |
|           V O I D C R A W L               |
|         (large, glowing cyan text)         |
|                                            |
|    "Free Browser Roguelike Dungeon Crawler" |
|         (smaller, muted text)              |
|                                            |
|      [Small gameplay screenshot or          |
|       stylized dungeon corridor art]       |
|                                            |
+--------------------------------------------+
1200 x 630 px
```

### Dynamic OG Image with Next.js ImageResponse

**Confidence: HIGH** (verified against Next.js 16.2 official docs)

Create `src/app/opengraph-image.tsx`:

```typescript
import { ImageResponse } from "next/og";

export const alt = "Voidcrawl - Free Browser Roguelike Dungeon Crawler";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Decorative grid lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.1,
            backgroundImage:
              "linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: "#00ffff",
            textShadow: "0 0 40px rgba(0,255,255,0.5), 0 0 80px rgba(0,255,255,0.3)",
            marginBottom: 20,
            display: "flex",
          }}
        >
          VOIDCRAWL
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#8892a0",
            letterSpacing: "0.15em",
            display: "flex",
          }}
        >
          FREE BROWSER ROGUELIKE DUNGEON CRAWLER
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
          }}
        >
          {["PROCEDURAL", "TURN-BASED", "PERMADEATH"].map((label) => (
            <div
              key={label}
              style={{
                border: "1px solid rgba(0,255,255,0.4)",
                borderRadius: 4,
                padding: "8px 20px",
                fontSize: 18,
                color: "#00ffff",
                letterSpacing: "0.1em",
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
```

Also create `src/app/twitter-image.tsx` with identical content (or export from a shared function). Next.js will automatically use these for the respective meta tags.

**Note:** `ImageResponse` only supports flexbox layout and a subset of CSS. No `display: grid`, no `background-image: url(...)` for external images (though you can embed base64 or fetch images). Supported CSS list: https://github.com/vercel/satori#css

---

## 5. PageSpeed and Core Web Vitals

### Target Metrics

| Metric | Target | Why |
|--------|--------|-----|
| LCP (Largest Contentful Paint) | < 2.5s | Google ranking factor |
| INP (Interaction to Next Paint) | < 200ms | Google ranking factor |
| CLS (Cumulative Layout Shift) | < 0.1 | Google ranking factor |
| TTFB (Time to First Byte) | < 800ms | Vercel handles this well |

### Game-Specific Challenges

**Confidence: HIGH** (based on Next.js architecture and Canvas game patterns)

1. **Large JS bundle from game engine**: The game engine (`src/game/`) and Phaser (listed in package.json as a dependency) are client-side only. Phaser alone is ~1MB minified. This will hurt LCP on the `/play` page.

2. **Canvas rendering not counted as LCP**: The `<canvas>` element content is not detected by Lighthouse as LCP. LCP will be determined by the loading spinner text or the largest visible HTML element. This is actually favorable -- your loading state IS the LCP element.

3. **The landing page (`/`) is light**: No game code loads on the homepage if you use `dynamic()` import correctly (which you already do on `/play`). Homepage LCP should be excellent.

### Optimization Checklist

```typescript
// 1. Analyze bundle size
// Add to package.json scripts:
// "analyze": "ANALYZE=true next build"

// Install:
// npm install -D @next/bundle-analyzer

// next.config.ts:
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
};

export default withBundleAnalyzer(nextConfig);
```

**Key optimizations:**

| Issue | Solution | Impact |
|-------|----------|--------|
| Phaser is ~1MB | Already using `dynamic()` with `ssr: false` -- good. Ensure it only loads on `/play`. | HIGH |
| Game assets loaded eagerly | Lazy-load audio, sprites after initial render | MEDIUM |
| No image optimization on landing page | Use `next/image` for any screenshots/previews on homepage | MEDIUM |
| Font loading | Use `next/font` for the game's UI font to avoid FOIT/FOUT | LOW |
| Homepage has no images | LCP is the text heading. Keep it rendering fast. | LOW (already fast) |

**For the `/play` route specifically:**
- The loading spinner ("DESCENDING INTO THE VOID...") IS the LCP element. Keep it lightweight.
- Game engine loads async via `dynamic()`. This is correct.
- Do NOT preload the game bundle -- let the landing page stay fast.
- Consider adding `<link rel="preconnect">` for any CDN-hosted assets.

### Vercel-Specific Advantages

Vercel automatically provides:
- Edge CDN with global distribution
- Automatic static optimization for pages without server-side data
- Brotli compression
- HTTP/2 and HTTP/3
- Image optimization (when using `next/image`)

The homepage should score 90+ on PageSpeed out of the box since it is purely static HTML with minimal JS.

---

## 6. Game Directories and Aggregators

### Tier 1: High Impact (submit immediately on launch)

**Confidence: HIGH** (verified platforms are active and accepting submissions in 2026)

| Directory | URL | Submission Process | Metadata Needed |
|-----------|-----|-------------------|-----------------|
| **itch.io** | https://itch.io | Create dev account, upload as HTML5 game. Mark "This file will be played in the browser". | Title, description, tags (roguelike, dungeon-crawler, turn-based, browser), screenshots (min 3), cover image (630x500), genre. |
| **Newgrounds** | https://newgrounds.com | Create account, submit under Games. HTML5 supported. | Title, description, genre tags, age rating, thumbnail, author credits. |
| **RogueBasin** | https://roguebasin.com | Create wiki account, add game page. Self-service wiki. | Game name, developer, platform (Web), language (TypeScript), development status, description, screenshot, link. |
| **CrazyGames** | https://developer.crazygames.com | Developer submission portal. Review process takes 1-2 weeks. | Game file (iframe-embeddable), description, screenshots, categories. Revenue share available. |

### Tier 2: Community Directories

| Directory | URL | Notes |
|-----------|-----|-------|
| **BBOGD** (Browser Based Online Game Directory) | https://bbogd.com | Free listing. Community voting. |
| **Top Web Games** | https://topwebgames.com | Voting-based directory. Good for ongoing visibility. |
| **PBBG.com** | https://pbbg.com | If game adds persistent elements, this becomes relevant. Currently Voidcrawl is session-based, so lower priority. |
| **iDev Games** | https://idev.games | Accepts HTML5 games with roguelike tag. |
| **Armor Games** | https://armorgames.com | Accepts HTML5 submissions. Review process. |

### Tier 3: Aggregator Listings (indirect)

| Platform | How to Get Listed |
|----------|------------------|
| **FreeToGame** | Submit via https://www.freetogame.com/contact. They curate browser games. |
| **PC Gamer "Best Browser Games"** | Pitch via press kit to editors. These roundup articles rank #1 for "best browser games". |
| **Rogueliker.com** | Monthly "Best New Roguelikes" posts. Submit via contact form or Twitter. |

### itch.io Submission Technical Requirements

**Confidence: HIGH** (verified against itch.io/docs/creators/html5)

For Voidcrawl on itch.io, you would need to create a static export or embed:

1. ZIP file must have `index.html` at root (not in a subfolder)
2. Max 1,000 files after extraction
3. Max 500 MB total extracted size
4. Max 200 MB per individual file
5. File path length < 240 characters

Since Voidcrawl is a Next.js app, you have two options:
- **Option A (Recommended):** Link to the Vercel-hosted URL from your itch.io page. Set the game type to "HTML" and provide the iframe embed URL.
- **Option B:** Create a static export (`next build && next export`) if the game can run fully client-side. This may not work cleanly with App Router features.

For itch.io, Option A is simpler and keeps your deployment pipeline clean.

---

## 7. Backlink Strategies

### High-Impact Backlink Sources

**Confidence: MEDIUM** (strategies verified across multiple indie game marketing guides)

#### 1. Reddit (Organic Community Engagement)

**Target subreddits:**

| Subreddit | Subscribers | Self-Promo Rules | Post Strategy |
|-----------|-------------|------------------|---------------|
| r/roguelikes | ~120K | Allowed with flair | "I made a browser roguelike, try it" with gameplay GIF |
| r/roguelikedev | ~55K | Dev-focused, very welcoming | Share dev progress, participate in Sharing Saturdays |
| r/WebGames | ~400K | Games must be playable in browser | Direct link to game. This is the perfect subreddit. |
| r/IndieGaming | ~390K | Self-promo OK with good content | GIF/video post with title, link in comments |
| r/indiegames | ~235K | Self-promo OK | Similar to IndieGaming |
| r/playmygame | ~50K | Explicit self-promo subreddit | Direct link with description |
| r/gamedev | ~1.3M | Feedback Friday, Screenshot Saturday | Participate in weekly threads |

**Rules to follow:**
- Build karma (20+ minimum) before posting
- Participate in communities for 1-2 weeks before self-promoting
- Lead with a GIF or screenshot, not a text sales pitch
- "Show, don't sell" -- share the game, don't advertise it
- Respond to every comment

#### 2. Dev Blog / Changelog (SEO Content Engine)

Create a `/blog` or `/changelog` route. Each post is a new indexable page targeting long-tail keywords.

**Post ideas:**
- "How I Built a Browser Roguelike with Next.js and Canvas" (targets: "browser roguelike tutorial", "Next.js game")
- "Procedural Dungeon Generation in TypeScript" (targets: "procedural generation tutorial", "dungeon generation algorithm")
- "Why I Made a Free Browser Game in 2026" (targets: "browser game development", "indie game development")
- Weekly/monthly changelogs with update details

Each post generates backlinks when shared and can rank independently for developer-focused keywords.

#### 3. Press Kit Page

Create a `/press` route. Include:

| Element | Details |
|---------|---------|
| Game description | Short (1 paragraph) and long (3-4 paragraphs) |
| Screenshots | 5-8 high-res PNGs, downloadable as ZIP |
| Logo | PNG with transparent background, multiple sizes |
| Key art / OG image | High-res version |
| GIF of gameplay | 15-30 seconds, shows core loop |
| Fact sheet | Genre, platform, price (free), release date, developer, contact |
| Credits | Developer name, contact email |
| Links | Game URL, itch.io page, social accounts |

Use the press kit format from https://dopresskit.com/ or the newer https://impress.games/press-kitty as reference.

#### 4. Game Jams

Submitting to game jams (even retroactively via "made outside the jam" tags on itch.io) generates backlinks and visibility:
- itch.io game jams (constant ongoing jams)
- 7DRL (Seven Day Roguelike) -- annual roguelike-specific jam, highly relevant
- Ludum Dare
- GMTK Game Jam

#### 5. Additional Backlink Tactics

| Tactic | Effort | Impact |
|--------|--------|--------|
| GitHub open-source (game engine parts) | Low | Backlinks from GitHub, dev community interest |
| Hacker News "Show HN" post | Low | Massive one-day traffic spike if it hits front page |
| r/roguelikedev Sharing Saturday | Low | Weekly recurring visibility |
| Cross-promote with other browser roguelike devs | Medium | Direct backlinks, shared audiences |
| Dev diary on dev.to or Medium | Medium | SEO backlinks, developer audience |
| Submit to "Awesome" lists (awesome-roguelikes on GitHub) | Low | Permanent backlink |
| YouTube/Twitch content creators | High | Video backlinks, gameplay visibility |

### Google Search Console Setup

**Confidence: HIGH** (standard process)

1. Go to https://search.google.com/search-console
2. Add property (URL prefix: `https://voidcrawl.com`)
3. Verify ownership (HTML tag method works with Next.js `verification` metadata field)
4. Submit sitemap: enter `sitemap.xml` in the Sitemaps section
5. Use URL Inspection tool to request indexing of key pages (`/` and `/play`)
6. Monitor "Performance" tab for search queries and impressions

---

## 8. Implementation Priority

### Phase 1: Pre-Launch Foundation (Do Now)

| Task | File(s) | Effort | Impact |
|------|---------|--------|--------|
| Complete metadata in layout.tsx | `src/app/layout.tsx` | 30 min | HIGH |
| Add play page metadata | `src/app/play/page.tsx` | 15 min | MEDIUM |
| Create robots.ts | `src/app/robots.ts` | 5 min | MEDIUM |
| Create sitemap.ts | `src/app/sitemap.ts` | 10 min | MEDIUM |
| Add JSON-LD structured data | `src/app/json-ld.tsx` + layout | 20 min | MEDIUM |
| Create OG image | `src/app/opengraph-image.tsx` | 45 min | HIGH |
| Add descriptive text to homepage | `src/app/page.tsx` | 15 min | MEDIUM |

### Phase 2: Launch Day

| Task | Effort | Impact |
|------|--------|--------|
| Set up Google Search Console | 15 min | HIGH |
| Submit sitemap to Google | 5 min | HIGH |
| Post to r/WebGames | 30 min | HIGH |
| Post to r/roguelikes | 30 min | HIGH |
| Create itch.io page | 1 hour | HIGH |
| Create RogueBasin wiki page | 30 min | MEDIUM |

### Phase 3: First Month

| Task | Effort | Impact |
|------|--------|--------|
| Create press kit page (`/press`) | 2-3 hours | MEDIUM |
| Write first dev blog post | 2-3 hours | MEDIUM |
| Submit to CrazyGames | 1 hour | MEDIUM |
| Submit to Newgrounds | 1 hour | MEDIUM |
| Post "Show HN" on Hacker News | 30 min | HIGH (if it lands) |
| Participate in r/roguelikedev Sharing Saturday | 30 min/week | MEDIUM |
| Submit to BBOGD, Top Web Games | 30 min | LOW |

### Phase 4: Ongoing

| Task | Frequency | Impact |
|------|-----------|--------|
| Changelog / dev blog posts | Bi-weekly | MEDIUM (compounds) |
| Monitor Search Console | Weekly | LOW-MEDIUM |
| Community engagement (Reddit, Discord) | Daily/weekly | HIGH (compounds) |
| Update OG image when game visuals improve | As needed | LOW |

---

## Sources

### Official Documentation (HIGH confidence)
- [Next.js generateMetadata API Reference (v16.2)](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js robots.txt File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js sitemap.xml File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js ImageResponse API Reference](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Next.js Metadata and OG Images Guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Schema.org VideoGame Type](https://schema.org/VideoGame)
- [Google SoftwareApplication Structured Data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [itch.io HTML5 Game Upload Docs](https://itch.io/docs/creators/html5)
- [Google Search Console](https://search.google.com/search-console/about)

### Game Directories (HIGH confidence - verified active)
- [RogueBasin Wiki](https://roguebasin.com)
- [itch.io HTML5 Roguelikes](https://itch.io/games/html5/tag-roguelike)
- [BBOGD](https://bbogd.com)
- [Top Web Games](https://topwebgames.com)
- [CrazyGames Developer Portal](https://developer.crazygames.com)
- [Newgrounds](https://newgrounds.com)

### SEO and Marketing Guides (MEDIUM confidence)
- [OG Image Sizes Guide 2025](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide)
- [Indie Game Marketing Complete Guide](https://generalistprogrammer.com/tutorials/indie-game-marketing-complete-guide-promote-your-game)
- [Indie Dev Press Kit Guide](https://acorngames.gg/blog/2024/6/12/the-indie-devs-guide-to-assembling-the-perfect-press-kit)
- [How to Market a Video Game on Reddit 2025](https://www.cloutboost.com/blog/how-to-market-a-video-game-on-reddit-the-complete-2025-guide-for-game-developers)
- [presskit() - dopresskit.com](https://dopresskit.com/)
- [Optimizing Core Web Vitals in Next.js 2025](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)
- [Game Landing Page Examples](https://landingi.com/landing-page/game-examples/)
- [Rogueliker Best New Roguelikes](https://rogueliker.com/best-new-roguelikes/)

### Competitor/Reference Sites (verified active)
- [Rogule](https://rogule.com/)
- [WebBrogue](http://brogue.roguelikelike.com/)
- [RuggRogue](https://tung.github.io/ruggrogue/)
