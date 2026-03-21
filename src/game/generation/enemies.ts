import { GameEntity, EntityType, Position, AIBehavior, SpecialAbility, MAP_WIDTH, MAP_HEIGHT, TileType } from "../config";
import { random } from "../rng";

interface EnemyTemplate {
  name: string;
  symbol: string;
  color: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseXp: number;
  minFloor: number;
  behavior: AIBehavior;
  detectRange: number;
  specialAbility?: SpecialAbility;
  // Spawn weights per zone: [Null Tunnels (1-4), Crystal Depths (5-9), Shadow Realm (10+)]
  zoneWeights: [number, number, number];
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  //                                                                                                                                                                    Null  Crystal  Shadow
  { name: "Void Rat",       symbol: "r", color: "#8b5cf6", baseHp: 4,  baseAttack: 2, baseDefense: 0, baseXp: 5,  minFloor: 1,  behavior: AIBehavior.WANDER, detectRange: 5,                                          zoneWeights: [10, 2, 1] },
  { name: "Shadow Wisp",    symbol: "w", color: "#a78bfa", baseHp: 3,  baseAttack: 3, baseDefense: 0, baseXp: 6,  minFloor: 1,  behavior: AIBehavior.COWARD, detectRange: 10, specialAbility: SpecialAbility.PHASE,     zoneWeights: [8, 2, 1] },
  { name: "Void Beetle",    symbol: "b", color: "#7c3aed", baseHp: 6,  baseAttack: 2, baseDefense: 1, baseXp: 8,  minFloor: 1,  behavior: AIBehavior.WANDER, detectRange: 6,  specialAbility: SpecialAbility.ARMORED,   zoneWeights: [8, 2, 1] },
  { name: "Dark Slime",     symbol: "s", color: "#4c1d95", baseHp: 8,  baseAttack: 3, baseDefense: 1, baseXp: 12, minFloor: 2,  behavior: AIBehavior.AMBUSH, detectRange: 3,  specialAbility: SpecialAbility.SPLIT,     zoneWeights: [6, 3, 2] },
  { name: "Shade",          symbol: "S", color: "#6d28d9", baseHp: 10, baseAttack: 4, baseDefense: 2, baseXp: 18, minFloor: 3,  behavior: AIBehavior.AMBUSH, detectRange: 4,  specialAbility: SpecialAbility.LIFE_DRAIN, zoneWeights: [3, 8, 3] },
  { name: "Void Walker",    symbol: "W", color: "#5b21b6", baseHp: 14, baseAttack: 5, baseDefense: 2, baseXp: 25, minFloor: 4,  behavior: AIBehavior.CHASE,  detectRange: 10, specialAbility: SpecialAbility.TELEPORT,  zoneWeights: [1, 8, 3] },
  { name: "Abyssal Hound",  symbol: "H", color: "#c084fc", baseHp: 18, baseAttack: 6, baseDefense: 3, baseXp: 35, minFloor: 5,  behavior: AIBehavior.CHASE,  detectRange: 12, specialAbility: SpecialAbility.HOWL,      zoneWeights: [0, 8, 5] },
  { name: "Crystal Sentinel",symbol: "C", color: "#22d3ee", baseHp: 16, baseAttack: 5, baseDefense: 4, baseXp: 30, minFloor: 5,  behavior: AIBehavior.CHASE,  detectRange: 8,  specialAbility: SpecialAbility.REFLECTIVE, zoneWeights: [0, 9, 2] },
  { name: "Null Siphon",    symbol: "n", color: "#3b82f6", baseHp: 12, baseAttack: 4, baseDefense: 1, baseXp: 28, minFloor: 5,  behavior: AIBehavior.AMBUSH, detectRange: 6,  specialAbility: SpecialAbility.SIPHON,     zoneWeights: [0, 9, 2] },
  { name: "Rift Wraith",    symbol: "R", color: "#e9d5ff", baseHp: 22, baseAttack: 7, baseDefense: 4, baseXp: 50, minFloor: 7,  behavior: AIBehavior.CHASE,  detectRange: 14, specialAbility: SpecialAbility.ETHEREAL,  zoneWeights: [0, 2, 10] },
  { name: "Void Lord",      symbol: "V", color: "#f5f3ff", baseHp: 30, baseAttack: 9, baseDefense: 5, baseXp: 75, minFloor: 10, behavior: AIBehavior.CHASE,  detectRange: 16,                                          zoneWeights: [0, 1, 10] },
];

/** Get zone index from floor number for weighted spawning */
function getZoneIndex(floor: number): number {
  if (floor <= 4) return 0; // Null Tunnels
  if (floor <= 9) return 1; // Crystal Depths
  return 2;                  // Shadow Realm
}

