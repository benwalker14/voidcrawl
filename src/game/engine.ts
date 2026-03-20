import {
  GameState,
  GameEntity,
  EntityType,
  TileType,
  Position,
  MAP_WIDTH,
  MAP_HEIGHT,
  Item,
  ItemCategory,
  GroundItem,
  PlayerInventory,
  PlayerProgression,
  MAX_INVENTORY_SIZE,
  AIBehavior,
} from "./config";
import { generateDungeon } from "./generation/dungeon";
import { spawnEnemies } from "./generation/enemies";
import { computeFov } from "./generation/fov";
import { generateLootDrop } from "./data/items";
import { findPath, findFleeStep } from "./pathfinding";

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

function createInventory(): PlayerInventory {
  return { items: [], equippedWeapon: null, equippedArmor: null };
}

function xpForLevel(level: number): number {
  return 10 + level * 15;
}

function createProgression(): PlayerProgression {
  return { level: 1, xp: 0, xpToNext: xpForLevel(1) };
}

function awardXp(
  state: GameState,
  xp: number,
): void {
  state.progression.xp += xp;
  state.messages.push(`+${xp} XP`);

  while (state.progression.xp >= state.progression.xpToNext) {
    state.progression.xp -= state.progression.xpToNext;
    state.progression.level++;
    state.progression.xpToNext = xpForLevel(state.progression.level);

    // Level up bonuses: +5 maxHP, +1 ATK, +1 DEF, heal to full
    state.player.maxHp += 5;
    state.player.hp = state.player.maxHp;
    state.player.attack += 1;
    state.player.defense += 1;

    state.messages.push(
      `LEVEL UP! You are now level ${state.progression.level}! (+5 HP, +1 ATK, +1 DEF)`
    );
  }
}

export function initGame(): GameState {
  return generateFloor(1, null, null, null);
}

