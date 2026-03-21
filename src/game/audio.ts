/**
 * Procedural sound effects engine using Web Audio API.
 * All sounds are generated via oscillators — zero asset files.
 * Inspired by Rogule's procedural audio approach.
 */

import { MSG_COLORS } from "./config";
import type { GameMessage } from "./config";

const STORAGE_KEY = "nullcrawl_sound";

let ctx: AudioContext | null = null;
let muted = true; // Default off to respect browser autoplay policies
let masterGain: GainNode | null = null;
let initialized = false;

/** Volume level (0-1). Kept moderate to avoid harsh oscillator tones. */
const MASTER_VOLUME = 0.15;

function getCtx(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : MASTER_VOLUME;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function gain(): GainNode | null {
  getCtx();
  return masterGain;
}

// ─── Public API ───────────────────────────────────────────────

export function initAudio(): void {
  if (initialized) return;
  initialized = true;
  const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored === "on") muted = false;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : MASTER_VOLUME;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
  return muted;
}

// ─── Sound primitives ─────────────────────────────────────────

type OscType = OscillatorType;

/** Play a single tone with attack/decay envelope */
function tone(
  freq: number,
  duration: number,
  type: OscType = "sine",
  volume = 1.0,
  delay = 0,
): void {
  const c = getCtx();
  const master = gain();
  if (!c || !master) return;

  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const t = c.currentTime + delay;
  // Quick attack, natural decay
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/** Play a frequency sweep (ascending or descending) */
function sweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscType = "sine",
  volume = 1.0,
  delay = 0,
): void {
  const c = getCtx();
  const master = gain();
  if (!c || !master) return;

  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;

  const t = c.currentTime + delay;
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/** Play noise burst (for percussive sounds) */
function noiseBurst(duration: number, volume = 0.5, delay = 0): void {
  const c = getCtx();
  const master = gain();
  if (!c || !master) return;

  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // Decaying noise
  }

  const source = c.createBufferSource();
  source.buffer = buffer;
  const g = c.createGain();
  const t = c.currentTime + delay;
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);

  source.connect(g);
  g.connect(master);
  source.start(t);
}

// ─── Game sound effects ───────────────────────────────────────

/** Short percussive blip — player hits enemy */
function sfxCombatHit(): void {
  noiseBurst(0.06, 0.4);
  tone(220, 0.08, "square", 0.5);
}

/** Lower thud — enemy hits player */
function sfxEnemyHit(): void {
  tone(120, 0.12, "sawtooth", 0.6);
  noiseBurst(0.08, 0.3);
}

/** Descending tone — enemy killed */
function sfxEnemyDeath(): void {
  sweep(400, 80, 0.25, "square", 0.4);
}

/** Ascending 3-note chime — item pickup */
function sfxItemPickup(): void {
  tone(523, 0.1, "sine", 0.5, 0);      // C5
  tone(659, 0.1, "sine", 0.5, 0.08);   // E5
  tone(784, 0.15, "sine", 0.5, 0.16);  // G5
}

/** Equip sound — slightly lower, metallic */
function sfxEquip(): void {
  tone(330, 0.08, "triangle", 0.5, 0);   // E4
  tone(440, 0.12, "triangle", 0.5, 0.06); // A4
}

/** 4-note triumphant arpeggio — level up */
function sfxLevelUp(): void {
  tone(523, 0.12, "sine", 0.6, 0);      // C5
  tone(659, 0.12, "sine", 0.6, 0.1);    // E5
  tone(784, 0.12, "sine", 0.6, 0.2);    // G5
  tone(1047, 0.25, "sine", 0.6, 0.3);   // C6
}

/** Low ominous pulse — boss encounter */
function sfxBossEncounter(): void {
  sweep(80, 60, 0.6, "sawtooth", 0.7);
  tone(55, 0.8, "sine", 0.5, 0.1);
  tone(110, 0.3, "square", 0.2, 0.4);
}

