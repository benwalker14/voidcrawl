// Game constants
export const TILE_SIZE = 16;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const VICTORY_FLOOR = 15; // Descending past this floor triggers victory
export const VIEWPORT_TILES_X = 20;
export const VIEWPORT_TILES_Y = 15;
export const SCALE = 2;

export const CANVAS_WIDTH = VIEWPORT_TILES_X * TILE_SIZE * SCALE;
export const CANVAS_HEIGHT = VIEWPORT_TILES_Y * TILE_SIZE * SCALE;

// Tile types
export enum TileType {
  VOID = 0,
  FLOOR = 1,
  WALL = 2,
  STAIRS_DOWN = 3,
  DOOR = 4,
  SHRINE = 5,
}

// Zone themes — visual palettes that change by floor depth
export interface ZoneTheme {
  name: string;
  bgColor: string;      // void/background
  floorColor: string;    // walkable floor
  wallColor: string;     // walls
  stairsColor: string;   // stairs down
  doorColor: string;     // doors
  shrineFloor: string;   // shrine base (same as floor)
  accentColor: string;   // zone accent for messages/UI
  fovModifier: number;   // FOV radius modifier (0 = normal, negative = reduced)
}

export const ZONE_THEMES: ZoneTheme[] = [
  {
    // Floors 1-4: Null Tunnels (purple, the original palette)
    name: "Null Tunnels",
    bgColor: "#0a0a0f",
    floorColor: "#1a1a2e",
    wallColor: "#2d2d44",
    stairsColor: "#06b6d4",
    doorColor: "#854d0e",
    shrineFloor: "#1a1a2e",
    accentColor: "#a78bfa",
    fovModifier: 0,
  },
  {
    // Floors 5-9: Crystal Depths (cyan/blue)
    name: "Crystal Depths",
    bgColor: "#050a10",
    floorColor: "#0f1a2e",
    wallColor: "#1a3a5c",
    stairsColor: "#22d3ee",
    doorColor: "#2563eb",
    shrineFloor: "#0f1a2e",
    accentColor: "#38bdf8",
    fovModifier: 0,
  },
  {
    // Floors 10+: Shadow Realm (dark red/black, reduced FOV)
    name: "Shadow Realm",
    bgColor: "#0a0505",
    floorColor: "#1a0f0f",
    wallColor: "#3d1a1a",
    stairsColor: "#f87171",
    doorColor: "#92400e",
    shrineFloor: "#1a0f0f",
    accentColor: "#ef4444",
    fovModifier: -2,
  },
];

/** Get the zone theme for a given floor number */
export function getZoneTheme(floor: number): ZoneTheme {
  if (floor <= 4) return ZONE_THEMES[0];
  if (floor <= 9) return ZONE_THEMES[1];
  return ZONE_THEMES[2];
}

/** Get tile colors for the current zone (replaces static TILE_COLORS for rendering) */
export function getZoneTileColors(floor: number): Record<TileType, string> {
  const zone = getZoneTheme(floor);
  return {
    [TileType.VOID]: zone.bgColor,
    [TileType.FLOOR]: zone.floorColor,
    [TileType.WALL]: zone.wallColor,
    [TileType.STAIRS_DOWN]: zone.stairsColor,
    [TileType.DOOR]: zone.doorColor,
    [TileType.SHRINE]: zone.shrineFloor,
  };
}

// Default colors (Null Tunnels) — kept for backwards compatibility
export const TILE_COLORS: Record<TileType, string> = {
  [TileType.VOID]: "#0a0a0f",
  [TileType.FLOOR]: "#1a1a2e",
  [TileType.WALL]: "#2d2d44",
  [TileType.STAIRS_DOWN]: "#06b6d4",
  [TileType.DOOR]: "#854d0e",
  [TileType.SHRINE]: "#1a1a2e",
};

// Entity types
export enum EntityType {
  PLAYER = "player",
  ENEMY = "enemy",
  ITEM = "item",
}

// Item categories
export enum ItemCategory {
  WEAPON = "weapon",
  ARMOR = "armor",
  POTION = "potion",
  SCROLL = "scroll",
}

// Consumable effects
export enum ConsumableEffect {
  HEAL = "heal",
  HASTE = "haste",
  INVISIBILITY = "invisibility",
  TELEPORT = "teleport",
  FIRE = "fire",
  POISON = "poison",
  STRENGTH = "strength",
  MAGIC_MAPPING = "magic_mapping",
  ENCHANT = "enchant",
  FEAR = "fear",
  SUMMON = "summon",
  REMOVE_CURSE = "remove_curse",
}