export function generateFloor(
  floor: number,
  prevPlayer: GameEntity | null,
  prevInventory: PlayerInventory | null,
  prevProgression: PlayerProgression | null,
): GameState {
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
    items: [],
    inventory: prevInventory ?? createInventory(),
    progression: prevProgression ?? createProgression(),
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

function combat(
  attacker: GameEntity,
  defender: GameEntity,
  messages: string[],
  attackBonus: number = 0,
  defenseBonus: number = 0,
): boolean {
  const atk = attacker.attack + attackBonus;
  const def = defender.defense + defenseBonus;
  const damage = Math.max(1, atk - def + Math.floor(Math.random() * 3) - 1);
  defender.hp -= damage;
  messages.push(`${attacker.name} hits ${defender.name} for ${damage} damage!`);

  if (defender.hp <= 0) {
    messages.push(`${defender.name} is destroyed!`);
    return true;
  }
  return false;
}

function getEquipmentBonuses(inventory: PlayerInventory): { attack: number; defense: number } {
  return {
    attack: inventory.equippedWeapon?.attack ?? 0,
    defense: inventory.equippedArmor?.defense ?? 0,
  };
}

function pickupItem(state: GameState): void {
  const groundItem = state.items.find(
    (gi) => gi.pos.x === state.player.pos.x && gi.pos.y === state.player.pos.y
  );
  if (!groundItem) return;

  const { item } = groundItem;

  // Auto-equip weapons if better or empty slot
  if (item.category === ItemCategory.WEAPON) {
    const current = state.inventory.equippedWeapon;
    if (!current || (item.attack ?? 0) > (current.attack ?? 0)) {
      if (current) {
        if (state.inventory.items.length < MAX_INVENTORY_SIZE) {
          state.inventory.items.push(current);
          state.messages.push(`Unequipped ${current.name}.`);
        } else {
          state.messages.push("Inventory full! Can't pick up item.");
          return;
        }
      }
      state.inventory.equippedWeapon = item;
      state.messages.push(`Equipped ${item.name}! (+${item.attack} ATK)`);
    } else {
      if (state.inventory.items.length >= MAX_INVENTORY_SIZE) {
        state.messages.push("Inventory full! Can't pick up item.");
        return;
      }
      state.inventory.items.push(item);
      state.messages.push(`Picked up ${item.name}.`);
    }
  }
  // Auto-equip armor if better or empty slot
  else if (item.category === ItemCategory.ARMOR) {
    const current = state.inventory.equippedArmor;
    if (!current || (item.defense ?? 0) > (current.defense ?? 0)) {
      if (current) {
        if (state.inventory.items.length < MAX_INVENTORY_SIZE) {
          state.inventory.items.push(current);
          state.messages.push(`Unequipped ${current.name}.`);
        } else {
          state.messages.push("Inventory full! Can't pick up item.");
          return;
        }
      }
      state.inventory.equippedArmor = item;
      state.messages.push(`Equipped ${item.name}! (+${item.defense} DEF)`);
    } else {
      if (state.inventory.items.length >= MAX_INVENTORY_SIZE) {
        state.messages.push("Inventory full! Can't pick up item.");
        return;
      }
      state.inventory.items.push(item);
      state.messages.push(`Picked up ${item.name}.`);
    }
  }
  // Potions go to inventory
  else {
    if (state.inventory.items.length >= MAX_INVENTORY_SIZE) {
      state.messages.push("Inventory full! Can't pick up item.");
      return;
    }
    state.inventory.items.push(item);
    state.messages.push(`Picked up ${item.name}.`);
  }

  // Remove from ground
  state.items = state.items.filter((gi) => gi !== groundItem);
}

export function applyInventoryItem(state: GameState, index: number): GameState {
  if (index < 0 || index >= state.inventory.items.length) return state;

  const newState = { ...state, messages: [] as string[], inventory: { ...state.inventory, items: [...state.inventory.items] } };
  const item = newState.inventory.items[index];

  if (item.category === ItemCategory.POTION) {
    if (newState.player.hp >= newState.player.maxHp) {
      newState.messages.push("You're already at full health.");
      return newState;
    }
    const healed = Math.min(item.healAmount ?? 0, newState.player.maxHp - newState.player.hp);
    newState.player = { ...newState.player, hp: newState.player.hp + healed };
    newState.inventory.items.splice(index, 1);
    newState.messages.push(`Used ${item.name}. Restored ${healed} HP.`);
  } else if (item.category === ItemCategory.WEAPON) {
    const old = newState.inventory.equippedWeapon;
    newState.inventory.equippedWeapon = item;
    newState.inventory.items.splice(index, 1);
    if (old) newState.inventory.items.push(old);
    newState.messages.push(`Equipped ${item.name}! (+${item.attack} ATK)`);
  } else if (item.category === ItemCategory.ARMOR) {
    const old = newState.inventory.equippedArmor;
    newState.inventory.equippedArmor = item;
    newState.inventory.items.splice(index, 1);
    if (old) newState.inventory.items.push(old);
    newState.messages.push(`Equipped ${item.name}! (+${item.defense} DEF)`);
  }

  return newState;
}

function getBlockedPositions(state: GameState, excludeId: string): Set<string> {
  const blocked = new Set<string>();
  for (const e of state.entities) {
    if (e.hp > 0 && e.id !== excludeId) {
      blocked.add(`${e.pos.x},${e.pos.y}`);
    }
  }
  // Player position is a valid target (for adjacent attacks) but not walkable
  blocked.add(`${state.player.pos.x},${state.player.pos.y}`);
  return blocked;
}

function wanderStep(
  map: TileType[][],
  from: Position,
  blocked: Set<string>,
): Position | null {
  const dirs = [
    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
  ];
  // Shuffle directions
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }
  for (const dir of dirs) {
    const nx = from.x + dir.x;
    const ny = from.y + dir.y;
    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
    const tile = map[ny][nx];
    if (tile === TileType.WALL || tile === TileType.VOID) continue;
    if (blocked.has(`${nx},${ny}`)) continue;
    return { x: nx, y: ny };
  }
  return null;
}

