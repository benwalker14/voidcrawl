import {
  GameState,
  GameEntity,
  GameMessage,
  GameMode,
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
  HitEffect,
  MAX_INVENTORY_SIZE,
  AIBehavior,
  SpecialAbility,
  RunicEffect,
  EnemyIntent,
  CurseEffect,
  CURSE_NAMES,
  MSG_COLORS,
  CONSUMABLE_EFFECT_NAMES,
  getZoneTheme,
  VICTORY_FLOOR,
} from "./config";
import { random, seedRngForFloor, unseedRng } from "./rng";
import { generateDungeon } from "./generation/dungeon";
import { spawnEnemies, spawnEnemyAtPos, spawnBoss, spawnBossAdd } from "./generation/enemies";
import { computeFov, FOV_RADIUS } from "./generation/fov";
import { generateLootDrop, generateBossLoot, initConsumableAppearances, initIdentified } from "./data/items";
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
    killedBy: "",
  };
}

// Void Attunement helpers — prototype has 2 thresholds at 25% and 50%
const ATTUNEMENT_FLOOR_GAIN = 5;  // +5 per floor descended

/** FOV radius bonus from Void Sight (attunement >= 25), reduced by zone modifier */
function getAttunementFovRadius(attunement: number, floor: number = 1): number {
  const base = attunement >= 25 ? FOV_RADIUS + 2 : FOV_RADIUS;
  const zone = getZoneTheme(floor);
  return Math.max(3, base + zone.fovModifier);
}

/** Extra enemy detect range from attunement curse (>= 25) */
function getAttunementDetectBonus(attunement: number): number {
  return attunement >= 25 ? 3 : 0;
}

/** ATK bonus from Void Strike (attunement >= 50) */
export function getAttunementAtkBonus(attunement: number): number {
  return attunement >= 50 ? 3 : 0;
}

/** Healing multiplier from attunement curse (>= 50) */
function getAttunementHealMultiplier(attunement: number): number {
  return attunement >= 50 ? 0.5 : 1.0;
}

/** Get display name for a consumable based on identification state */
export function getConsumableDisplayName(state: GameState, item: Item): string {
  if (!item.effect) return item.name;
  if (item.category !== ItemCategory.POTION && item.category !== ItemCategory.SCROLL) return item.name;

  const appearance = state.consumableAppearances[item.effect];
  if (!appearance) return item.name;

  const typeLabel = item.category === ItemCategory.POTION ? "Potion" : "Scroll";
  const isIdentified = state.identified[item.effect] ?? false;

  if (isIdentified) {
    return `${appearance} ${typeLabel} (${CONSUMABLE_EFFECT_NAMES[item.effect]})`;
  }
  return `${appearance} ${typeLabel}`;
}

export function initGame(mode: GameMode = "standard", seed?: string): GameState {
  if (mode === "daily" && seed) {
    seedRngForFloor(seed, 1);
  } else {
    unseedRng();
  }
  return generateFloor(1, null, null, null, null, null, null, null, null, mode, seed);
}

export function generateFloor(
  floor: number,
  prevPlayer: GameEntity | null,
  prevInventory: PlayerInventory | null,
  prevProgression: PlayerProgression | null,
  prevRunStats: RunStats | null,
  prevStatusEffects: StatusEffect[] | null = null,
  prevIdentified: Record<string, boolean> | null = null,
  prevAppearances: Record<string, string> | null = null,
  prevVoidAttunement: number | null = null,
  mode: GameMode = "standard",
  seed?: string,
): GameState {
  // Re-seed RNG for deterministic floor generation in daily mode
  if (mode === "daily" && seed) {
    seedRngForFloor(seed, floor);
  }

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

  // Void Attunement: increases on descent
  const prevAttunement = prevVoidAttunement ?? 0;
  const attunementGain = prevPlayer ? ATTUNEMENT_FLOOR_GAIN : 0; // No gain on floor 1
  const voidAttunement = Math.min(100, prevAttunement + attunementGain);

  // Compute FOV with attunement-based radius (Void Sight at 25%+)
  const fovRadius = getAttunementFovRadius(voidAttunement, floor);
  const fov = computeFov(dungeon.map, player.pos.x, player.pos.y, fovRadius);
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

  // Build messages — floor descent + zone transition + attunement threshold notifications
  const zone = getZoneTheme(floor);
  const prevZone = floor > 1 ? getZoneTheme(floor - 1) : null;
  const messages: GameMessage[] = [
    { text: `You descend to floor ${floor} — ${zone.name}.`, color: MSG_COLORS.INFO },
  ];
  const pendingFloats: FloatingText[] = [];

  // Zone transition message when entering a new zone
  if (prevZone && prevZone.name !== zone.name) {
    if (zone.name === "Crystal Depths") {
      messages.push({ text: "The walls shimmer with crystalline formations. The air grows cold and electric.", color: zone.accentColor });
      pendingFloats.push({ text: "CRYSTAL DEPTHS", color: zone.accentColor, x: player.pos.x, y: player.pos.y });
    } else if (zone.name === "Shadow Realm") {
      messages.push({ text: "Darkness closes in. The shadows here are alive, and your vision narrows...", color: zone.accentColor });
      pendingFloats.push({ text: "SHADOW REALM", color: zone.accentColor, x: player.pos.x, y: player.pos.y });
    }
  }

  if (isBossFloor) {
    messages.push({ text: "The air crackles with energy. A massive Void Nucleus pulses at the far end of the chamber!", color: MSG_COLORS.WARNING });
  }

  if (attunementGain > 0) {
    messages.push({ text: `The void seeps deeper... (+${attunementGain} Null Attunement)`, color: "#c084fc" });
    pendingFloats.push({ text: `NULL +${attunementGain}`, color: "#c084fc", x: player.pos.x, y: player.pos.y });

    // Threshold crossing messages
    if (prevAttunement < 25 && voidAttunement >= 25) {
      messages.push({ text: "Null Attunement 25%: Your vision expands beyond mortal limits... but the darkness knows where you are.", color: "#c084fc" });
      pendingFloats.push({ text: "VOID SIGHT", color: "#a855f7", x: player.pos.x, y: player.pos.y });
    }
    if (prevAttunement < 50 && voidAttunement >= 50) {
      messages.push({ text: "Null Attunement 50%: Void energy surges through your strikes... but healing grows faint.", color: "#c084fc" });
      pendingFloats.push({ text: "VOID STRIKE", color: "#a855f7", x: player.pos.x, y: player.pos.y });
    }
  }

  const state: GameState = {
    floor,
    map: dungeon.map,
    player,
    entities: enemies,
    items: [],
    inventory: prevInventory ?? createInventory(),
    progression: prevProgression ?? createProgression(),
    messages,
    turnCount: 0,
    gameOver: false,
    victory: false,
    fov,
    explored,
    runStats,
    statusEffects: prevStatusEffects ?? [],
    pendingFloatingTexts: pendingFloats,
    pendingHitEffects: [],
    pendingShake: 0,
    identified: prevIdentified ?? initIdentified(),
    consumableAppearances: prevAppearances ?? initConsumableAppearances(),
    voidAttunement,
    shrinePrompt: false,
    shrinesUsed: new Set<string>(),
    gameMode: mode,
    seed,
    drainingAtkBonus: 0,  // Reset per floor (Draining curse grants +2 ATK per kill this floor)
    playerSlowed: false,   // Anti-Entropy curse: player skips next move
  };

  // Compute initial enemy intents so they display from turn 1
  computeEnemyIntents(state);

  return state;
}