/** Dramatic descending+ascending — boss death */
function sfxBossDeath(): void {
  sweep(600, 100, 0.4, "sawtooth", 0.5, 0);
  sweep(100, 800, 0.5, "sine", 0.4, 0.3);
  tone(523, 0.3, "triangle", 0.5, 0.6);  // C5 resolution
}

/** Ambient chord shift — floor descent */
function sfxFloorDescend(): void {
  sweep(300, 150, 0.5, "sine", 0.4);
  tone(110, 0.6, "triangle", 0.3, 0.1);
}

/** Ethereal rising chord — zone transition */
function sfxZoneTransition(): void {
  tone(220, 0.5, "sine", 0.4, 0);       // A3
  tone(277, 0.5, "sine", 0.3, 0.1);     // C#4
  tone(330, 0.5, "sine", 0.3, 0.2);     // E4
  sweep(330, 660, 0.6, "sine", 0.3, 0.3);
}

/** Bubbly fizz — potion use */
function sfxPotionUse(): void {
  for (let i = 0; i < 5; i++) {
    const freq = 600 + Math.random() * 800;
    tone(freq, 0.06, "sine", 0.3, i * 0.03);
  }
}

/** Quick shimmer sweep — scroll use */
function sfxScrollUse(): void {
  sweep(400, 1200, 0.2, "sine", 0.4, 0);
  sweep(1200, 600, 0.2, "triangle", 0.3, 0.15);
}

/** Heal: warm ascending tone */
function sfxHeal(): void {
  tone(392, 0.15, "sine", 0.4, 0);      // G4
  tone(494, 0.2, "sine", 0.4, 0.1);     // B4
}

/** Deep boom — explosion */
function sfxExplosion(): void {
  tone(60, 0.3, "sawtooth", 0.8);
  noiseBurst(0.2, 0.6);
  sweep(200, 40, 0.35, "square", 0.3);
}

/** Sharp alert — trap trigger */
function sfxTrap(): void {
  tone(880, 0.08, "square", 0.5, 0);
  tone(660, 0.08, "square", 0.5, 0.07);
  tone(440, 0.12, "square", 0.5, 0.14);
}

/** Ethereal pad — shrine interaction */
function sfxShrine(): void {
  tone(220, 0.6, "sine", 0.3, 0);
  tone(330, 0.6, "sine", 0.25, 0.05);
  tone(440, 0.5, "sine", 0.2, 0.1);
  sweep(440, 880, 0.4, "sine", 0.15, 0.3);
}

/** Quick woosh — dodge */
function sfxDodge(): void {
  sweep(800, 200, 0.12, "sine", 0.3);
}

/** Warning tone — attunement threshold crossed */
function sfxAttunementThreshold(): void {
  tone(165, 0.4, "sawtooth", 0.4, 0);   // E3
  tone(247, 0.4, "sine", 0.3, 0.15);    // B3
  sweep(247, 494, 0.3, "sine", 0.25, 0.3);
}

/** Player death — descending tragic tones */
function sfxPlayerDeath(): void {
  tone(440, 0.3, "sine", 0.5, 0);       // A4
  tone(370, 0.3, "sine", 0.5, 0.25);    // F#4
  tone(330, 0.3, "sine", 0.5, 0.5);     // E4
  tone(262, 0.6, "sine", 0.5, 0.75);    // C4
}

/** Victory fanfare */
function sfxVictory(): void {
  tone(523, 0.15, "sine", 0.5, 0);      // C5
  tone(659, 0.15, "sine", 0.5, 0.12);   // E5
  tone(784, 0.15, "sine", 0.5, 0.24);   // G5
  tone(1047, 0.15, "sine", 0.5, 0.36);  // C6
  tone(1319, 0.15, "sine", 0.5, 0.48);  // E6
  tone(1568, 0.4, "sine", 0.6, 0.6);    // G6
}

// ─── Event-based sound router ─────────────────────────────────