function moveEnemies(state: GameState, playerDefenseBonus: number = 0) {
  for (const enemy of state.entities) {
    if (enemy.hp <= 0) continue;

    const dx = state.player.pos.x - enemy.pos.x;
    const dy = state.player.pos.y - enemy.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const detectRange = enemy.detectRange ?? 8;
    const behavior = enemy.behavior ?? AIBehavior.CHASE;

    // Adjacent — always attack regardless of behavior
    if (dist === 1) {
      combat(enemy, state.player, state.messages, 0, playerDefenseBonus);
      if (state.player.hp <= 0) {
        state.gameOver = true;
        state.messages.push("You have been consumed by the void...");
      }
      continue;
    }

    const blocked = getBlockedPositions(state, enemy.id);

    switch (behavior) {
      case AIBehavior.CHASE: {
        if (dist > detectRange) continue;
        const step = findPath(state.map, enemy.pos, state.player.pos, blocked);
        if (step) {
          enemy.pos.x = step.x;
          enemy.pos.y = step.y;
        }
        break;
      }

      case AIBehavior.WANDER: {
        if (dist <= detectRange) {
          // Player spotted — chase with pathfinding
          const step = findPath(state.map, enemy.pos, state.player.pos, blocked);
          if (step) {
            enemy.pos.x = step.x;
            enemy.pos.y = step.y;
          }
        } else {
          // Wander randomly (30% chance to move each turn)
          if (Math.random() < 0.3) {
            const step = wanderStep(state.map, enemy.pos, blocked);
            if (step) {
              enemy.pos.x = step.x;
              enemy.pos.y = step.y;
            }
          }
        }
        break;
      }

      case AIBehavior.AMBUSH: {
        // Stay still until player is close, then aggressively pursue
        if (dist > detectRange) continue;
        const step = findPath(state.map, enemy.pos, state.player.pos, blocked);
        if (step) {
          enemy.pos.x = step.x;
          enemy.pos.y = step.y;
        }
        break;
      }

      case AIBehavior.COWARD: {
        if (dist > detectRange) continue;
        // Flee when below 40% HP
        if (enemy.hp < enemy.maxHp * 0.4) {
          const step = findFleeStep(state.map, enemy.pos, state.player.pos, blocked);
          if (step) {
            enemy.pos.x = step.x;
            enemy.pos.y = step.y;
          }
        } else {
          // Otherwise chase normally
          const step = findPath(state.map, enemy.pos, state.player.pos, blocked);
          if (step) {
            enemy.pos.x = step.x;
            enemy.pos.y = step.y;
          }
        }
        break;
      }
    }
  }
}

export type MoveDirection = "up" | "down" | "left" | "right" | "wait";

export function processPlayerTurn(state: GameState, direction: MoveDirection): GameState {
  if (state.gameOver) return state;

  const newState = {
    ...state,
    messages: [] as string[],
    items: [...state.items],
    inventory: {
      ...state.inventory,
      items: [...state.inventory.items],
    },
    progression: { ...state.progression },
  };
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
  const bonuses = getEquipmentBonuses(newState.inventory);

  if (direction !== "wait") {
    // Check for enemy at target
    const enemy = getEntityAt(newState, newX, newY);
    if (enemy) {
      const killed = combat(newState.player, enemy, newState.messages, bonuses.attack, 0);
      if (killed) {
        // Award XP
        awardXp(newState, enemy.xpReward ?? 5);
        // Try to drop loot at enemy position
        const loot = generateLootDrop(newState.floor, enemy.pos);
        if (loot) {
          newState.items.push(loot);
          newState.messages.push(`${enemy.name} dropped ${loot.item.name}!`);
        }
        newState.entities = newState.entities.filter((e) => e.id !== enemy.id);
      }
    } else if (!isBlocked(newState, newX, newY)) {
      newState.player = { ...newState.player, pos: { x: newX, y: newY } };

      // Check for item pickup
      pickupItem(newState);

      // Check for stairs
      if (newState.map[newY][newX] === TileType.STAIRS_DOWN) {
        newState.messages.push("You descend deeper into the void...");
        return generateFloor(newState.floor + 1, newState.player, newState.inventory, newState.progression);
      }
    }
  }

  // Enemy turn
  moveEnemies(newState, bonuses.defense);

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