// Trap types
export enum TrapType {
  SPIKE = "spike",         // Deals 5 damage when stepped on
  ALARM = "alarm",         // Alerts all enemies on the floor (sets to CHASE)
  TELEPORT = "teleport",   // Teleports player to a random floor tile
}

export interface Trap {
  pos: Position;
  type: TrapType;
  revealed: boolean;       // true once triggered or revealed by Void Sight
}

// Status effects on the player
export enum StatusEffectType {
  HASTE = "haste",
  INVISIBLE = "invisible",
  STRENGTH = "strength",
}

export interface StatusEffect {
  type: StatusEffectType;
  turnsRemaining: number;
  value: number; // e.g., +3 ATK for strength, unused for others
}

// Runic effects for weapons and armor
export enum RunicEffect {
  // Weapon runics
  VAMPIRIC = "vampiric",       // Heal 1 HP on kill
  FLAMING = "flaming",         // 25% chance to apply 2 dmg/turn burn for 3 turns
  STUNNING = "stunning",       // 20% chance to skip enemy's next turn
  VORPAL = "vorpal",           // 2x damage when enemy below 30% HP
  // Armor runics
  REFLECTIVE = "reflective",   // 15% chance to reflect damage back to attacker
  REGENERATING = "regenerating", // Heal 1 HP every 10 turns
  THORNED = "thorned",         // Deal 1 damage to melee attackers
}

// Human-readable names for consumable effects (used in identification system)
export const CONSUMABLE_EFFECT_NAMES: Record<ConsumableEffect, string> = {
  [ConsumableEffect.HEAL]: "Healing",
  [ConsumableEffect.HASTE]: "Haste",
  [ConsumableEffect.INVISIBILITY]: "Invisibility",
  [ConsumableEffect.TELEPORT]: "Teleport",
  [ConsumableEffect.FIRE]: "Fire",
  [ConsumableEffect.POISON]: "Poison",
  [ConsumableEffect.STRENGTH]: "Strength",
  [ConsumableEffect.MAGIC_MAPPING]: "Mapping",
  [ConsumableEffect.ENCHANT]: "Enchanting",
  [ConsumableEffect.FEAR]: "Fear",
  [ConsumableEffect.SUMMON]: "Summoning",
  [ConsumableEffect.REMOVE_CURSE]: "Remove Curse",
};

export const WEAPON_RUNICS = [RunicEffect.VAMPIRIC, RunicEffect.FLAMING, RunicEffect.STUNNING, RunicEffect.VORPAL];
export const ARMOR_RUNICS = [RunicEffect.REFLECTIVE, RunicEffect.REGENERATING, RunicEffect.THORNED];

export const RUNIC_NAMES: Record<RunicEffect, string> = {
  [RunicEffect.VAMPIRIC]: "Vampiric",
  [RunicEffect.FLAMING]: "Flaming",
  [RunicEffect.STUNNING]: "Stunning",
  [RunicEffect.VORPAL]: "Vorpal",
  [RunicEffect.REFLECTIVE]: "Reflective",
  [RunicEffect.REGENERATING]: "Regenerating",
  [RunicEffect.THORNED]: "Thorned",
};

// Weapon special abilities (sidegrade weapons with unique mechanics)
export enum WeaponSpecial {
  CLEAVE = "cleave",           // Null Scythe: hits target + 1 random adjacent enemy
  DOUBLE_STRIKE = "double_strike", // Rift Dagger: attacks twice at reduced damage
}

export const WEAPON_SPECIAL_NAMES: Record<WeaponSpecial, string> = {
  [WeaponSpecial.CLEAVE]: "Cleave",
  [WeaponSpecial.DOUBLE_STRIKE]: "Double Strike",
};

// Curse effects for weapons and armor (dual-edged: each has a downside AND a situational upside)
export enum CurseEffect {
  // Weapon curses
  ERRATIC = "erratic",         // -2 ATK but 25% chance of 3x damage on any hit
  DISPLACING = "displacing",   // Attacks teleport enemy to random tile
  DRAINING = "draining",       // Kills give -1 max HP but +2 ATK for rest of floor
  // Armor curses
  ANTI_ENTROPY = "anti_entropy", // Attackers frozen 1 turn but you are slowed 1 turn
  VOLATILE = "volatile",         // 10% chance to explode for 4 AoE damage when hit (hurts you and enemies)
  PARANOID = "paranoid",         // +4 detect range but shrines always give negative effects
}