export enum SoundEvent {
  COMBAT_HIT,
  ENEMY_HIT,
  ENEMY_DEATH,
  ITEM_PICKUP,
  EQUIP,
  LEVEL_UP,
  BOSS_ENCOUNTER,
  BOSS_DEATH,
  FLOOR_DESCEND,
  ZONE_TRANSITION,
  POTION_USE,
  SCROLL_USE,
  HEAL,
  EXPLOSION,
  TRAP,
  SHRINE,
  DODGE,
  ATTUNEMENT_THRESHOLD,
  PLAYER_DEATH,
  VICTORY,
}

export function playSound(event: SoundEvent): void {
  if (muted) return;
  // Ensure AudioContext is created on user gesture
  getCtx();

  switch (event) {
    case SoundEvent.COMBAT_HIT: sfxCombatHit(); break;
    case SoundEvent.ENEMY_HIT: sfxEnemyHit(); break;
    case SoundEvent.ENEMY_DEATH: sfxEnemyDeath(); break;
    case SoundEvent.ITEM_PICKUP: sfxItemPickup(); break;
    case SoundEvent.EQUIP: sfxEquip(); break;
    case SoundEvent.LEVEL_UP: sfxLevelUp(); break;
    case SoundEvent.BOSS_ENCOUNTER: sfxBossEncounter(); break;
    case SoundEvent.BOSS_DEATH: sfxBossDeath(); break;
    case SoundEvent.FLOOR_DESCEND: sfxFloorDescend(); break;
    case SoundEvent.ZONE_TRANSITION: sfxZoneTransition(); break;
    case SoundEvent.POTION_USE: sfxPotionUse(); break;
    case SoundEvent.SCROLL_USE: sfxScrollUse(); break;
    case SoundEvent.HEAL: sfxHeal(); break;
    case SoundEvent.EXPLOSION: sfxExplosion(); break;
    case SoundEvent.TRAP: sfxTrap(); break;
    case SoundEvent.SHRINE: sfxShrine(); break;
    case SoundEvent.DODGE: sfxDodge(); break;
    case SoundEvent.ATTUNEMENT_THRESHOLD: sfxAttunementThreshold(); break;
    case SoundEvent.PLAYER_DEATH: sfxPlayerDeath(); break;
    case SoundEvent.VICTORY: sfxVictory(); break;
  }
}

// ─── Message-based sound detection ────────────────────────────

/**
 * Analyze new game messages and trigger appropriate sounds.
 * Call this after each turn with only the NEW messages from that turn.
 */