/** Trigger victory — player escaped the void on floor 15 */
function triggerVictory(state: GameState): GameState {
  state.gameOver = true;
  state.victory = true;
  state.messages.push({ text: "YOU ESCAPED THE VOID!", color: "#22c55e" });
  state.pendingFloatingTexts.push({ text: "VICTORY!", color: "#22c55e", x: state.player.pos.x, y: state.player.pos.y });
  return state;
}

/** Continue into endless mode after victory — generates the next floor */
export function continueEndless(state: GameState): GameState {
  const nextState = generateFloor(
    state.floor + 1, state.player, state.inventory, state.progression,
    state.runStats, state.statusEffects, state.identified,
    state.consumableAppearances, state.voidAttunement, state.gameMode, state.seed
  );
  nextState.victory = true; // Keep victory flag so it doesn't re-trigger
  nextState.messages.push({ text: "You descend beyond the void... endless mode.", color: MSG_COLORS.INFO });
  return nextState;
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
  damageMultiplier: number = 1,
  hitEffects?: HitEffect[],
): { killed: boolean; damage: number; dodged: boolean } {
  const isPlayerAttacking = attacker.type === EntityType.PLAYER;

  // PHASE ability: 30% dodge chance
  if (defender.specialAbility === SpecialAbility.PHASE && random() < 0.3) {
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

  const baseDamage = Math.max(1, atk - def + Math.floor(random() * 3) - 1);
  const damage = Math.max(1, Math.floor(baseDamage * damageMultiplier));
  defender.hp -= damage;
  messages.push({
    text: `${attacker.name} hits ${defender.name} for ${damage} damage!`,
    color: isPlayerAttacking ? MSG_COLORS.PLAYER_ATK : MSG_COLORS.ENEMY_ATK,
  });

  // Hit effect: flash + impact burst on the defender
  if (hitEffects) {
    hitEffects.push({
      x: defender.pos.x,
      y: defender.pos.y,
      color: isPlayerAttacking ? MSG_COLORS.PLAYER_ATK : MSG_COLORS.ENEMY_ATK,
      isPlayerAttack: isPlayerAttacking,
    });
  }

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
    const canReplaceCurrent = !current?.cursed; // Cursed items cannot be unequipped
    if (canReplaceCurrent && (!current || (item.attack ?? 0) > (current.attack ?? 0))) {
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
      // Reveal curse on equip
      if (item.cursed && item.curse) {
        state.messages.push({ text: `Equipped ${item.name}! (+${item.attack} ATK) — a dark energy binds it to you!`, color: "#ef4444" });
        state.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
      } else {
        state.messages.push({ text: `Equipped ${item.name}! (+${item.attack} ATK)`, color: MSG_COLORS.EQUIP });
      }
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
    const canReplaceCurrent = !current?.cursed; // Cursed items cannot be unequipped
    if (canReplaceCurrent && (!current || (item.defense ?? 0) > (current.defense ?? 0))) {
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
      // Reveal curse on equip
      if (item.cursed && item.curse) {
        state.messages.push({ text: `Equipped ${item.name}! (+${item.defense} DEF) — a dark energy binds it to you!`, color: "#ef4444" });
        state.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
      } else {
        state.messages.push({ text: `Equipped ${item.name}! (+${item.defense} DEF)`, color: MSG_COLORS.EQUIP });
      }
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
    const displayName = getConsumableDisplayName(state, item);
    const unknownHint = (item.effect && !state.identified[item.effect]) ? " (?)" : "";
    state.messages.push({ text: `Picked up ${displayName}${unknownHint}.`, color: MSG_COLORS.LOOT });
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
  return tiles[Math.floor(random() * tiles.length)];
}

let nextSummonId = 0;

function applyConsumableEffect(state: GameState, item: Item): boolean {
  const effect = item.effect ?? ConsumableEffect.HEAL;
  const displayName = getConsumableDisplayName(state, item);

  switch (effect) {
    case ConsumableEffect.HEAL: {
      if (state.player.hp >= state.player.maxHp) {
        state.messages.push({ text: "You're already at full health.", color: MSG_COLORS.WARNING });
        return false;
      }
      const healMult = getAttunementHealMultiplier(state.voidAttunement);
      const rawHeal = item.healAmount ?? 0;
      const effectiveHeal = Math.max(1, Math.floor(rawHeal * healMult));
      const healed = Math.min(effectiveHeal, state.player.maxHp - state.player.hp);
      state.player = { ...state.player, hp: state.player.hp + healed };
      const healMsg = healMult < 1 ? ` (weakened by void)` : "";
      state.messages.push({ text: `Used ${displayName}. Restored ${healed} HP.${healMsg}`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: `+${healed} HP`, color: MSG_COLORS.HEAL, x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.HASTE: {
      const turns = item.effectValue ?? 8;
      addStatusEffect(state, StatusEffectType.HASTE, turns);
      state.messages.push({ text: `Used ${displayName}. You feel incredibly fast! (${turns} turns)`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: "HASTE", color: "#22c55e", x: state.player.pos.x, y: state.player.pos.y });
      return true;
    }

    case ConsumableEffect.INVISIBILITY: {
      const turns = item.effectValue ?? 10;
      addStatusEffect(state, StatusEffectType.INVISIBLE, turns);
      state.messages.push({ text: `Used ${displayName}. You fade from sight! (${turns} turns)`, color: MSG_COLORS.HEAL });
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
      state.messages.push({ text: `Used ${displayName}. You teleport to a new location!`, color: MSG_COLORS.INFO });
      state.pendingFloatingTexts.push({ text: "TELEPORT", color: "#06b6d4", x: dest.x, y: dest.y });
      // Update FOV immediately (with attunement radius)
      state.fov = computeFov(state.map, state.player.pos.x, state.player.pos.y, getAttunementFovRadius(state.voidAttunement, state.floor));
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
      state.messages.push({ text: `Used ${displayName}. Flames engulf ${hitCount} nearby ${hitCount === 1 ? "enemy" : "enemies"}!`, color: MSG_COLORS.PLAYER_ATK });
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
      state.messages.push({ text: `Used ${displayName}. Poisoned ${hitCount} nearby ${hitCount === 1 ? "enemy" : "enemies"} for ${turns} turns!`, color: MSG_COLORS.HEAL });
      return true;
    }

    case ConsumableEffect.STRENGTH: {
      const turns = item.effectValue ?? 10;
      addStatusEffect(state, StatusEffectType.STRENGTH, turns, 3);
      state.messages.push({ text: `Used ${displayName}. Your attacks grow powerful! (+3 ATK for ${turns} turns)`, color: MSG_COLORS.HEAL });
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
      state.messages.push({ text: `Used ${displayName}. The entire floor is revealed!`, color: MSG_COLORS.INFO });
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
          state.messages.push({ text: `Used ${displayName}. ${weapon.name} glows with power! (+${bonus} ATK)`, color: MSG_COLORS.EQUIP });
        } else {
          state.inventory.equippedArmor = { ...armor, defense: (armor.defense ?? 0) + bonus };
          state.messages.push({ text: `Used ${displayName}. ${armor.name} hardens! (+${bonus} DEF)`, color: MSG_COLORS.EQUIP });
        }
      } else if (weapon) {
        state.inventory.equippedWeapon = { ...weapon, attack: (weapon.attack ?? 0) + bonus };
        state.messages.push({ text: `Used ${displayName}. ${weapon.name} glows with power! (+${bonus} ATK)`, color: MSG_COLORS.EQUIP });
      } else if (armor) {
        state.inventory.equippedArmor = { ...armor, defense: (armor.defense ?? 0) + bonus };
        state.messages.push({ text: `Used ${displayName}. ${armor.name} hardens! (+${bonus} DEF)`, color: MSG_COLORS.EQUIP });
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
      state.messages.push({ text: `Used ${displayName}. ${hitCount} ${hitCount === 1 ? "enemy flees" : "enemies flee"} in terror!`, color: MSG_COLORS.INFO });
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
      state.messages.push({ text: `Used ${displayName}. A Void Spirit materializes to fight for you! (${turns} turns)`, color: MSG_COLORS.LOOT });
      state.pendingFloatingTexts.push({ text: "SUMMONED", color: "#06b6d4", x: spawnPos.x, y: spawnPos.y });
      return true;
    }

    case ConsumableEffect.REMOVE_CURSE: {
      const weapon = state.inventory.equippedWeapon;
      const armor = state.inventory.equippedArmor;
      const weaponCursed = weapon?.cursed;
      const armorCursed = armor?.cursed;
      if (!weaponCursed && !armorCursed) {
        state.messages.push({ text: "You have no cursed equipment.", color: MSG_COLORS.WARNING });
        return false;
      }
      if (weaponCursed) {
        state.inventory.equippedWeapon = { ...weapon, cursed: false, curse: undefined, name: weapon.name.replace(" (cursed)", "") };
        state.messages.push({ text: `The curse lifts from your ${weapon.name.replace(" (cursed)", "")}!`, color: MSG_COLORS.HEAL });
      }
      if (armorCursed) {
        state.inventory.equippedArmor = { ...armor!, cursed: false, curse: undefined, name: armor!.name.replace(" (cursed)", "") };
        state.messages.push({ text: `The curse lifts from your ${armor!.name.replace(" (cursed)", "")}!`, color: MSG_COLORS.HEAL });
      }
      state.pendingFloatingTexts.push({ text: "CURSE LIFTED!", color: "#22c55e", x: state.player.pos.x, y: state.player.pos.y });
      // Reset draining ATK bonus since the curse is gone
      if (weaponCursed || armorCursed) {
        state.drainingAtkBonus = 0;
      }
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
    pendingHitEffects: [] as HitEffect[],
    pendingShake: 0,
  };
  const item = newState.inventory.items[index];

  if (item.category === ItemCategory.POTION || item.category === ItemCategory.SCROLL) {
    const wasIdentified = item.effect ? newState.identified[item.effect] ?? false : true;
    const consumed = applyConsumableEffect(newState, item);
    if (consumed) {
      newState.inventory.items.splice(index, 1);
      // Identify the effect on first successful use
      if (item.effect && !wasIdentified) {
        newState.identified = { ...newState.identified, [item.effect]: true };
        const effectName = CONSUMABLE_EFFECT_NAMES[item.effect];
        const appearance = newState.consumableAppearances[item.effect] ?? "";
        const typeLabel = item.category === ItemCategory.POTION ? "Potions" : "Scrolls";
        newState.messages.push({
          text: `You identify it! ${appearance} ${typeLabel} are ${effectName}!`,
          color: MSG_COLORS.LOOT,
        });
      }
    }
  } else if (item.category === ItemCategory.WEAPON) {
    const old = newState.inventory.equippedWeapon;
    if (old?.cursed) {
      newState.messages.push({ text: `Your ${old.name} is cursed! You cannot unequip it.`, color: "#ef4444" });
      return newState;
    }
    newState.inventory.equippedWeapon = item;
    newState.inventory.items.splice(index, 1);
    if (old) newState.inventory.items.push(old);
    if (item.cursed && item.curse) {
      newState.messages.push({ text: `Equipped ${item.name}! (+${item.attack} ATK) — a dark energy binds it to you!`, color: "#ef4444" });
      newState.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: newState.player.pos.x, y: newState.player.pos.y });
    } else {
      newState.messages.push({ text: `Equipped ${item.name}! (+${item.attack} ATK)`, color: MSG_COLORS.EQUIP });
    }
  } else if (item.category === ItemCategory.ARMOR) {
    const old = newState.inventory.equippedArmor;
    if (old?.cursed) {
      newState.messages.push({ text: `Your ${old.name} is cursed! You cannot unequip it.`, color: "#ef4444" });
      return newState;
    }
    newState.inventory.equippedArmor = item;
    newState.inventory.items.splice(index, 1);
    if (old) newState.inventory.items.push(old);
    if (item.cursed && item.curse) {
      newState.messages.push({ text: `Equipped ${item.name}! (+${item.defense} DEF) — a dark energy binds it to you!`, color: "#ef4444" });
      newState.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: newState.player.pos.x, y: newState.player.pos.y });
    } else {
      newState.messages.push({ text: `Equipped ${item.name}! (+${item.defense} DEF)`, color: MSG_COLORS.EQUIP });
    }
  }

  return newState;
}

export function dropItem(state: GameState, index: number): GameState {
  if (index < 0 || index >= state.inventory.items.length) return state;

  const newState = {
    ...state,
    messages: [] as GameMessage[],
    inventory: { ...state.inventory, items: [...state.inventory.items] },
    items: [...state.items],
    pendingFloatingTexts: [] as FloatingText[],
    pendingHitEffects: [] as HitEffect[],
    pendingShake: 0,
  };
  const item = newState.inventory.items[index];
  newState.inventory.items.splice(index, 1);

  // Place item on the ground at player's position
  newState.items.push({ item, pos: { ...newState.player.pos } });

  const displayName = (item.category === ItemCategory.POTION || item.category === ItemCategory.SCROLL)
    ? getConsumableDisplayName(newState, item)
    : item.name;
  newState.messages.push({ text: `You dropped ${displayName}.`, color: MSG_COLORS.LOOT });

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
    const j = Math.floor(random() * (i + 1));
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
          state.pendingHitEffects.push({ x: px, y: py, color: MSG_COLORS.ENEMY_ATK, isPlayerAttack: false });
          state.pendingShake = Math.max(state.pendingShake, 7);
          if (state.player.hp <= 0) {
            state.gameOver = true;
            state.runStats.killedBy = "Void Nucleus";
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
  return tiles[Math.floor(random() * tiles.length)];
}

function moveEnemies(state: GameState, playerDefenseBonus: number = 0) {
  const isInvisible = hasStatusEffect(state, StatusEffectType.INVISIBLE);
  const paranoidBonus = state.inventory.equippedArmor?.curse === CurseEffect.PARANOID ? 4 : 0;
  const detectBonus = getAttunementDetectBonus(state.voidAttunement) + paranoidBonus;

  for (const enemy of state.entities) {
    if (enemy.hp <= 0 || enemy.friendly) continue;

    // Boss is stationary — handled by processBossAI
    if (enemy.isBoss) continue;

    // Stunned enemies skip their turn (Stunning runic)
    if (enemy.stunnedNextTurn) {
      enemy.stunnedNextTurn = false;
      continue;
    }

    const dx = state.player.pos.x - enemy.pos.x;
    const dy = state.player.pos.y - enemy.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const detectRange = (enemy.detectRange ?? 8) + detectBonus; // Void Attunement curse: +3 at 25%+
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
      if (random() < 0.3) {
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
      const result = combat(enemy, state.player, state.messages, 0, playerDefenseBonus, state.pendingFloatingTexts, 1, state.pendingHitEffects);
      state.runStats.damageTaken += result.damage;
      if (!result.dodged) {
        // Screen shake scales with damage taken (min 2, max 6)
        state.pendingShake = Math.max(state.pendingShake, Math.min(6, Math.max(2, result.damage)));
        state.pendingFloatingTexts.push({
          text: `-${result.damage}`,
          color: MSG_COLORS.ENEMY_ATK,
          x: state.player.pos.x,
          y: state.player.pos.y,
        });

        // Armor runic effects trigger when player takes damage
        const armorRunic = state.inventory.equippedArmor?.runic;
        if (armorRunic === RunicEffect.THORNED && enemy.hp > 0) {
          enemy.hp -= 1;
          state.messages.push({ text: `Thorns pierce ${enemy.name} for 1 damage!`, color: MSG_COLORS.PLAYER_ATK });
          state.pendingFloatingTexts.push({ text: "-1", color: "#f97316", x: enemy.pos.x, y: enemy.pos.y });
          if (enemy.hp <= 0) {
            state.messages.push({ text: `${enemy.name} is destroyed by thorns!`, color: MSG_COLORS.KILL });
          }
        }
        if (armorRunic === RunicEffect.REFLECTIVE && random() < 0.15 && enemy.hp > 0) {
          const reflectDmg = result.damage;
          enemy.hp -= reflectDmg;
          state.messages.push({ text: `Your armor reflects ${reflectDmg} damage back at ${enemy.name}!`, color: MSG_COLORS.PLAYER_ATK });
          state.pendingFloatingTexts.push({ text: `-${reflectDmg}`, color: "#38bdf8", x: enemy.pos.x, y: enemy.pos.y });
          if (enemy.hp <= 0) {
            state.messages.push({ text: `${enemy.name} is destroyed by reflected damage!`, color: MSG_COLORS.KILL });
          }
        }

        // Armor curse effects trigger when player takes damage
        const armorCurse = state.inventory.equippedArmor?.curse;

        // ANTI-ENTROPY: attacker frozen 1 turn, player slowed 1 turn
        if (armorCurse === CurseEffect.ANTI_ENTROPY && enemy.hp > 0) {
          enemy.stunnedNextTurn = true;
          state.playerSlowed = true;
          state.messages.push({ text: `Anti-entropy: ${enemy.name} is frozen, but you feel sluggish!`, color: "#a78bfa" });
          state.pendingFloatingTexts.push({ text: "FROZEN!", color: "#38bdf8", x: enemy.pos.x, y: enemy.pos.y });
        }

        // VOLATILE: 10% chance to explode for 4 AoE damage (hurts player + all adjacent enemies)
        if (armorCurse === CurseEffect.VOLATILE && random() < 0.10) {
          const px = state.player.pos.x;
          const py = state.player.pos.y;
          // Damage player
          const volatileSelfDmg = 4;
          state.player = { ...state.player, hp: state.player.hp - volatileSelfDmg };
          state.messages.push({ text: `Your volatile armor EXPLODES! You take ${volatileSelfDmg} damage!`, color: "#ef4444" });
          state.pendingFloatingTexts.push({ text: `-${volatileSelfDmg}`, color: "#ef4444", x: px, y: py });
          state.pendingShake = Math.max(state.pendingShake, 6);
          // Damage all enemies within 1 tile
          for (const ent of state.entities) {
            if (ent.hp <= 0 || ent.friendly) continue;
            const ex = Math.abs(ent.pos.x - px);
            const ey = Math.abs(ent.pos.y - py);
            if (ex <= 1 && ey <= 1) {
              ent.hp -= 4;
              state.messages.push({ text: `The explosion hits ${ent.name} for 4 damage!`, color: MSG_COLORS.PLAYER_ATK });
              state.pendingFloatingTexts.push({ text: "-4", color: "#f97316", x: ent.pos.x, y: ent.pos.y });
              if (ent.hp <= 0) {
                state.messages.push({ text: `${ent.name} is destroyed by the explosion!`, color: MSG_COLORS.KILL });
              }
            }
          }
        }
      }
      if (state.player.hp <= 0) {
        state.gameOver = true;
        state.runStats.killedBy = enemy.name;
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
          if (random() < 0.3) {
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

/** Compute intent indicators for all enemies based on current state.
 *  Called after enemy movement so intents reflect what enemies will do next turn. */
function computeEnemyIntents(state: GameState) {
  const isInvisible = hasStatusEffect(state, StatusEffectType.INVISIBLE);
  const paranoidBonus = state.inventory.equippedArmor?.curse === CurseEffect.PARANOID ? 4 : 0;
  const detectBonus = getAttunementDetectBonus(state.voidAttunement) + paranoidBonus;

  for (const enemy of state.entities) {
    if (enemy.hp <= 0 || enemy.friendly) {
      enemy.intent = undefined;
      continue;
    }

    const dx = state.player.pos.x - enemy.pos.x;
    const dy = state.player.pos.y - enemy.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const detectRange = (enemy.detectRange ?? 8) + detectBonus;
    const behavior = enemy.behavior ?? AIBehavior.CHASE;

    // Feared enemies are always fleeing
    if (enemy.fearTurns && enemy.fearTurns > 0) {
      enemy.intent = EnemyIntent.FLEEING;
      continue;
    }

    // If player is invisible, enemies are idle
    if (isInvisible) {
      enemy.intent = EnemyIntent.IDLE;
      continue;
    }

    // Adjacent = will attack next turn
    if (dist === 1) {
      enemy.intent = EnemyIntent.ATTACKING;
      continue;
    }

    // Stunned enemies still show intent based on position (stun is temporary)
    if (enemy.stunnedNextTurn) {
      enemy.intent = dist <= detectRange ? EnemyIntent.APPROACHING : EnemyIntent.IDLE;
      continue;
    }

    // Boss intent
    if (enemy.isBoss) {
      enemy.intent = EnemyIntent.ATTACKING; // Boss is always a threat
      continue;
    }

    // Coward fleeing when low HP
    if (behavior === AIBehavior.COWARD && enemy.hp < enemy.maxHp * 0.4 && dist <= detectRange) {
      enemy.intent = EnemyIntent.FLEEING;
      continue;
    }

    // Within detect range = approaching
    if (dist <= detectRange) {
      // Ethereal and howled enemies are always aware within range
      enemy.intent = EnemyIntent.APPROACHING;
      continue;
    }

    // Out of range = idle
    enemy.intent = EnemyIntent.IDLE;
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
      const result = combat(ally, nearestEnemy, state.messages, 0, 0, state.pendingFloatingTexts, 1, state.pendingHitEffects);
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
  if (state.shrinePrompt) return state; // Block movement during shrine prompt

  // ANTI-ENTROPY curse: player is slowed — forced to wait this turn
  if (state.playerSlowed && direction !== "wait") {
    direction = "wait";
    // Message handled below after newState created
  }

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
    pendingHitEffects: [] as HitEffect[],
    pendingShake: 0,
  };

  // Clear Anti-Entropy slow and show message
  if (newState.playerSlowed) {
    newState.playerSlowed = false;
    newState.messages.push({ text: "You are sluggish from anti-entropy...", color: "#a78bfa" });
  }

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
  // Add Void Strike bonus (attunement >= 50)
  bonuses.attack += getAttunementAtkBonus(newState.voidAttunement);
  // Add Draining curse accumulated ATK bonus
  bonuses.attack += newState.drainingAtkBonus;
  // ERRATIC curse: -2 ATK penalty (compensated by 25% chance 3x damage)
  const weaponCurse = newState.inventory.equippedWeapon?.curse;
  if (weaponCurse === CurseEffect.ERRATIC) {
    bonuses.attack -= 2;
  }

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
        // VORPAL runic: 2x damage when enemy below 30% HP
        const weaponRunic = newState.inventory.equippedWeapon?.runic;
        let damageMultiplier = 1;
        if (weaponRunic === RunicEffect.VORPAL && enemy.hp < enemy.maxHp * 0.3) {
          damageMultiplier = 2;
          newState.pendingShake = Math.max(newState.pendingShake, 5);
          newState.messages.push({ text: `Your blade senses weakness — VORPAL STRIKE!`, color: MSG_COLORS.PLAYER_ATK });
          newState.pendingFloatingTexts.push({ text: "VORPAL!", color: "#dc2626", x: newX, y: newY });
        }
        // ERRATIC curse: 25% chance of 3x damage
        if (weaponCurse === CurseEffect.ERRATIC && random() < 0.25) {
          damageMultiplier = 3;
          newState.pendingShake = Math.max(newState.pendingShake, 5);
          newState.messages.push({ text: `Your erratic blade erupts with wild force!`, color: MSG_COLORS.PLAYER_ATK });
          newState.pendingFloatingTexts.push({ text: "ERRATIC x3!", color: "#f59e0b", x: newX, y: newY });
        }

        const result = combat(newState.player, enemy, newState.messages, bonuses.attack, 0, newState.pendingFloatingTexts, damageMultiplier, newState.pendingHitEffects);
        newState.runStats.damageDealt += result.damage;
        if (!result.dodged) {
          newState.pendingFloatingTexts.push({
            text: `-${result.damage}`,
            color: MSG_COLORS.PLAYER_ATK,
            x: newX,
            y: newY,
          });

          // FLAMING runic: 25% chance to apply burn (2 dmg/turn for 3 turns)
          if (weaponRunic === RunicEffect.FLAMING && random() < 0.25) {
            enemy.burnTurns = Math.max(enemy.burnTurns ?? 0, 3);
            newState.messages.push({ text: `${enemy.name} catches fire!`, color: MSG_COLORS.PLAYER_ATK });
            newState.pendingFloatingTexts.push({ text: "BURN!", color: "#f97316", x: newX, y: newY });
          }

          // STUNNING runic: 20% chance to stun (skip enemy's next turn)
          if (weaponRunic === RunicEffect.STUNNING && random() < 0.20) {
            enemy.stunnedNextTurn = true;
            newState.messages.push({ text: `${enemy.name} is stunned!`, color: MSG_COLORS.PLAYER_ATK });
            newState.pendingFloatingTexts.push({ text: "STUNNED!", color: "#fbbf24", x: newX, y: newY });
          }
        }

        // DISPLACING curse: attacks teleport enemy to random tile (if survived)
        if (!result.killed && weaponCurse === CurseEffect.DISPLACING) {
          const dest = getRandomFloorTile(newState);
          if (dest) {
            enemy.pos = { ...dest };
            newState.messages.push({ text: `Your weapon displaces ${enemy.name} across the dungeon!`, color: MSG_COLORS.WARNING });
            newState.pendingFloatingTexts.push({ text: "DISPLACED!", color: "#a78bfa", x: dest.x, y: dest.y });
          }
        }

        // TELEPORT: Void Walker teleports to random tile when hit (and survived)
        if (!result.killed && enemy.specialAbility === SpecialAbility.TELEPORT && weaponCurse !== CurseEffect.DISPLACING) {
          const dest = getRandomFloorTile(newState);
          if (dest) {
            enemy.pos = { ...dest };
            newState.messages.push({ text: `${enemy.name} teleports away!`, color: MSG_COLORS.WARNING });
            newState.pendingFloatingTexts.push({ text: "TELEPORT", color: "#5b21b6", x: dest.x, y: dest.y });
          }
        }

        if (result.killed) {
          // Screen shake on kill (3 for normal, 6 for boss)
          newState.pendingShake = Math.max(newState.pendingShake, enemy.isBoss ? 6 : 3);
          spawnSplitSlimes(newState, enemy);
          newState.runStats.enemiesKilled++;
          awardXp(newState, enemy.xpReward ?? 5);

          // VAMPIRIC runic: heal 1 HP on kill
          if (weaponRunic === RunicEffect.VAMPIRIC) {
            const healAmt = Math.min(1, newState.player.maxHp - newState.player.hp);
            if (healAmt > 0) {
              newState.player = { ...newState.player, hp: newState.player.hp + 1 };
              newState.messages.push({ text: `Your weapon drains life! +1 HP`, color: MSG_COLORS.HEAL });
              newState.pendingFloatingTexts.push({ text: "+1 HP", color: MSG_COLORS.HEAL, x: newState.player.pos.x, y: newState.player.pos.y });
            }
          }

          // DRAINING curse: kills give -1 max HP but +2 ATK for rest of floor
          if (weaponCurse === CurseEffect.DRAINING) {
            newState.player = { ...newState.player, maxHp: Math.max(5, newState.player.maxHp - 1), hp: Math.min(newState.player.hp, Math.max(5, newState.player.maxHp - 1)) };
            newState.drainingAtkBonus += 2;
            newState.messages.push({ text: `The draining blade feeds! -1 max HP, +2 ATK this floor.`, color: "#ef4444" });
            newState.pendingFloatingTexts.push({ text: "DRAIN!", color: "#ef4444", x: newState.player.pos.x, y: newState.player.pos.y });
          }

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
        if (newState.floor === VICTORY_FLOOR && !newState.victory) {
          return triggerVictory(newState);
        }
        newState.messages.push({ text: "You descend deeper into the void...", color: MSG_COLORS.INFO });
        return generateFloor(newState.floor + 1, newState.player, newState.inventory, newState.progression, newState.runStats, newState.statusEffects, newState.identified, newState.consumableAppearances, newState.voidAttunement, newState.gameMode, newState.seed);
      }
    } else if (!isBlocked(newState, newX, newY)) {
      newState.player = { ...newState.player, pos: { x: newX, y: newY } };

      // Check for item pickup
      pickupItem(newState);

      // Check for stairs
      if (newState.map[newY][newX] === TileType.STAIRS_DOWN) {
        if (newState.floor === VICTORY_FLOOR && !newState.victory) {
          return triggerVictory(newState);
        }
        newState.messages.push({ text: "You descend deeper into the void...", color: MSG_COLORS.INFO });
        return generateFloor(newState.floor + 1, newState.player, newState.inventory, newState.progression, newState.runStats, newState.statusEffects, newState.identified, newState.consumableAppearances, newState.voidAttunement, newState.gameMode, newState.seed);
      }

      // Check for void shrine
      if (newState.map[newY][newX] === TileType.SHRINE && !newState.shrinesUsed.has(`${newX},${newY}`)) {
        newState.shrinePrompt = true;
        newState.messages.push({ text: "A Void Shrine pulses with dark energy. Commune with the Void? (Y/N)", color: "#c084fc" });
        // Return immediately — no enemy turn until the player answers
        newState.fov = computeFov(newState.map, newState.player.pos.x, newState.player.pos.y, getAttunementFovRadius(newState.voidAttunement, newState.floor));
        newState.explored = newState.explored.map((row) => [...row]);
        for (let ey = 0; ey < MAP_HEIGHT; ey++) {
          for (let ex = 0; ex < MAP_WIDTH; ex++) {
            if (newState.fov[ey][ex]) newState.explored[ey][ex] = true;
          }
        }
        newState.turnCount++;
        return newState;
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

  // Process burn damage on enemies (Flaming runic)
  for (const enemy of newState.entities) {
    if (enemy.hp <= 0 || enemy.friendly) continue;
    if (enemy.burnTurns && enemy.burnTurns > 0) {
      const burnDmg = 2;
      enemy.hp -= burnDmg;
      enemy.burnTurns--;
      newState.pendingFloatingTexts.push({ text: `-${burnDmg}`, color: "#f97316", x: enemy.pos.x, y: enemy.pos.y });
      if (enemy.hp <= 0) {
        newState.messages.push({ text: `${enemy.name} burns to death!`, color: MSG_COLORS.KILL });
        spawnSplitSlimes(newState, enemy);
        newState.runStats.enemiesKilled++;
        newState.runStats.damageDealt += burnDmg;
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

  // Compute enemy intent indicators for the player to read
  computeEnemyIntents(newState);

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

  // Update FOV (Void Sight at 25%+ attunement gives +2 radius)
  const fovRadius = getAttunementFovRadius(newState.voidAttunement, newState.floor);
  newState.fov = computeFov(newState.map, newState.player.pos.x, newState.player.pos.y, fovRadius);
  // Update explored
  newState.explored = newState.explored.map((row) => [...row]);
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (newState.fov[y][x]) newState.explored[y][x] = true;
    }
  }

  // Regenerating armor runic: heal 1 HP every 10 turns
  if (newState.inventory.equippedArmor?.runic === RunicEffect.REGENERATING && newState.turnCount % 10 === 9) {
    if (newState.player.hp < newState.player.maxHp) {
      newState.player = { ...newState.player, hp: newState.player.hp + 1 };
      newState.messages.push({ text: "Your armor pulses — you regenerate 1 HP.", color: MSG_COLORS.HEAL });
      newState.pendingFloatingTexts.push({ text: "+1 HP", color: MSG_COLORS.HEAL, x: newState.player.pos.x, y: newState.player.pos.y });
    }
  }

  newState.turnCount++;
  return newState;
}

// Shrine effect pool — weights sum to 100
const SHRINE_EFFECTS: { weight: number; label: string; apply: (state: GameState) => void }[] = [
  {
    weight: 20,
    label: "heal",
    apply: (state) => {
      const healAmt = Math.max(1, Math.floor(state.player.maxHp * 0.5));
      const healed = Math.min(healAmt, state.player.maxHp - state.player.hp);
      state.player = { ...state.player, hp: Math.min(state.player.maxHp, state.player.hp + healAmt) };
      state.messages.push({ text: `The void mends your wounds. (+${healed} HP)`, color: MSG_COLORS.HEAL });
      state.pendingFloatingTexts.push({ text: `+${healed} HP`, color: MSG_COLORS.HEAL, x: state.player.pos.x, y: state.player.pos.y });
    },
  },
  {
    weight: 15,
    label: "stat",
    apply: (state) => {
      const roll = random();
      if (roll < 0.33) {
        state.player = { ...state.player, attack: state.player.attack + 1 };
        state.messages.push({ text: "Void energy surges into your arms. (+1 permanent ATK)", color: "#c084fc" });
        state.pendingFloatingTexts.push({ text: "+1 ATK", color: "#c084fc", x: state.player.pos.x, y: state.player.pos.y });
      } else if (roll < 0.66) {
        state.player = { ...state.player, defense: state.player.defense + 1 };
        state.messages.push({ text: "Void energy hardens your skin. (+1 permanent DEF)", color: "#c084fc" });
        state.pendingFloatingTexts.push({ text: "+1 DEF", color: "#c084fc", x: state.player.pos.x, y: state.player.pos.y });
      } else {
        state.player = { ...state.player, maxHp: state.player.maxHp + 5, hp: state.player.hp + 5 };
        state.messages.push({ text: "Void energy expands your vitality. (+5 permanent Max HP)", color: "#c084fc" });
        state.pendingFloatingTexts.push({ text: "+5 MAX HP", color: "#c084fc", x: state.player.pos.x, y: state.player.pos.y });
      }
    },
  },
  {
    weight: 15,
    label: "identify",
    apply: (state) => {
      let identifiedCount = 0;
      for (const key of Object.keys(state.consumableAppearances)) {
        if (!state.identified[key]) {
          state.identified = { ...state.identified, [key]: true };
          identifiedCount++;
        }
      }
      if (identifiedCount > 0) {
        state.messages.push({ text: `The void reveals all secrets. (${identifiedCount} items identified)`, color: MSG_COLORS.LOOT });
        state.pendingFloatingTexts.push({ text: "REVEALED", color: "#06b6d4", x: state.player.pos.x, y: state.player.pos.y });
      } else {
        // Fallback: all already identified — give a random consumable instead
        state.messages.push({ text: "You already know all there is to know. The void gives you a gift instead.", color: MSG_COLORS.LOOT });
        const loot = generateLootDrop(state.floor, state.player.pos);
        if (loot) {
          state.items.push(loot);
          state.messages.push({ text: `A ${loot.item.name} materializes at your feet!`, color: MSG_COLORS.LOOT });
        }
      }
    },
  },
  {
    weight: 15,
    label: "consumable",
    apply: (state) => {
      const loot = generateLootDrop(state.floor, state.player.pos);
      if (loot) {
        state.items.push(loot);
        state.messages.push({ text: `The shrine conjures a ${loot.item.name}!`, color: MSG_COLORS.LOOT });
        state.pendingFloatingTexts.push({ text: "GIFT", color: "#06b6d4", x: state.player.pos.x, y: state.player.pos.y });
      }
    },
  },
  {
    weight: 15,
    label: "enemies",
    apply: (state) => {
      let spawned = 0;
      for (let i = 0; i < 2; i++) {
        const pos = getRandomFloorTile(state);
        if (pos) {
          // Spawn enemies near the player (within 4 tiles if possible)
          const nearTiles: Position[] = [];
          for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
              const nx = state.player.pos.x + dx;
              const ny = state.player.pos.y + dy;
              if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
              if (state.map[ny][nx] !== TileType.FLOOR && state.map[ny][nx] !== TileType.SHRINE) continue;
              if (nx === state.player.pos.x && ny === state.player.pos.y) continue;
              if (state.entities.some((e) => e.hp > 0 && e.pos.x === nx && e.pos.y === ny)) continue;
              nearTiles.push({ x: nx, y: ny });
            }
          }
          const spawnPos = nearTiles.length > 0 ? nearTiles[Math.floor(random() * nearTiles.length)] : pos;
          const enemies = spawnEnemyAtPos(state.floor, spawnPos);
          if (enemies) {
            state.entities.push(enemies);
            spawned++;
          }
        }
      }
      state.messages.push({ text: `The void answers with hostility! ${spawned} enemies materialize nearby!`, color: MSG_COLORS.ENEMY_ATK });
      state.pendingFloatingTexts.push({ text: "DANGER!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
    },
  },
  {
    weight: 10,
    label: "curse",
    apply: (state) => {
      const weapon = state.inventory.equippedWeapon;
      const armor = state.inventory.equippedArmor;
      if (weapon && armor) {
        if (random() < 0.5) {
          const penalty = Math.max(1, Math.floor((weapon.attack ?? 0) * 0.3));
          state.inventory.equippedWeapon = { ...weapon, attack: Math.max(1, (weapon.attack ?? 0) - penalty) };
          state.messages.push({ text: `The void curses your ${weapon.name}! (-${penalty} ATK)`, color: MSG_COLORS.ENEMY_ATK });
          state.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
        } else {
          const penalty = Math.max(1, Math.floor((armor.defense ?? 0) * 0.3));
          state.inventory.equippedArmor = { ...armor, defense: Math.max(0, (armor.defense ?? 0) - penalty) };
          state.messages.push({ text: `The void curses your ${armor.name}! (-${penalty} DEF)`, color: MSG_COLORS.ENEMY_ATK });
          state.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
        }
      } else if (weapon) {
        const penalty = Math.max(1, Math.floor((weapon.attack ?? 0) * 0.3));
        state.inventory.equippedWeapon = { ...weapon, attack: Math.max(1, (weapon.attack ?? 0) - penalty) };
        state.messages.push({ text: `The void curses your ${weapon.name}! (-${penalty} ATK)`, color: MSG_COLORS.ENEMY_ATK });
        state.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
      } else if (armor) {
        const penalty = Math.max(1, Math.floor((armor.defense ?? 0) * 0.3));
        state.inventory.equippedArmor = { ...armor, defense: Math.max(0, (armor.defense ?? 0) - penalty) };
        state.messages.push({ text: `The void curses your ${armor.name}! (-${penalty} DEF)`, color: MSG_COLORS.ENEMY_ATK });
        state.pendingFloatingTexts.push({ text: "CURSED!", color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
      } else {
        // No equipment — deal damage instead
        const dmg = Math.max(1, Math.floor(state.player.maxHp * 0.15));
        state.player = { ...state.player, hp: Math.max(1, state.player.hp - dmg) };
        state.messages.push({ text: `The void lashes out! (-${dmg} HP)`, color: MSG_COLORS.ENEMY_ATK });
        state.pendingFloatingTexts.push({ text: `-${dmg} HP`, color: "#ef4444", x: state.player.pos.x, y: state.player.pos.y });
      }
    },
  },
  {
    weight: 10,
    label: "teleport_stairs",
    apply: (state) => {
      // Find stairs position
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          if (state.map[y][x] === TileType.STAIRS_DOWN) {
            // Teleport to adjacent tile (not on stairs itself)
            const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
            for (const d of dirs) {
              const nx = x + d.x;
              const ny = y + d.y;
              if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const tile = state.map[ny][nx];
                if (tile === TileType.FLOOR || tile === TileType.SHRINE) {
                  state.player = { ...state.player, pos: { x: nx, y: ny } };
                  state.messages.push({ text: "The void hurls you through space — you land near the stairs!", color: MSG_COLORS.INFO });
                  state.pendingFloatingTexts.push({ text: "TELEPORT", color: "#06b6d4", x: nx, y: ny });
                  // Update FOV
                  state.fov = computeFov(state.map, nx, ny, getAttunementFovRadius(state.voidAttunement, state.floor));
                  state.explored = state.explored.map((row) => [...row]);
                  for (let fy = 0; fy < MAP_HEIGHT; fy++) {
                    for (let fx = 0; fx < MAP_WIDTH; fx++) {
                      if (state.fov[fy][fx]) state.explored[fy][fx] = true;
                    }
                  }
                  return;
                }
              }
            }
          }
        }
      }
      // Fallback if no stairs found (shouldn't happen)
      state.messages.push({ text: "The void shimmers but nothing happens.", color: MSG_COLORS.INFO });
    },
  },
];

const ATTUNEMENT_SHRINE_GAIN = 15; // +15 per shrine use

function pickShrineEffect(): typeof SHRINE_EFFECTS[number] {
  const totalWeight = SHRINE_EFFECTS.reduce((sum, e) => sum + e.weight, 0);
  let roll = random() * totalWeight;
  for (const effect of SHRINE_EFFECTS) {
    roll -= effect.weight;
    if (roll <= 0) return effect;
  }
  return SHRINE_EFFECTS[0];
}

function pickNegativeShrineEffect(): typeof SHRINE_EFFECTS[number] {
  const negative = SHRINE_EFFECTS.filter((e) => e.label === "spawn_enemies" || e.label === "curse");
  const totalWeight = negative.reduce((sum, e) => sum + e.weight, 0);
  let roll = random() * totalWeight;
  for (const effect of negative) {
    roll -= effect.weight;
    if (roll <= 0) return effect;
  }
  return negative[0];
}

export function processShrine(state: GameState, accept: boolean): GameState {
  if (!state.shrinePrompt) return state;

  const newState: GameState = {
    ...state,
    messages: [] as GameMessage[],
    pendingFloatingTexts: [] as FloatingText[],
    pendingHitEffects: [] as HitEffect[],
    pendingShake: 0,
    shrinePrompt: false,
    shrinesUsed: new Set(state.shrinesUsed),
    inventory: { ...state.inventory, items: [...state.inventory.items] },
    statusEffects: state.statusEffects.map((e) => ({ ...e })),
    items: [...state.items],
    entities: state.entities.map((e) => ({ ...e })),
    identified: { ...state.identified },
  };

  // Mark shrine as used regardless of accept/decline
  const key = `${newState.player.pos.x},${newState.player.pos.y}`;
  newState.shrinesUsed.add(key);

  if (!accept) {
    newState.messages.push({ text: "You step away from the shrine.", color: MSG_COLORS.INFO });
    return newState;
  }

  // Apply attunement gain
  const prevAttunement = newState.voidAttunement;
  newState.voidAttunement = Math.min(100, newState.voidAttunement + ATTUNEMENT_SHRINE_GAIN);
  newState.messages.push({ text: `You commune with the Void... (+${ATTUNEMENT_SHRINE_GAIN} Null Attunement)`, color: "#c084fc" });
  newState.pendingFloatingTexts.push({ text: `NULL +${ATTUNEMENT_SHRINE_GAIN}`, color: "#c084fc", x: newState.player.pos.x, y: newState.player.pos.y });

  // Threshold crossing notifications
  if (prevAttunement < 25 && newState.voidAttunement >= 25) {
    newState.messages.push({ text: "Null Attunement 25%: Your vision expands beyond mortal limits... but the darkness knows where you are.", color: "#c084fc" });
    newState.pendingFloatingTexts.push({ text: "VOID SIGHT", color: "#a855f7", x: newState.player.pos.x, y: newState.player.pos.y });
  }
  if (prevAttunement < 50 && newState.voidAttunement >= 50) {
    newState.messages.push({ text: "Null Attunement 50%: Void energy surges through your strikes... but healing grows faint.", color: "#c084fc" });
    newState.pendingFloatingTexts.push({ text: "VOID STRIKE", color: "#a855f7", x: newState.player.pos.x, y: newState.player.pos.y });
  }

  // PARANOID curse: shrines always give negative effects
  const hasParanoidCurse = newState.inventory.equippedArmor?.curse === CurseEffect.PARANOID;
  const effect = hasParanoidCurse ? pickNegativeShrineEffect() : pickShrineEffect();
  if (hasParanoidCurse) {
    newState.messages.push({ text: "Your paranoid armor twists the shrine's power...", color: "#ef4444" });
  }
  effect.apply(newState);

  // Check for player death from curse effect
  if (newState.player.hp <= 0) {
    newState.gameOver = true;
    newState.runStats.killedBy = "Void Shrine";
    newState.messages.push({ text: "The void consumes you...", color: MSG_COLORS.DEATH });
  }

  return newState;
}