/** Pick an enemy template using zone-weighted random selection */
function weightedPickTemplate(eligible: EnemyTemplate[], floor: number): EnemyTemplate {
  const zone = getZoneIndex(floor);
  const totalWeight = eligible.reduce((sum, t) => sum + t.zoneWeights[zone], 0);
  if (totalWeight <= 0) return eligible[Math.floor(random() * eligible.length)];
  let roll = random() * totalWeight;
  for (const template of eligible) {
    roll -= template.zoneWeights[zone];
    if (roll <= 0) return template;
  }
  return eligible[eligible.length - 1];
}

let nextEnemyId = 1;

export function spawnEnemies(floor: number, floorTiles: Position[]): GameEntity[] {
  const eligible = ENEMY_TEMPLATES.filter((t) => t.minFloor <= floor);
  const count = Math.min(3 + Math.floor(floor * 1.5), floorTiles.length - 2);
  const enemies: GameEntity[] = [];
  const usedPositions = new Set<string>();

  for (let i = 0; i < count; i++) {
    if (floorTiles.length === 0) break;

    // Pick random position
    let pos: Position;
    let attempts = 0;
    do {
      pos = floorTiles[Math.floor(random() * floorTiles.length)];
      attempts++;
    } while (usedPositions.has(`${pos.x},${pos.y}`) && attempts < 50);

    if (attempts >= 50) break;
    usedPositions.add(`${pos.x},${pos.y}`);

    // Pick enemy weighted by zone
    const template = weightedPickTemplate(eligible, floor);
    const scaling = 1 + (floor - 1) * 0.15;

    enemies.push({
      id: `enemy_${nextEnemyId++}`,
      type: EntityType.ENEMY,
      pos: { ...pos },
      name: template.name,
      hp: Math.floor(template.baseHp * scaling),
      maxHp: Math.floor(template.baseHp * scaling),
      attack: Math.floor(template.baseAttack * scaling),
      defense: Math.floor(template.baseDefense * scaling),
      color: template.color,
      symbol: template.symbol,
      xpReward: Math.floor(template.baseXp * scaling),
      behavior: template.behavior,
      detectRange: template.detectRange,
      specialAbility: template.specialAbility,
    });
  }

  return enemies;
}

export function spawnEnemyAtPos(floor: number, pos: Position): GameEntity {
  const eligible = ENEMY_TEMPLATES.filter((t) => t.minFloor <= floor);
  const template = weightedPickTemplate(eligible, floor);
  const scaling = 1 + (floor - 1) * 0.15;

  return {
    id: `enemy_${nextEnemyId++}`,
    type: EntityType.ENEMY,
    pos: { ...pos },
    name: template.name,
    hp: Math.floor(template.baseHp * scaling),
    maxHp: Math.floor(template.baseHp * scaling),
    attack: Math.floor(template.baseAttack * scaling),
    defense: Math.floor(template.baseDefense * scaling),
    color: template.color,
    symbol: template.symbol,
    xpReward: Math.floor(template.baseXp * scaling),
    behavior: template.behavior,
    detectRange: template.detectRange,
    specialAbility: template.specialAbility,
  };
}

export function spawnBoss(floor: number, map: TileType[][]): GameEntity {
  // Boss spawns at top-center of the boss room
  // Find the center of the room (it's a single large room)
  let centerX = Math.floor(MAP_WIDTH / 2);
  let centerY = 0;

  // Find the topmost floor row and center the boss there
  for (let y = 0; y < MAP_HEIGHT; y++) {
    if (map[y][centerX] === TileType.FLOOR) {
      centerY = y + 2; // A couple tiles down from the top wall
      break;
    }
  }

  const scaling = 1 + (floor - 1) * 0.15;

  return {
    id: `boss_nucleus_${nextEnemyId++}`,
    type: EntityType.ENEMY,
    pos: { x: centerX, y: centerY },
    name: "Void Nucleus",
    hp: Math.floor(60 * scaling),
    maxHp: Math.floor(60 * scaling),
    attack: Math.floor(8 * scaling),
    defense: Math.floor(3 * scaling),
    color: "#06b6d4",
    symbol: "O",
    xpReward: Math.floor(150 * scaling),
    behavior: AIBehavior.AMBUSH,
    detectRange: 20,
    specialAbility: SpecialAbility.BOSS_NUCLEUS,
    isBoss: true,
    bossPhase: 0,         // Start in spawn phase
    bossTurnCounter: 0,   // Spawn adds immediately on first turn
    bossTelegraphed: false,
  };
}