export const WEAPON_CURSES = [CurseEffect.ERRATIC, CurseEffect.DISPLACING, CurseEffect.DRAINING];
export const ARMOR_CURSES = [CurseEffect.ANTI_ENTROPY, CurseEffect.VOLATILE, CurseEffect.PARANOID];

export const CURSE_NAMES: Record<CurseEffect, string> = {
  [CurseEffect.ERRATIC]: "Erratic",
  [CurseEffect.DISPLACING]: "Displacing",
  [CurseEffect.DRAINING]: "Draining",
  [CurseEffect.ANTI_ENTROPY]: "Anti-Entropy",
  [CurseEffect.VOLATILE]: "Volatile",
  [CurseEffect.PARANOID]: "Paranoid",
};

export const CURSE_DESCRIPTIONS: Record<CurseEffect, string> = {
  [CurseEffect.ERRATIC]: "-2 ATK, 25% chance 3x damage",
  [CurseEffect.DISPLACING]: "Attacks teleport enemy to random tile",
  [CurseEffect.DRAINING]: "Kills: -1 max HP, +2 ATK for floor",
  [CurseEffect.ANTI_ENTROPY]: "Attackers frozen 1 turn, you slowed 1 turn",
  [CurseEffect.VOLATILE]: "10% explode on hit: 4 AoE damage to all",
  [CurseEffect.PARANOID]: "+4 detect range, shrines always negative",
};

// Item rarity
export enum ItemRarity {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: "#9ca3af",
  [ItemRarity.UNCOMMON]: "#22c55e",
  [ItemRarity.RARE]: "#3b82f6",
};

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  symbol: string;
  color: string;
  attack?: number;
  defense?: number;
  healAmount?: number;
  effect?: ConsumableEffect;
  effectValue?: number; // duration in turns, damage amount, etc.
  runic?: RunicEffect;
  weaponSpecial?: WeaponSpecial; // Sidegrade weapon unique ability
  cursed?: boolean;           // Cannot be unequipped until Remove Curse scroll used
  curse?: CurseEffect;       // Dual-edged curse effect (downside + situational upside)
  minFloor: number;
  description: string;
}

export interface GroundItem {
  item: Item;
  pos: Position;
}

export interface PlayerInventory {
  items: Item[];
  equippedWeapon: Item | null;
  equippedArmor: Item | null;
}

export const MAX_INVENTORY_SIZE = 8;

export interface Position {
  x: number;
  y: number;
}

// Enemy intent indicators (telegraphed to player)
export enum EnemyIntent {
  IDLE = "idle",           // ~ gray: wandering, unaware
  APPROACHING = "approaching", // ? yellow: detected player, moving toward
  ATTACKING = "attacking",     // ! red: adjacent, will attack next turn
  FLEEING = "fleeing",         // ↓ blue: running away
}

// Enemy AI behavior types
export enum AIBehavior {
  CHASE = "chase",       // Pursue player with pathfinding
  WANDER = "wander",     // Random walk until player spotted, then chase
  AMBUSH = "ambush",     // Stationary until player is close, then aggressive
  COWARD = "coward",     // Chase but flee when low HP
}

// Enemy special abilities
export enum SpecialAbility {
  ARMORED = "armored",         // Void Beetle: takes 1 less damage from all attacks
  PHASE = "phase",             // Shadow Wisp: 30% chance to dodge attacks
  SPLIT = "split",             // Dark Slime: splits into 2 Mini Slimes on death
  LIFE_DRAIN = "life_drain",   // Shade: heals 50% of damage dealt
  TELEPORT = "teleport",       // Void Walker: teleports to random tile when hit
  HOWL = "howl",               // Abyssal Hound: alerts all hounds when spotting player
  ETHEREAL = "ethereal",       // Rift Wraith: moves through walls, vulnerable only on floor tiles
  BOSS_NUCLEUS = "boss_nucleus", // Void Nucleus: stationary, spawns adds, telegraphed attacks
  BOSS_SHADOW_TWIN = "boss_shadow_twin", // Shadow Twin: mirrors movement, splits, goes ethereal
}

