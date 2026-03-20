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
}

export interface GameState {
  floor: number;
  map: TileType[][];
  player: GameEntity;
  entities: GameEntity[];
  items: GroundItem[];
  inventory: PlayerInventory;
  messages: string[];
  turnCount: number;
  gameOver: boolean;
  fov: boolean[][];
  explored: boolean[][];
}
