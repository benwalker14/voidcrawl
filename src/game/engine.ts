import {
  GameState,
  GameEntity,
  EntityType,
  TileType,
  Position,
  MAP_WIDTH,
  MAP_HEIGHT,
} from "./config";
import { generateDungeon } from "./generation/dungeon";
import { spawnEnemies } from "./generation/enemies";
import { computeFov } from "./generation/fov";

function createPlayer(pos: Position): GameEntity {
  return {
    id: "player",
    type: EntityType.PLAYER,
    pos: { ...pos },
    name: "Adventurer",
    hp: 30,
    maxHp: 30,
    attack: 5,
    defense: 2,
    color: "#06b6d4",
    symbol: "@",
  };
}

export function initGame(): GameState {
  return generateFloor(1, null);
}

export function generateFloor(floor: number, prevPlayer: GameEntity | null): GameState {
  const dungeon = generateDungeon(floor);

  // Get all floor tiles for enemy placement (exclude player start and stairs)
  const floorTiles: Position[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (dungeon.map[y][x] === TileType.FLOOR) {
        const dist = Math.abs(x - dungeon.playerStart.x) + Math.abs(y - dungeon.playerStart.y);
        if (dist > 3) {
          floorTiles.push({ x, y });
        }
      }
    }
  }

  const player = prevPlayer
    ? { ...prevPlayer, pos: { ...dungeon.playerStart } }
    : createPlayer(dungeon.playerStart);

  const enemies = spawnEnemies(floor, floorTiles);
  const fov = computeFov(dungeon.map, player.pos.x, player.pos.y);
  const explored: boolean[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  );

  // Mark initial FOV as explored
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (fov[y][x]) explored[y][x] = true;
    }
  }

  return {
    floor,
    map: dungeon.map,
    player,
    entities: enemies,
    messages: [`You descend to floor ${floor} of the void.`],
    turnCount: 0,
    gameOver: false,
    fov,
    explored,
  };
}

function isBlocked(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return true;
  const tile = state.map[y][x];
  if (tile === TileType.WALL || tile === TileType.VOID) return true;
  return false;
}

function getEntityAt(state: GameState, x: number, y: number): GameEntity | undefined {
  return state.entities.find((e) => e.pos.x === x && e.pos.y === y && e.hp > 0);
}

function combat(attacker: GameEntity, defender: GameEntity, messages: string[]): boolean {
  const damage = Math.max(1, attacker.attack - defender.defense + Math.floor(Math.random() * 3) - 1);
  defender.hp -= damage;
  messages.push(`${attacker.name} hits ${defender.name} for ${damage} damage!`);

  if (defender.hp <= 0) {
    messages.push(`${defender.name} is destroyed!`);
    return true;
  }
  return false;
}

function moveEnemies(state: GameState) {
  for (const enemy of state.entities) {
    if (enemy.hp <= 0) continue;

    const dx = state.player.pos.x - enemy.pos.x;
    const dy = state.player.pos.y - enemy.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    // Only chase if within detection range
    if (dist > 8) continue;

    // Adjacent — attack
    if (dist === 1) {
      combat(enemy, state.player, state.messages);
      if (state.player.hp <= 0) {
        state.gameOver = true;
        state.messages.push("You have been consumed by the void...");
      }
      continue;
    }

    // Move toward player (simple approach)
    const moveX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
    const moveY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;

    // Try horizontal first, then vertical
    const newX = enemy.pos.x + moveX;
    const newY = enemy.pos.y + moveY;

    if (!isBlocked(state, newX, enemy.pos.y) && !getEntityAt(state, newX, enemy.pos.y)) {
      enemy.pos.x = newX;
    } else if (!isBlocked(state, enemy.pos.x, newY) && !getEntityAt(state, enemy.pos.x, newY)) {
      enemy.pos.y = newY;
    }
  }
}

export type MoveDirection = "up" | "down" | "left" | "right" | "wait";

export function processPlayerTurn(state: GameState, direction: MoveDirection): GameState {
  if (state.gameOver) return state;

  const newState = { ...state, messages: [] as string[] };
  let dx = 0;
  let dy = 0;

  switch (direction) {
    case "up": dy = -1; break;
    case "down": dy = 1; break;
    case "left": dx = -1; break;
    case "right": dx = 1; break;
    case "wait": break;
  }

  const newX = newState.player.pos.x + dx;
  const newY = newState.player.pos.y + dy;

  if (direction !== "wait") {
    // Check for enemy at target
    const enemy = getEntityAt(newState, newX, newY);
    if (enemy) {
      const killed = combat(newState.player, enemy, newState.messages);
      if (killed) {
        newState.entities = newState.entities.filter((e) => e.id !== enemy.id);
      }
    } else if (!isBlocked(newState, newX, newY)) {
      newState.player = { ...newState.player, pos: { x: newX, y: newY } };

      // Check for stairs
      if (newState.map[newY][newX] === TileType.STAIRS_DOWN) {
        newState.messages.push("You descend deeper into the void...");
        return generateFloor(newState.floor + 1, newState.player);
      }
    }
  }

  // Enemy turn
  moveEnemies(newState);

  // Update FOV
  newState.fov = computeFov(newState.map, newState.player.pos.x, newState.player.pos.y);
  // Update explored
  newState.explored = newState.explored.map((row) => [...row]);
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (newState.fov[y][x]) newState.explored[y][x] = true;
    }
  }

  newState.turnCount++;
  return newState;
}