export function spawnShadowTwin(floor: number, map: TileType[][]): GameEntity {
  // Boss spawns at top-center of the boss room
  let centerX = Math.floor(MAP_WIDTH / 2);
  let centerY = 0;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    if (map[y][centerX] === TileType.FLOOR) {
      centerY = y + 2;
      break;
    }
  }

  const scaling = 1 + (floor - 1) * 0.15;

  return {
    id: `boss_shadow_twin_${nextEnemyId++}`,
    type: EntityType.ENEMY,
    pos: { x: centerX, y: centerY },
    name: "Shadow Twin",
    hp: Math.floor(75 * scaling),
    maxHp: Math.floor(75 * scaling),
    attack: Math.floor(8 * scaling),
    defense: Math.floor(4 * scaling),
    color: "#dc2626",
    symbol: "@",
    xpReward: Math.floor(200 * scaling),
    behavior: AIBehavior.CHASE,
    detectRange: 20,
    specialAbility: SpecialAbility.BOSS_SHADOW_TWIN,
    isBoss: true,
    bossPhase: 0,         // Phase 0 = Mirror
    bossTurnCounter: 0,
    bossTelegraphed: false,
  };
}

export function spawnShadowClone(original: GameEntity, pos: Position): GameEntity {
  const id = `boss_shadow_clone_${nextEnemyId++}`;
  return {
    id,
    type: EntityType.ENEMY,
    pos: { ...pos },
    name: "Shadow Twin",
    hp: Math.floor(original.maxHp * 0.6),
    maxHp: Math.floor(original.maxHp * 0.6),
    attack: Math.floor(original.attack * 0.6),
    defense: Math.floor(original.defense * 0.6),
    color: "#b91c1c",
    symbol: "@",
    xpReward: Math.floor((original.xpReward ?? 200) * 0.3),
    behavior: AIBehavior.CHASE,
    detectRange: 20,
    specialAbility: SpecialAbility.BOSS_SHADOW_TWIN,
    isBoss: true,
    bossPhase: 1,         // Phase 1 = Shadow Split (chase + kill timer)
    bossTurnCounter: 0,
    bossTelegraphed: false,
    splitTurnTimer: 0,
    isClone: true,
    linkedCloneId: original.id,
  };
}

export function spawnRiftWarden(floor: number, map: TileType[][]): GameEntity {
  // Boss spawns at top-center of the boss room
  let centerX = Math.floor(MAP_WIDTH / 2);
  let centerY = 0;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    if (map[y][centerX] === TileType.FLOOR) {
      centerY = y + 2;
      break;
    }
  }

  const scaling = 1 + (floor - 1) * 0.15;

  return {
    id: `boss_rift_warden_${nextEnemyId++}`,
    type: EntityType.ENEMY,
    pos: { x: centerX, y: centerY },
    name: "Rift Warden",
    hp: Math.floor(90 * scaling),
    maxHp: Math.floor(90 * scaling),
    attack: Math.floor(9 * scaling),
    defense: Math.floor(5 * scaling),
    color: "#fbbf24",         // Gold/white
    symbol: "W",
    xpReward: Math.floor(300 * scaling),
    behavior: AIBehavior.AMBUSH,
    detectRange: 20,
    specialAbility: SpecialAbility.BOSS_RIFT_WARDEN,
    isBoss: true,
    bossPhase: 0,             // Phase 0 = Sentinel
    bossTurnCounter: 0,
    bossTelegraphed: false,
    wardenDamageReduction: 0.8, // 80% damage reduction while anchors exist
  };
}

export function spawnRiftAnchor(pos: Position, floor: number): GameEntity {
  const scaling = 1 + (floor - 1) * 0.15;

  return {
    id: `rift_anchor_${nextEnemyId++}`,
    type: EntityType.ENEMY,
    pos: { ...pos },
    name: "Rift Anchor",
    hp: Math.floor(15 * scaling),
    maxHp: Math.floor(15 * scaling),
    attack: 0,
    defense: Math.floor(2 * scaling),
    color: "#d4d4d8",         // Light gray
    symbol: "+",
    xpReward: Math.floor(15 * scaling),
    behavior: AIBehavior.AMBUSH,
    detectRange: 0,
    isAnchor: true,
  };
}

export function spawnBossAdd(floor: number, pos: Position): GameEntity {
  const scaling = 1 + (floor - 1) * 0.15;

  return {
    id: `boss_add_${nextEnemyId++}`,
    type: EntityType.ENEMY,
    pos: { ...pos },
    name: "Void Fragment",
    hp: Math.floor(6 * scaling),
    maxHp: Math.floor(6 * scaling),
    attack: Math.floor(3 * scaling),
    defense: Math.floor(1 * scaling),
    color: "#67e8f9",
    symbol: "o",
    xpReward: Math.floor(8 * scaling),
    behavior: AIBehavior.CHASE,
    detectRange: 20,
  };
}
