// Game constants
export const TILE_SIZE = 16;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
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
}

// Colors for rendering tiles (before we have sprites)
export const TILE_COLORS: Record<TileType, string> = {
  [TileType.VOID]: "#0a0a0f",
  [TileType.FLOOR]: "#1a1a2e",
  [TileType.WALL]: "#2d2d44",
  [TileType.STAIRS_DOWN]: "#06b6d4",
  [TileType.DOOR]: "#854d0e",
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
  isBoss?: boolean;
  bossPhase?: number;        // Current boss phase (0 = spawning adds, 1 = vulnerable/paused)
  bossTurnCounter?: number;  // Turns until next phase transition
  bossTelegraphed?: boolean; // Whether the boss has telegraphed its next special attack
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

export interface RunStats {
  enemiesKilled: number;
  itemsFound: number;
  damageDealt: number;
  damageTaken: number;
  deepestFloor: number;
  startTime: number;
  killedBy: string;
}

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
  fov: boolean[][];
  explored: boolean[][];
  runStats: RunStats;
  statusEffects: StatusEffect[];
  pendingFloatingTexts: FloatingText[];
  identified: Record<string, boolean>;           // ConsumableEffect -> whether identified this run
  consumableAppearances: Record<string, string>;  // ConsumableEffect -> randomized appearance descriptor
}
