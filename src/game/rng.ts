// Seeded RNG module for deterministic gameplay (daily challenge mode)
// Uses mulberry32 PRNG — fast, small, good statistical properties for games

/** Hash a string into a 32-bit integer seed */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/** Create a mulberry32 PRNG from a numeric seed */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Module-level RNG state
let seededFn: (() => number) | null = null;

/** Get a random number in [0, 1). Drop-in replacement for Math.random(). */
export function random(): number {
  if (seededFn) return seededFn();
  return Math.random();
}

/** Seed the RNG with a string. All subsequent random() calls are deterministic. */
export function seedRng(seed: string): void {
  seededFn = mulberry32(hashString(seed));
}

/** Seed the RNG for a specific floor (deterministic per-floor generation). */
export function seedRngForFloor(baseSeed: string, floor: number): void {
  seededFn = mulberry32(hashString(`${baseSeed}_floor_${floor}`));
}

/** Switch to unseeded mode (Math.random). */
export function unseedRng(): void {
  seededFn = null;
}

/** Get today's date string for daily challenge seed (YYYY-MM-DD). */
export function getDailySeed(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format a date string for display (e.g., "March 20, 2026"). */
export function formatDailyDate(seed: string): string {
  const [y, m, d] = seed.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
