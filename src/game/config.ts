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
  messages: string[];
  turnCount: number;
  gameOver: boolean;
  fov: boolean[][];
  explored: boolean[][];
}
