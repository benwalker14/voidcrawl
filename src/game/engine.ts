import {
  GameState,
  GameEntity,
  GameMessage,
  EntityType,
  TileType,
  Position,
  MAP_WIDTH,
  MAP_HEIGHT,
  Item,
  ItemCategory,
  ConsumableEffect,
  StatusEffect,
  StatusEffectType,
  GroundItem,
  PlayerInventory,
  PlayerProgression,
  RunStats,
  FloatingText,
  MAX_INVENTORY_SIZE,
  AIBehavior,
  SpecialAbility,
  MSG_COLORS,
} from "./config";
import { generateDungeon } from "./generation/dungeon";
import { spawnEnemies, spawnBoss, spawnBossAdd } from "./generation/enemies";
import { computeFov } from "./generation/fov";
import { generateLootDrop, generateBossLoot } from "./data/items";
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
  state.messages.push({ text: `+${xp} XP`, color: MSG_COLORS.XP });

  while (state.progression.xp >= state.progression.xpToNext) {
    state.progression.xp -= state.progression.xpToNext;
    state.progression.level++;
    state.progression.xpToNext = xpForLevel(state.progression.level);

    // Level up bonuses: +5 maxHP, +1 ATK, +1 DEF, heal to full
    state.player.maxHp += 5;
    state.player.hp = state.player.maxHp;
    state.player.attack += 1;
    state.player.defense += 1;

    state.messages.push({
      text: `LEVEL UP! You are now level ${state.progression.level}! (+5 HP, +1 ATK, +1 DEF)`,
      color: MSG_COLORS.LEVEL_UP,
    });
    state.pendingFloatingTexts.push({
      text: "LEVEL UP!",
      color: MSG_COLORS.LEVEL_UP,
      x: state.player.pos.x,
      y: state.player.pos.y,
    });
  }
}

function createRunStats(): RunStats {
  return {
    enemiesKilled: 0,
    itemsFound: 0,
    damageDealt: 0,
    damageTaken: 0,
    deepestFloor: 1,
    startTime: Date.now(),
  };
}

export function initGame(): GameState {
  return generateFloor(1, null, null, null, null);
}

