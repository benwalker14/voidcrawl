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
  MAX_INVENTORY_SIZE,
} from "./config";
import { generateDungeon } from "./generation/dungeon";
import { spawnEnemies } from "./generation/enemies";
import { computeFov } from "./generation/fov";
import { generateLootDrop } from "./data/items";

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

export function initGame(): GameState {
  return generateFloor(1, null, null);
}

export function generateFloor(
  floor: number,
  prevPlayer: GameEntity | null,
  prevInventory: PlayerInventory | null,
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

function moveEnemies(state: GameState, playerDefenseBonus: number = 0) {
  for (const enemy of state.entities) {
    if (enemy.hp <= 0) continue;

    const dx = state.player.pos.x - enemy.pos.x;
    const dy = state.player.pos.y - enemy.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    // Only chase if within detection range
    if (dist > 8) continue;

    // Adjacent — attack
    if (dist === 1) {
      combat(enemy, state.player, state.messages, 0, playerDefenseBonus);
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

  const newState = {
    ...state,
    messages: [] as string[],
    items: [...state.items],
    inventory: {
      ...state.inventory,
      items: [...state.inventory.items],
    },
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
        return generateFloor(newState.floor + 1, newState.player, newState.inventory);
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