export function triggerSoundsFromMessages(messages: GameMessage[]): void {
  if (muted || messages.length === 0) return;

  // Track which sounds to play (deduplicate per turn)
  const sounds = new Set<SoundEvent>();

  for (const msg of messages) {
    const t = msg.text;

    // Priority events first (checked by text content)
    if (t.includes("LEVEL UP")) {
      sounds.add(SoundEvent.LEVEL_UP);
      continue;
    }
    if (t.includes("YOU ESCAPED THE VOID") || t.includes("VICTORY")) {
      sounds.add(SoundEvent.VICTORY);
      continue;
    }
    if (msg.color === MSG_COLORS.DEATH) {
      sounds.add(SoundEvent.PLAYER_DEATH);
      continue;
    }
    if (t.includes("Attunement") && msg.critical) {
      sounds.add(SoundEvent.ATTUNEMENT_THRESHOLD);
      continue;
    }

    // Boss encounters
    if (msg.critical && (t.includes("Void Nucleus") || t.includes("Shadow Twin") || t.includes("dark reflection") || t.includes("sentinel guards the rift") || t.includes("Rift Warden"))) {
      if (t.includes("pulses at") || t.includes("emerges") || t.includes("guards the rift")) {
        sounds.add(SoundEvent.BOSS_ENCOUNTER);
      }
      continue;
    }

    // Boss deaths
    if (msg.critical && (t.includes("implodes") || t.includes("dissolves into darkness") || t.includes("collapses"))) {
      sounds.add(SoundEvent.BOSS_DEATH);
      continue;
    }

    // Explosions (Void Bomber, Fire Potion AoE)
    if (t.includes("explodes") || t.includes("explosion") || t.includes("detonates")) {
      sounds.add(SoundEvent.EXPLOSION);
      continue;
    }

    // Traps
    if (t.includes("trap")) {
      sounds.add(SoundEvent.TRAP);
      continue;
    }

    // Shrine
    if (t.includes("Void Shrine") || t.includes("shrine grants") || t.includes("shrine purifies")) {
      sounds.add(SoundEvent.SHRINE);
      continue;
    }

    // Zone transitions
    if (t.includes("crystalline formations") || t.includes("Darkness closes in") || t.includes("Entering:")) {
      sounds.add(SoundEvent.ZONE_TRANSITION);
      continue;
    }

    // Floor descent
    if (t.includes("descend deeper") || t.includes("descend to floor")) {
      sounds.add(SoundEvent.FLOOR_DESCEND);
      continue;
    }

    // Dodge
    if (t.includes("dodges") || t.includes("phases through")) {
      sounds.add(SoundEvent.DODGE);
      continue;
    }

    // Consumable use — distinguish potion vs scroll
    if (t.startsWith("Used ")) {
      if (t.includes("Scroll") || t.includes("scroll")) {
        sounds.add(SoundEvent.SCROLL_USE);
      } else {
        sounds.add(SoundEvent.POTION_USE);
      }
      continue;
    }

    // Item pickup/equip
    if (msg.color === MSG_COLORS.EQUIP) {
      sounds.add(SoundEvent.EQUIP);
      continue;
    }
    if (msg.color === MSG_COLORS.LOOT && t.includes("Picked up")) {
      sounds.add(SoundEvent.ITEM_PICKUP);
      continue;
    }

    // Healing
    if (msg.color === MSG_COLORS.HEAL && (t.includes("Restored") || t.includes("+") && t.includes("HP"))) {
      sounds.add(SoundEvent.HEAL);
      continue;
    }

    // Combat — player attacks (by color)
    if (msg.color === MSG_COLORS.PLAYER_ATK) {
      sounds.add(SoundEvent.COMBAT_HIT);
      continue;
    }

    // Combat — enemy attacks player
    if (msg.color === MSG_COLORS.ENEMY_ATK && !t.includes("trap")) {
      sounds.add(SoundEvent.ENEMY_HIT);
      continue;
    }

    // Kill messages
    if (msg.color === MSG_COLORS.KILL) {
      sounds.add(SoundEvent.ENEMY_DEATH);
      continue;
    }
  }

  // Play all unique sounds (limit to avoid cacophony)
  // Priority: death/victory > boss > level up > combat > ambient
  const priority: SoundEvent[] = [
    SoundEvent.PLAYER_DEATH,
    SoundEvent.VICTORY,
    SoundEvent.BOSS_ENCOUNTER,
    SoundEvent.BOSS_DEATH,
    SoundEvent.LEVEL_UP,
    SoundEvent.ATTUNEMENT_THRESHOLD,
    SoundEvent.EXPLOSION,
    SoundEvent.ZONE_TRANSITION,
    SoundEvent.FLOOR_DESCEND,
    SoundEvent.TRAP,
    SoundEvent.SHRINE,
    SoundEvent.COMBAT_HIT,
    SoundEvent.ENEMY_HIT,
    SoundEvent.ENEMY_DEATH,
    SoundEvent.DODGE,
    SoundEvent.EQUIP,
    SoundEvent.ITEM_PICKUP,
    SoundEvent.POTION_USE,
    SoundEvent.SCROLL_USE,
    SoundEvent.HEAL,
  ];

  let played = 0;
  for (const s of priority) {
    if (sounds.has(s)) {
      playSound(s);
      played++;
      if (played >= 3) break; // Max 3 simultaneous sounds per turn
    }
  }
}