export function generateFloor(
  floor: number,
  prevPlayer: GameEntity | null,
  prevInventory: PlayerInventory | null,
  prevProgression: PlayerProgression | null,
  prevRunStats: RunStats | null,
  prevStatusEffects: StatusEffect[] | null = null,
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

  const isBossFloor = floor === 5;
  const enemies = isBossFloor
    ? [spawnBoss(floor, dungeon.map)]
    : spawnEnemies(floor, floorTiles);
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

  const runStats = prevRunStats
    ? { ...prevRunStats, deepestFloor: Math.max(prevRunStats.deepestFloor, floor) }
    : createRunStats();

  return {
    floor,
    map: dungeon.map,
    player,
    entities: enemies,
    items: [],
    inventory: prevInventory ?? createInventory(),
    progression: prevProgression ?? createProgression(),
    messages: isBossFloor
      ? [
          { text: `You descend to floor ${floor} of the void.`, color: MSG_COLORS.INFO },
          { text: "The air crackles with energy. A massive Void Nucleus pulses at the far end of the chamber!", color: MSG_COLORS.WARNING },
        ]
      : [{ text: `You descend to floor ${floor} of the void.`, color: MSG_COLORS.INFO }],
    turnCount: 0,
    gameOver: false,
    fov,
    explored,
    runStats,
    statusEffects: prevStatusEffects ?? [],
    pendingFloatingTexts: [],
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
  messages: GameMessage[],
  attackBonus: number = 0,
  defenseBonus: number = 0,
  floatingTexts?: FloatingText[],
): { killed: boolean; damage: number; dodged: boolean } {
  const isPlayerAttacking = attacker.type === EntityType.PLAYER;

  // PHASE ability: 30% dodge chance
  if (defender.specialAbility === SpecialAbility.PHASE && Math.random() < 0.3) {
    messages.push({
      text: `${defender.name} phases out of existence! Attack passes through!`,
      color: isPlayerAttacking ? MSG_COLORS.WARNING : MSG_COLORS.INFO,
    });
    if (floatingTexts) {
      floatingTexts.push({ text: "DODGE", color: "#a78bfa", x: defender.pos.x, y: defender.pos.y });
    }
    return { killed: false, damage: 0, dodged: true };
  }

  const atk = attacker.attack + attackBonus;
  let def = defender.defense + defenseBonus;

  // ARMORED ability: +1 effective defense (reduces damage by 1)
  if (defender.specialAbility === SpecialAbility.ARMORED) {
    def += 1;
  }

  // ETHEREAL ability: only vulnerable on floor tiles (invulnerable on wall/void)
  // This is checked by the caller who has access to the map — handled in processPlayerTurn

  const damage = Math.max(1, atk - def + Math.floor(Math.random() * 3) - 1);
  defender.hp -= damage;
  messages.push({
    text: `${attacker.name} hits ${defender.name} for ${damage} damage!`,
    color: isPlayerAttacking ? MSG_COLORS.PLAYER_ATK : MSG_COLORS.ENEMY_ATK,
  });

  // LIFE_DRAIN ability: attacker heals 50% of damage dealt
  if (attacker.specialAbility === SpecialAbility.LIFE_DRAIN) {
    const healAmount = Math.max(1, Math.floor(damage * 0.5));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
    messages.push({
      text: `${attacker.name} drains ${healAmount} life!`,
      color: MSG_COLORS.ENEMY_ATK,
    });
    if (floatingTexts) {
      floatingTexts.push({ text: `+${healAmount}`, color: "#6d28d9", x: attacker.pos.x, y: attacker.pos.y });
    }
  }

  if (defender.hp <= 0) {
    messages.push({
      text: `${defender.name} is destroyed!`,
      color: MSG_COLORS.KILL,
    });
    return { killed: true, damage, dodged: false };
  }
  return { killed: false, damage, dodged: false };
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
          state.messages.push({ text: `Unequipped ${current.name}.`, color: MSG_COLORS.EQUIP });
        } else {
          state.messages.push({ text: "Inventory full! Can't pick up item.", color: MSG_COLORS.WARNING });
          return;
        }
      }
      state.inventory.equippedWeapon = item;
      state.messages.push({ text: `Equipped ${item.name}! (+${item.attack} ATK)`, color: MSG_COLORS.EQUIP });
    } else {
      if (state.inventory.items.length >= MAX_INVENTORY_SIZE) {
        state.messages.push({ text: "Inventory full! Can't pick up item.", color: MSG_COLORS.WARNING });
        return;
      }
      state.inventory.items.push(item);
      state.messages.push({ text: `Picked up ${item.name}.`, color: MSG_COLORS.LOOT });
    }
  }
  // Auto-equip armor if better or empty slot
  else if (item.category === ItemCategory.ARMOR) {
    const current = state.inventory.equippedArmor;
    if (!current || (item.defense ?? 0) > (current.defense ?? 0)) {
      if (current) {
        if (state.inventory.items.length < MAX_INVENTORY_SIZE) {
          state.inventory.items.push(current);
          state.messages.push({ text: `Unequipped ${current.name}.`, color: MSG_COLORS.EQUIP });
        } else {
          state.messages.push({ text: "Inventory full! Can't pick up item.", color: MSG_COLORS.WARNING });
          return;
        }
      }
      state.inventory.equippedArmor = item;
      state.messages.push({ text: `Equipped ${item.name}! (+${item.defense} DEF)`, color: MSG_COLORS.EQUIP });
    } else {
      if (state.inventory.items.length >= MAX_INVENTORY_SIZE) {
        state.messages.push({ text: "Inventory full! Can't pick up item.", color: MSG_COLORS.WARNING });
        return;
      }
      state.inventory.items.push(item);
      state.messages.push({ text: `Picked up ${item.name}.`, color: MSG_COLORS.LOOT });
    }
  }
  // Potions and scrolls go to inventory
  else {
    if (state.inventory.items.length >= MAX_INVENTORY_SIZE) {
      state.messages.push({ text: "Inventory full! Can't pick up item.", color: MSG_COLORS.WARNING });
      return;
    }
    state.inventory.items.push(item);
    state.messages.push({ text: `Picked up ${item.name}.`, color: MSG_COLORS.LOOT });
  }

  // Remove from ground and track the pickup
  state.items = state.items.filter((gi) => gi !== groundItem);
  state.runStats.itemsFound++;
}

function hasStatusEffect(state: GameState, type: StatusEffectType): boolean {
  return state.statusEffects.some((e) => e.type === type);
}

function addStatusEffect(state: GameState, type: StatusEffectType, turns: number, value: number = 0): void {
  // Refresh duration if already active
  const existing = state.statusEffects.find((e) => e.type === type);
  if (existing) {
    existing.turnsRemaining = Math.max(existing.turnsRemaining, turns);
    if (value) existing.value = value;
  } else {
    state.statusEffects.push({ type, turnsRemaining: turns, value });
  }
}

function getRandomFloorTile(state: GameState): Position | null {
  const tiles: Position[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (state.map[y][x] !== TileType.FLOOR) continue;
      if (x === state.player.pos.x && y === state.player.pos.y) continue;
      // Avoid occupied tiles
      if (state.entities.some((e) => e.hp > 0 && e.pos.x === x && e.pos.y === y)) continue;
      tiles.push({ x, y });
    }
  }
  if (tiles.length === 0) return null;
  return tiles[Math.floor(Math.random() * tiles.length)];
}

let nextSummonId = 0;

