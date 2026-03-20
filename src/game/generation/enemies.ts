import { GameEntity, EntityType, Position } from "../config";

interface EnemyTemplate {
  name: string;
  symbol: string;
  color: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseXp: number;
  minFloor: number;
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  { name: "Void Rat", symbol: "r", color: "#8b5cf6", baseHp: 4, baseAttack: 2, baseDefense: 0, baseXp: 5, minFloor: 1 },
  { name: "Shadow Wisp", symbol: "w", color: "#a78bfa", baseHp: 3, baseAttack: 3, baseDefense: 0, baseXp: 6, minFloor: 1 },
  { name: "Void Beetle", symbol: "b", color: "#7c3aed", baseHp: 6, baseAttack: 2, baseDefense: 1, baseXp: 8, minFloor: 1 },
  { name: "Dark Slime", symbol: "s", color: "#4c1d95", baseHp: 8, baseAttack: 3, baseDefense: 1, baseXp: 12, minFloor: 2 },
  { name: "Shade", symbol: "S", color: "#6d28d9", baseHp: 10, baseAttack: 4, baseDefense: 2, baseXp: 18, minFloor: 3 },
  { name: "Void Walker", symbol: "W", color: "#5b21b6", baseHp: 14, baseAttack: 5, baseDefense: 2, baseXp: 25, minFloor: 4 },
  { name: "Abyssal Hound", symbol: "H", color: "#c084fc", baseHp: 18, baseAttack: 6, baseDefense: 3, baseXp: 35, minFloor: 5 },
  { name: "Rift Wraith", symbol: "R", color: "#e9d5ff", baseHp: 22, baseAttack: 7, baseDefense: 4, baseXp: 50, minFloor: 7 },
  { name: "Void Lord", symbol: "V", color: "#f5f3ff", baseHp: 30, baseAttack: 9, baseDefense: 5, baseXp: 75, minFloor: 10 },
];

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
      pos = floorTiles[Math.floor(Math.random() * floorTiles.length)];
      attempts++;
    } while (usedPositions.has(`${pos.x},${pos.y}`) && attempts < 50);

    if (attempts >= 50) break;
    usedPositions.add(`${pos.x},${pos.y}`);

    // Pick random enemy weighted toward lower-tier
    const template = eligible[Math.floor(Math.random() * eligible.length)];
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
    });
  }

  return enemies;
}