export interface GameEntity {
  id: string;
  type: EntityType;
  pos: Position;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  color: string;
  symbol: string;
  xpReward?: number;
  behavior?: AIBehavior;
  detectRange?: number;
  poisonTurns?: number;
  fearTurns?: number;
  friendly?: boolean;
  summonTurns?: number;
  specialAbility?: SpecialAbility;
  burnTurns?: number;     // Flaming runic: 2 dmg/turn
  stunnedNextTurn?: boolean; // Stunning runic: skip next turn
  howled?: boolean; // Abyssal Hound: already howled this floor
  intent?: EnemyIntent;
  isBoss?: boolean;
  bossPhase?: number;        // Current boss phase (0 = spawning adds, 1 = vulnerable/paused)
  bossTurnCounter?: number;  // Turns until next phase transition
  bossTelegraphed?: boolean; // Whether the boss has telegraphed its next special attack
  splitTurnTimer?: number;   // Shadow Twin: turns since split — both copies must die within 3 turns
  isClone?: boolean;         // Shadow Twin: true for the split copy (not the original)
  linkedCloneId?: string;    // Shadow Twin: ID of the other clone (for regeneration check)
}

export interface PlayerProgression {
  level: number;
  xp: number;
  xpToNext: number;
}

// Message colors for the log
export const MSG_COLORS = {
  INFO: "#e2e8f0",      // general info (floor descent, etc.)
  PLAYER_ATK: "#f97316", // player hits enemy
  ENEMY_ATK: "#ef4444",  // enemy hits player / damage taken
  KILL: "#fb923c",       // enemy destroyed
  HEAL: "#22c55e",       // healing / potion use
  XP: "#fbbf24",         // XP gain
  LEVEL_UP: "#facc15",   // level up
  LOOT: "#06b6d4",       // loot drops, item pickup
  EQUIP: "#38bdf8",      // equip/unequip
  WARNING: "#eab308",    // inventory full, already full health
  DEATH: "#dc2626",      // player death
} as const;

export interface GameMessage {
  text: string;
  color: string;
}

export interface FloatingText {
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface HitEffect {
  x: number;
  y: number;
  color: string;         // flash color (orange for player attack, red for enemy attack)
  isPlayerAttack: boolean; // true = player hit enemy, false = enemy hit player
}

export interface RunStats {
  enemiesKilled: number;
  itemsFound: number;
  damageDealt: number;
  damageTaken: number;
  deepestFloor: number;
  startTime: number;
  killedBy: string;
}

// Game modes
export type GameMode = "standard" | "daily";

export interface GameState {
  floor: number;
  map: TileType[][];
  player: GameEntity;
  entities: GameEntity[];
  items: GroundItem[];
  inventory: PlayerInventory;
  progression: PlayerProgression;
  messages: GameMessage[];
  turnCount: number;
  gameOver: boolean;
  victory: boolean;
  fov: boolean[][];
  explored: boolean[][];
  runStats: RunStats;
  statusEffects: StatusEffect[];
  pendingFloatingTexts: FloatingText[];
  pendingHitEffects: HitEffect[];
  pendingShake: number; // 0 = none, higher = stronger shake (max ~8)
  identified: Record<string, boolean>;           // ConsumableEffect -> whether identified this run
  consumableAppearances: Record<string, string>;  // ConsumableEffect -> randomized appearance descriptor
  voidAttunement: number;                         // 0-100 corruption/power meter
  shrinePrompt: boolean;                          // true when player is standing on unused shrine, awaiting Y/N
  traps: Trap[];                                   // Hidden trap tiles on the floor
  shrinesUsed: Set<string>;                       // "x,y" keys of shrines already used this floor
  gameMode: GameMode;
  seed?: string;                                  // Seed string for daily challenge mode
  drainingAtkBonus: number;                        // Draining curse: accumulated +2 ATK per kill this floor
  playerSlowed: boolean;                           // Anti-Entropy curse: player skips next move action
  pendingFloorTransition: boolean;                 // Triggers fade-in animation when entering a new floor
  voidPhaseCooldown: number;                       // Void Phase (75%): turns until wall-walk available again (0 = ready)
  voidPhaseUsedThisTurn: boolean;                  // Tracks if phase-walk was used this turn
  maxHpReduced: boolean;                           // Whether 75% max HP reduction has been applied
}

export interface DailyResult {
  date: string;
  floor: number;
  level: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  itemsFound: number;
  time: string;
  killedBy: string;
  completed: boolean;
}
