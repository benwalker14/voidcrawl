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
}