function applyConsumableEffect(state: GameState, item: Item): boolean {
  const effect = item.effect ?? ConsumableEffect.HEAL;

  switch (effect) {
    case ConsumableEffect.HEAL: {
      if (state.player.hp >= state.player.maxHp) {
        state.messages.push({ text: "You're already at full health.", color: MSG_COLORS.WARNING });
        return false;
      }
      const healed = Math.min(item.healAmount ?? 0, state.player.maxHp - state.player.hp);
      state.player = { ...state.player, hp: state.player.hp + healed };
      state.messages.push({ text: `Used ${item.name}. Restored ${healed} HP.`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: `+${healed} HP`, color: MSG_COLORS.HEAL, x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.HASTE: {
      const turns = item.effectValue ?? 8;
      addStatusEffect(state, StatusEffectType.HASTE, turns);
      state.messages.push({ text: `Used ${item.name}. You feel incredibly fast! (${turns} turns)`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: "HASTE", color: "#22c55e", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.INVISIBILITY: {
      const turns = item.effectValue ?? 10;
      addStatusEffect(state, StatusEffectType.INVISIBLE, turns);
      state.messages.push({ text: `Used ${item.name}. You fade from sight! (${turns} turns)`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: "INVISIBLE", color: "#a78bfa", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.TELEPORT: {
      const dest = getRandomFloorTile(state);
      if (!dest) {
        state.messages.push({ text: "The potion fizzles... nowhere to teleport.", color: MSG_COLORS.WARNING });
        return false;
      }
      state.player = { ...state.player, pos: { ...dest } };
      state.messages.push({ text: `Used ${item.name}. You teleport to a new location!`, color: MSG_COLORS.INFO });
      state.pendingFloatingTexts.push({ text: "TELEPORT", color: "#06b6d4", x: dest.x, y: dest.y });
      // Update FOV immediately
      state.fov = computeFov(state.map, state.player.pos.x, state.player.pos.y);
      state.explored = state.explored.map((row) => [...row]);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          if (state.fov[y][x]) state.explored[y][x] = true;
        }
      }
      return true;
    }

    case ConsumableEffect.FIRE: {
      const damage = item.effectValue ?? 8;
      let hitCount = 0;
      for (const enemy of state.entities) {
        if (enemy.hp <= 0 || enemy.friendly) continue;
        const dist = Math.abs(enemy.pos.x - state.player.pos.x) + Math.abs(enemy.pos.y - state.player.pos.y);
        if (dist <= 2) {
          enemy.hp -= damage;
          hitCount++;
          state.pendingFloatingTexts.push({ text: `-${damage}`, color: "#f97316", x: enemy.pos.x, y: enemy.pos.y });
          if (enemy.hp <= 0) {
            state.messages.push({ text: `${enemy.name} is incinerated!`, color: MSG_COLORS.KILL });
            spawnSplitSlimes(state, enemy);
            state.runStats.enemiesKilled++;
            awardXp(state, enemy.xpReward ?? 5);
          }
        }
      }
      state.entities = state.entities.filter((e) => e.hp > 0 || e.friendly);
      state.runStats.damageDealt += damage * hitCount;
      state.messages.push({ text: `Used ${item.name}. Flames engulf ${hitCount} nearby ${hitCount === 1 ? "enemy" : "enemies"}!`, color: MSG_COLORS.PLAYER_ATK });
      state.pendingFloatingTexts.push({ text: "FIRE", color: "#f97316", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.POISON: {
      const turns = item.effectValue ?? 5;
      let hitCount = 0;
      for (const enemy of state.entities) {
        if (enemy.hp <= 0 || enemy.friendly) continue;
        const dist = Math.abs(enemy.pos.x - state.player.pos.x) + Math.abs(enemy.pos.y - state.player.pos.y);
        if (dist <= 2) {
          enemy.poisonTurns = Math.max(enemy.poisonTurns ?? 0, turns);
          hitCount++;
          state.pendingFloatingTexts.push({ text: "POISON", color: "#22c55e", x: enemy.pos.x, y: enemy.pos.y });
        }
      }
      state.messages.push({ text: `Used ${item.name}. Poisoned ${hitCount} nearby ${hitCount === 1 ? "enemy" : "enemies"} for ${turns} turns!`, color: MSG_COLORS.HEAL });
      return true;
    }

    case ConsumableEffect.STRENGTH: {
      const turns = item.effectValue ?? 10;
      addStatusEffect(state, StatusEffectType.STRENGTH, turns, 3);
      state.messages.push({ text: `Used ${item.name}. Your attacks grow powerful! (+3 ATK for ${turns} turns)`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: "+3 ATK", color: "#f97316", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.MAGIC_MAPPING: {
      state.explored = state.explored.map((row) => [...row]);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          if (state.map[y][x] !== TileType.VOID) {
            state.explored[y][x] = true;
          }
        }
      }
      state.messages.push({ text: `Used ${item.name}. The entire floor is revealed!`, color: MSG_COLORS.INFO });
      state.pendingFloatingTexts.push({ text: "MAPPED", color: "#06b6d4", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.ENCHANT: {
      const bonus = item.effectValue ?? 2;
      const weapon = state.inventory.equippedWeapon;
      const armor = state.inventory.equippedArmor;
      if (weapon && armor) {
        // Enchant whichever has lower stats
        if ((weapon.attack ?? 0) <= (armor.defense ?? 0)) {
          state.inventory.equippedWeapon = { ...weapon, attack: (weapon.attack ?? 0) + bonus };
          state.messages.push({ text: `Used ${item.name}. ${weapon.name} glows with power! (+${bonus} ATK)`, color: MSG_COLORS.EQUIP });
        } else {
          state.inventory.equippedArmor = { ...armor, defense: (armor.defense ?? 0) + bonus };
          state.messages.push({ text: `Used ${item.name}. ${armor.name} hardens! (+${bonus} DEF)`, color: MSG_COLORS.EQUIP });
        }
      } else if (weapon) {
        state.inventory.equippedWeapon = { ...weapon, attack: (weapon.attack ?? 0) + bonus };
        state.messages.push({ text: `Used ${item.name}. ${weapon.name} glows with power! (+${bonus} ATK)`, color: MSG_COLORS.EQUIP });
      } else if (armor) {
        state.inventory.equippedArmor = { ...armor, defense: (armor.defense ?? 0) + bonus };
        state.messages.push({ text: `Used ${item.name}. ${armor.name} hardens! (+${bonus} DEF)`, color: MSG_COLORS.EQUIP });
      } else {
        state.messages.push({ text: "You have nothing equipped to enchant.", color: MSG_COLORS.WARNING });
        return false;
      }
      state.pendingFloatingTexts.push({ text: "ENCHANTED", color: "#3b82f6", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.FEAR: {
      const turns = item.effectValue ?? 6;
      let hitCount = 0;
      for (const enemy of state.entities) {
        if (enemy.hp <= 0 || enemy.friendly) continue;
        if (state.fov[enemy.pos.y]?.[enemy.pos.x]) {
          enemy.fearTurns = Math.max(enemy.fearTurns ?? 0, turns);
          hitCount++;
        }
      }
      state.messages.push({ text: `Used ${item.name}. ${hitCount} ${hitCount === 1 ? "enemy flees" : "enemies flee"} in terror!`, color: MSG_COLORS.INFO });
      state.pendingFloatingTexts.push({ text: "FEAR", color: "#eab308", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.SUMMON: {
      const turns = item.effectValue ?? 15;
      // Find an adjacent floor tile for the summon
      const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
      let spawnPos: Position | null = null;
      for (const d of dirs) {
        const nx = state.player.pos.x + d.x;
        const ny = state.player.pos.y + d.y;
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
        if (state.map[ny][nx] === TileType.WALL || state.map[ny][nx] === TileType.VOID) continue;
        if (state.entities.some((e) => e.hp > 0 && e.pos.x === nx && e.pos.y === ny)) continue;
        spawnPos = { x: nx, y: ny };
        break;
      }
      if (!spawnPos) {
        spawnPos = getRandomFloorTile(state);
      }
      if (!spawnPos) {
        state.messages.push({ text: "The scroll fizzles... no room for a summon.", color: MSG_COLORS.WARNING });
        return false;
      }
      const summon: GameEntity = {
        id: `summon_${nextSummonId++}`,
        type: EntityType.ENEMY, // reuse enemy rendering
        pos: { ...spawnPos },
        name: "Void Spirit",
        hp: 20,
        maxHp: 20,
        attack: state.player.attack,
        defense: 2,
        color: "#06b6d4",
        symbol: "s",
        behavior: AIBehavior.CHASE,
        detectRange: 10,
        friendly: true,
        summonTurns: turns,
      };
      state.entities.push(summon);
      state.messages.push({ text: `Used ${item.name}. A Void Spirit materializes to fight for you! (${turns} turns)`, color: MSG_COLORS.LOOT });
      state.pendingFloatingTexts.push({ text: "SUMMONED", color: "#06b6d4", x: spawnPos.x, y: spawnPos.y });
      return true;
    }

    default:
      return false;
  }
}

export function applyInventoryItem(state: GameState, index: number): GameState {
  if (index < 0 || index >= state.inventory.items.length) return state;

  const newState = {
    ...state,
    messages: [] as GameMessage[],
    inventory: { ...state.inventory, items: [...state.inventory.items] },
    statusEffects: [...state.statusEffects],
    pendingFloatingTexts: [] as FloatingText[],
  };
  const item = newState.inventory.items[index];

  if (item.category === ItemCategory.POTION || item.category === ItemCategory.SCROLL) {
    const consumed = applyConsumableEffect(newState, item);
    if (consumed) {
      newState.inventory.items.splice(index, 1);
    }
  } else if (item.category === ItemCategory.WEAPON) {
    const old = newState.inventory.equippedWeapon;
    newState.inventory.equippedWeapon = item;
    newState.inventory.items.splice(index, 1);
    if (old) newState.inventory.items.push(old);
    newState.messages.push({ text: `Equipped ${item.name}! (+${item.attack} ATK)`, color: MSG_COLORS.EQUIP });
  } else if (item.category === ItemCategory.ARMOR) {
    const old = newState.inventory.equippedArmor;
    newState.inventory.equippedArmor = item;
    newState.inventory.items.splice(index, 1);
    if (old) newState.inventory.items.push(old);
    newState.messages.push({ text: `Equipped ${item.name}! (+${item.defense} DEF)`, color: MSG_COLORS.EQUIP });
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

// Boss AI constants
const BOSS_SPAWN_INTERVAL = 4;    // Turns between add spawns during spawn phase
const BOSS_SPAWN_PHASE_TURNS = 8; // How long the spawn phase lasts
const BOSS_PAUSE_TURNS = 5;       // How long the vulnerable/pause phase lasts
const BOSS_ADDS_PER_WAVE = 2;     // Number of adds spawned per wave
const BOSS_TELEGRAPH_DAMAGE = 6;  // Damage dealt by the telegraphed AoE attack

function processBossAI(state: GameState): void {
  for (const boss of state.entities) {
    if (!boss.isBoss || boss.hp <= 0 || boss.specialAbility !== SpecialAbility.BOSS_NUCLEUS) continue;

    boss.bossTurnCounter = (boss.bossTurnCounter ?? 0) + 1;

    if (boss.bossPhase === 0) {
      // SPAWN PHASE: summon adds periodically

      // Spawn adds every BOSS_SPAWN_INTERVAL turns
      if ((boss.bossTurnCounter ?? 0) % BOSS_SPAWN_INTERVAL === 0) {
        let spawned = 0;
        for (let i = 0; i < BOSS_ADDS_PER_WAVE; i++) {
          const spawnPos = getRandomFloorTileNearBoss(state, boss.pos);
          if (spawnPos) {
            state.entities.push(spawnBossAdd(state.floor, spawnPos));
            state.pendingFloatingTexts.push({ text: "SPAWN", color: "#67e8f9", x: spawnPos.x, y: spawnPos.y });
            spawned++;
          }
        }
        if (spawned > 0) {
          state.messages.push({ text: `The Void Nucleus shudders and spawns ${spawned} Void Fragment${spawned > 1 ? "s" : ""}!`, color: MSG_COLORS.WARNING });
        }
      }

      // Telegraph AoE attack 1 turn before phase transition
      if ((boss.bossTurnCounter ?? 0) === BOSS_SPAWN_PHASE_TURNS - 1 && !boss.bossTelegraphed) {
        boss.bossTelegraphed = true;
        state.messages.push({ text: "The Void Nucleus gathers energy... a massive discharge is imminent!", color: MSG_COLORS.DEATH });
        state.pendingFloatingTexts.push({ text: "CHARGING!", color: "#ef4444", x: boss.pos.x, y: boss.pos.y });
      }

      // Transition to pause phase after BOSS_SPAWN_PHASE_TURNS
      if ((boss.bossTurnCounter ?? 0) >= BOSS_SPAWN_PHASE_TURNS) {
        // Execute the telegraphed AoE attack
        const px = state.player.pos.x;
        const py = state.player.pos.y;
        const distToPlayer = Math.abs(px - boss.pos.x) + Math.abs(py - boss.pos.y);
        if (distToPlayer <= 3) {
          const dmg = BOSS_TELEGRAPH_DAMAGE;
          state.player = { ...state.player, hp: state.player.hp - dmg };
          state.runStats.damageTaken += dmg;
          state.messages.push({ text: `The Void Nucleus discharges! You take ${dmg} damage!`, color: MSG_COLORS.ENEMY_ATK });
          state.pendingFloatingTexts.push({ text: `-${dmg}`, color: MSG_COLORS.ENEMY_ATK, x: px, y: py });
          if (state.player.hp <= 0) {
            state.gameOver = true;
            state.messages.push({ text: "You have been consumed by the void...", color: MSG_COLORS.DEATH });
          }
        } else {
          state.messages.push({ text: "The Void Nucleus discharges a wave of energy! You dodge it at range!", color: MSG_COLORS.INFO });
        }

        boss.bossPhase = 1;
        boss.bossTurnCounter = 0;
        boss.bossTelegraphed = false;
        state.messages.push({ text: "The Void Nucleus dims... it's vulnerable! Strike now!", color: MSG_COLORS.HEAL });
        state.pendingFloatingTexts.push({ text: "VULNERABLE", color: "#22c55e", x: boss.pos.x, y: boss.pos.y });
      }
    } else if (boss.bossPhase === 1) {
      // PAUSE PHASE: boss is vulnerable, no spawns

      // Transition back to spawn phase after BOSS_PAUSE_TURNS
      if ((boss.bossTurnCounter ?? 0) >= BOSS_PAUSE_TURNS) {
        boss.bossPhase = 0;
        boss.bossTurnCounter = 0;
        state.messages.push({ text: "The Void Nucleus pulses with renewed energy! It begins spawning again!", color: MSG_COLORS.WARNING });
        state.pendingFloatingTexts.push({ text: "ACTIVE", color: "#ef4444", x: boss.pos.x, y: boss.pos.y });
      }
    }
  }
}

function getRandomFloorTileNearBoss(state: GameState, bossPos: Position): Position | null {
  const tiles: Position[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (state.map[y][x] !== TileType.FLOOR) continue;
      const dist = Math.abs(x - bossPos.x) + Math.abs(y - bossPos.y);
      if (dist < 2 || dist > 6) continue; // Spawn near boss but not on top of it
      if (x === state.player.pos.x && y === state.player.pos.y) continue;
      if (state.entities.some((e) => e.hp > 0 && e.pos.x === x && e.pos.y === y)) continue;
      tiles.push({ x, y });
    }
  }
  if (tiles.length === 0) return null;
  return tiles[Math.floor(Math.random() * tiles.length)];
}

function moveEnemies(state: GameState, playerDefenseBonus: number = 0) {
  const isInvisible = hasStatusEffect(state, StatusEffectType.INVISIBLE);

  for (const enemy of state.entities) {
    if (enemy.hp <= 0 || enemy.friendly) continue;

    // Boss is stationary — handled by processBossAI
    if (enemy.isBoss) continue;

    const dx = state.player.pos.x - enemy.pos.x;
    const dy = state.player.pos.y - enemy.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const detectRange = enemy.detectRange ?? 8;
    const behavior = enemy.behavior ?? AIBehavior.CHASE;

    // If enemy is feared, override behavior to flee
    if (enemy.fearTurns && enemy.fearTurns > 0) {
      const blocked = getBlockedPositions(state, enemy.id);
      const step = findFleeStep(state.map, enemy.pos, state.player.pos, blocked);
      if (step) {
        enemy.pos.x = step.x;
        enemy.pos.y = step.y;
      }
      continue;
    }

    // Invisible — enemies can't detect or attack player (unless already adjacent and bumping)
    if (isInvisible) {
      // Wander randomly instead
      const blocked = getBlockedPositions(state, enemy.id);
      if (Math.random() < 0.3) {
        const step = wanderStep(state.map, enemy.pos, blocked);
        if (step) {
          enemy.pos.x = step.x;
          enemy.pos.y = step.y;
        }
      }
      continue;
    }

    // Adjacent — always attack regardless of behavior
    if (dist === 1) {
      const result = combat(enemy, state.player, state.messages, 0, playerDefenseBonus, state.pendingFloatingTexts);
      state.runStats.damageTaken += result.damage;
      if (!result.dodged) {
        state.pendingFloatingTexts.push({
          text: `-${result.damage}`,
          color: MSG_COLORS.ENEMY_ATK,
          x: state.player.pos.x,
          y: state.player.pos.y,
        });
      }
      if (state.player.hp <= 0) {
        state.gameOver = true;
        state.messages.push({ text: "You have been consumed by the void...", color: MSG_COLORS.DEATH });
      }
      continue;
    }

    const blocked = getBlockedPositions(state, enemy.id);

    // HOWL: Abyssal Hound alerts all other hounds when it first spots the player
    if (enemy.specialAbility === SpecialAbility.HOWL && !enemy.howled && dist <= detectRange) {
      enemy.howled = true;
      let alerted = 0;
      for (const other of state.entities) {
        if (other.id === enemy.id || other.hp <= 0 || other.friendly) continue;
        if (other.specialAbility === SpecialAbility.HOWL && !other.howled) {
          other.howled = true;
          other.detectRange = 50; // Alert: detect from anywhere
          alerted++;
        }
      }
      if (alerted > 0) {
        state.messages.push({ text: `${enemy.name} howls! ${alerted} other ${alerted === 1 ? "hound answers" : "hounds answer"}!`, color: MSG_COLORS.WARNING });
        state.pendingFloatingTexts.push({ text: "HOWL!", color: "#c084fc", x: enemy.pos.x, y: enemy.pos.y });
      }
    }

    // ETHEREAL: Rift Wraith moves through walls toward the player
    if (enemy.specialAbility === SpecialAbility.ETHEREAL && dist <= detectRange) {
      // Move directly toward player, ignoring walls
      const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
      const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
      // Try primary axis (larger delta), then secondary
      const candidates: Position[] = [];
      if (Math.abs(dx) >= Math.abs(dy)) {
        candidates.push({ x: enemy.pos.x + stepX, y: enemy.pos.y });
        if (stepY !== 0) candidates.push({ x: enemy.pos.x, y: enemy.pos.y + stepY });
      } else {
        candidates.push({ x: enemy.pos.x, y: enemy.pos.y + stepY });
        if (stepX !== 0) candidates.push({ x: enemy.pos.x + stepX, y: enemy.pos.y });
      }
      let moved = false;
      for (const c of candidates) {
        if (c.x < 0 || c.x >= MAP_WIDTH || c.y < 0 || c.y >= MAP_HEIGHT) continue;
        if (blocked.has(`${c.x},${c.y}`)) continue;
        enemy.pos.x = c.x;
        enemy.pos.y = c.y;
        moved = true;
        break;
      }
      if (!moved) {
        // Fallback to normal pathfinding
        const step = findPath(state.map, enemy.pos, state.player.pos, blocked);
        if (step) {
          enemy.pos.x = step.x;
          enemy.pos.y = step.y;
        }
      }
      continue;
    }

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

function moveFriendlies(state: GameState) {
  for (const ally of state.entities) {
    if (!ally.friendly || ally.hp <= 0) continue;

    // Find nearest enemy
    let nearestEnemy: GameEntity | null = null;
    let nearestDist = Infinity;
    for (const enemy of state.entities) {
      if (enemy.hp <= 0 || enemy.friendly) continue;
      const d = Math.abs(enemy.pos.x - ally.pos.x) + Math.abs(enemy.pos.y - ally.pos.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = enemy;
      }
    }

    if (!nearestEnemy) continue;

    // Adjacent to enemy — attack
    if (nearestDist === 1) {
      const result = combat(ally, nearestEnemy, state.messages, 0, 0, state.pendingFloatingTexts);
      state.runStats.damageDealt += result.damage;
      if (!result.dodged) {
        state.pendingFloatingTexts.push({ text: `-${result.damage}`, color: "#06b6d4", x: nearestEnemy.pos.x, y: nearestEnemy.pos.y });
      }
      if (result.killed) {
        spawnSplitSlimes(state, nearestEnemy);
        state.runStats.enemiesKilled++;
        awardXp(state, nearestEnemy.xpReward ?? 5);
        const loot = generateLootDrop(state.floor, nearestEnemy.pos);
        if (loot) {
          state.items.push(loot);
          state.messages.push({ text: `${nearestEnemy.name} dropped ${loot.item.name}!`, color: MSG_COLORS.LOOT });
        }
        state.entities = state.entities.filter((e) => e.id !== nearestEnemy!.id);
      }
      continue;
    }

    // Chase nearest enemy
    if (nearestDist <= 10) {
      const blocked = getBlockedPositions(state, ally.id);
      const step = findPath(state.map, ally.pos, nearestEnemy.pos, blocked);
      if (step) {
        ally.pos.x = step.x;
        ally.pos.y = step.y;
      }
    }
  }
}

let nextSplitId = 0;

function spawnSplitSlimes(state: GameState, parent: GameEntity): void {
  if (parent.specialAbility !== SpecialAbility.SPLIT) return;
  const positions = getSplitPositions(state, parent.pos);
  for (const sp of positions) {
    const miniSlime: GameEntity = {
      id: `enemy_split_${nextSplitId++}`,
      type: EntityType.ENEMY,
      pos: sp,
      name: "Mini Slime",
      hp: Math.max(2, Math.floor(parent.maxHp * 0.3)),
      maxHp: Math.max(2, Math.floor(parent.maxHp * 0.3)),
      attack: Math.max(1, Math.floor(parent.attack * 0.6)),
      defense: 0,
      color: "#7c3aed",
      symbol: "s",
      xpReward: Math.floor((parent.xpReward ?? 5) * 0.3),
      behavior: AIBehavior.CHASE,
      detectRange: 6,
    };
    state.entities.push(miniSlime);
  }
  if (positions.length > 0) {
    state.messages.push({ text: `${parent.name} splits into Mini Slimes!`, color: MSG_COLORS.WARNING });
    for (const sp of positions) {
      state.pendingFloatingTexts.push({ text: "SPLIT", color: "#4c1d95", x: sp.x, y: sp.y });
    }
  }
}

function getSplitPositions(state: GameState, origin: Position): Position[] {
  const dirs = [
    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
  ];
  const positions: Position[] = [];
  for (const d of dirs) {
    if (positions.length >= 2) break;
    const nx = origin.x + d.x;
    const ny = origin.y + d.y;
    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
    if (state.map[ny][nx] === TileType.WALL || state.map[ny][nx] === TileType.VOID) continue;
    if (nx === state.player.pos.x && ny === state.player.pos.y) continue;
    if (state.entities.some((e) => e.hp > 0 && e.pos.x === nx && e.pos.y === ny)) continue;
    positions.push({ x: nx, y: ny });
  }
  return positions;
}

export type MoveDirection = "up" | "down" | "left" | "right" | "wait";

export function processPlayerTurn(state: GameState, direction: MoveDirection): GameState {
  if (state.gameOver) return state;

  const newState = {
    ...state,
    messages: [] as GameMessage[],
    items: [...state.items],
    inventory: {
      ...state.inventory,
      items: [...state.inventory.items],
    },
    progression: { ...state.progression },
    runStats: { ...state.runStats },
    statusEffects: state.statusEffects.map((e) => ({ ...e })),
    pendingFloatingTexts: [] as FloatingText[],
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
  // Add strength potion bonus
  const strengthEffect = newState.statusEffects.find((e) => e.type === StatusEffectType.STRENGTH);
  if (strengthEffect) bonuses.attack += strengthEffect.value;

  if (direction !== "wait") {
    // Check for enemy at target (skip friendly entities for bump-attack)
    const enemy = getEntityAt(newState, newX, newY);
    if (enemy && !enemy.friendly) {
      // Attacking breaks invisibility
      newState.statusEffects = newState.statusEffects.filter((e) => {
        if (e.type === StatusEffectType.INVISIBLE) {
          newState.messages.push({ text: "You shimmer back into view!", color: MSG_COLORS.WARNING });
          return false;
        }
        return true;
      });

      // ETHEREAL: Rift Wraith is invulnerable when not on a floor tile
      if (enemy.specialAbility === SpecialAbility.ETHEREAL && newState.map[enemy.pos.y]?.[enemy.pos.x] !== TileType.FLOOR) {
        newState.messages.push({ text: `Your attack passes through ${enemy.name}! It's only vulnerable on solid ground.`, color: MSG_COLORS.WARNING });
        newState.pendingFloatingTexts.push({ text: "IMMUNE", color: "#e9d5ff", x: newX, y: newY });
      } else {
        const result = combat(newState.player, enemy, newState.messages, bonuses.attack, 0, newState.pendingFloatingTexts);
        newState.runStats.damageDealt += result.damage;
        if (!result.dodged) {
          newState.pendingFloatingTexts.push({
            text: `-${result.damage}`,
            color: MSG_COLORS.PLAYER_ATK,
            x: newX,
            y: newY,
          });
        }

        // TELEPORT: Void Walker teleports to random tile when hit (and survived)
        if (!result.killed && enemy.specialAbility === SpecialAbility.TELEPORT) {
          const dest = getRandomFloorTile(newState);
          if (dest) {
            enemy.pos = { ...dest };
            newState.messages.push({ text: `${enemy.name} teleports away!`, color: MSG_COLORS.WARNING });
            newState.pendingFloatingTexts.push({ text: "TELEPORT", color: "#5b21b6", x: dest.x, y: dest.y });
          }
        }

        if (result.killed) {
          spawnSplitSlimes(newState, enemy);
          newState.runStats.enemiesKilled++;
          awardXp(newState, enemy.xpReward ?? 5);

          if (enemy.isBoss) {
            // Boss kill: guaranteed rare+ loot, victory message
            newState.messages.push({ text: "The Void Nucleus shatters! The chamber falls silent.", color: MSG_COLORS.LEVEL_UP });
            newState.pendingFloatingTexts.push({ text: "BOSS SLAIN!", color: "#facc15", x: enemy.pos.x, y: enemy.pos.y });
            const bossLoot = generateBossLoot(newState.floor, enemy.pos);
            for (const loot of bossLoot) {
              newState.items.push(loot);
              newState.messages.push({ text: `The Nucleus dropped ${loot.item.name}!`, color: MSG_COLORS.LOOT });
            }
          } else {
            const loot = generateLootDrop(newState.floor, enemy.pos);
            if (loot) {
              newState.items.push(loot);
              newState.messages.push({ text: `${enemy.name} dropped ${loot.item.name}!`, color: MSG_COLORS.LOOT });
            }
          }
          newState.entities = newState.entities.filter((e) => e.id !== enemy.id);
        }
      }
    } else if (enemy && enemy.friendly) {
      // Swap positions with friendly entity
      const oldPos = { ...newState.player.pos };
      newState.player = { ...newState.player, pos: { x: newX, y: newY } };
      enemy.pos = oldPos;
      pickupItem(newState);
      if (newState.map[newY][newX] === TileType.STAIRS_DOWN) {
        newState.messages.push({ text: "You descend deeper into the void...", color: MSG_COLORS.INFO });
        return generateFloor(newState.floor + 1, newState.player, newState.inventory, newState.progression, newState.runStats, newState.statusEffects);
      }
    } else if (!isBlocked(newState, newX, newY)) {
      newState.player = { ...newState.player, pos: { x: newX, y: newY } };

      // Check for item pickup
      pickupItem(newState);

      // Check for stairs
      if (newState.map[newY][newX] === TileType.STAIRS_DOWN) {
        newState.messages.push({ text: "You descend deeper into the void...", color: MSG_COLORS.INFO });
        return generateFloor(newState.floor + 1, newState.player, newState.inventory, newState.progression, newState.runStats, newState.statusEffects);
      }
    }
  }

  // Process poison damage on enemies
  for (const enemy of newState.entities) {
    if (enemy.hp <= 0 || enemy.friendly) continue;
    if (enemy.poisonTurns && enemy.poisonTurns > 0) {
      const poisonDmg = 2;
      enemy.hp -= poisonDmg;
      enemy.poisonTurns--;
      newState.pendingFloatingTexts.push({ text: `-${poisonDmg}`, color: "#22c55e", x: enemy.pos.x, y: enemy.pos.y });
      if (enemy.hp <= 0) {
        newState.messages.push({ text: `${enemy.name} dies from poison!`, color: MSG_COLORS.KILL });
        spawnSplitSlimes(newState, enemy);
        newState.runStats.enemiesKilled++;
        newState.runStats.damageDealt += poisonDmg;
        awardXp(newState, enemy.xpReward ?? 5);
        const loot = generateLootDrop(newState.floor, enemy.pos);
        if (loot) {
          newState.items.push(loot);
          newState.messages.push({ text: `${enemy.name} dropped ${loot.item.name}!`, color: MSG_COLORS.LOOT });
        }
      }
    }
  }
  newState.entities = newState.entities.filter((e) => e.hp > 0);

  // Process summon lifetimes
  for (const entity of newState.entities) {
    if (entity.friendly && entity.summonTurns != null) {
      entity.summonTurns--;
      if (entity.summonTurns <= 0) {
        entity.hp = 0;
        newState.messages.push({ text: `${entity.name} fades back into the void.`, color: MSG_COLORS.INFO });
      }
    }
  }
  newState.entities = newState.entities.filter((e) => e.hp > 0);

  // Fear tick on enemies
  for (const enemy of newState.entities) {
    if (enemy.fearTurns && enemy.fearTurns > 0) {
      enemy.fearTurns--;
    }
  }

  // Haste: enemies skip movement on odd turns
  const isHasted = hasStatusEffect(newState, StatusEffectType.HASTE);
  const skipEnemyMove = isHasted && newState.turnCount % 2 === 1;

  // Enemy turn
  if (!skipEnemyMove) {
    moveEnemies(newState, bonuses.defense);
  }

  // Boss AI — spawns adds, telegraphs attacks, phase transitions
  processBossAI(newState);

  // Friendly entity (summon) AI — chase and attack nearest enemy
  moveFriendlies(newState);

  // Tick status effects
  newState.statusEffects = newState.statusEffects
    .map((e) => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }))
    .filter((e) => {
      if (e.turnsRemaining <= 0) {
        const label = e.type === StatusEffectType.HASTE ? "Haste" : e.type === StatusEffectType.INVISIBLE ? "Invisibility" : "Strength";
        newState.messages.push({ text: `${label} wears off.`, color: MSG_COLORS.WARNING });
        return false;
      }
      return true;
    });

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
