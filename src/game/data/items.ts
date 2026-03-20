import { Item, ItemCategory, ItemRarity, RARITY_COLORS, GroundItem, Position } from "../config";

let nextItemId = 0;

interface ItemTemplate {
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  symbol: string;
  attack?: number;
  defense?: number;
  healAmount?: number;
  minFloor: number;
  description: string;
}

const ITEM_TEMPLATES: ItemTemplate[] = [
  // Weapons
  { name: "Rusty Dagger", category: ItemCategory.WEAPON, rarity: ItemRarity.COMMON, symbol: "/", attack: 1, minFloor: 1, description: "A dull, corroded blade." },
  { name: "Short Sword", category: ItemCategory.WEAPON, rarity: ItemRarity.COMMON, symbol: "/", attack: 2, minFloor: 1, description: "A reliable short blade." },
  { name: "Void Blade", category: ItemCategory.WEAPON, rarity: ItemRarity.UNCOMMON, symbol: "/", attack: 3, minFloor: 2, description: "Hums with dark energy." },
  { name: "Shadow Axe", category: ItemCategory.WEAPON, rarity: ItemRarity.UNCOMMON, symbol: "/", attack: 4, minFloor: 4, description: "Forged from condensed shadows." },
  { name: "Abyssal Edge", category: ItemCategory.WEAPON, rarity: ItemRarity.RARE, symbol: "/", attack: 6, minFloor: 6, description: "A blade that cuts reality itself." },

  // Armor
  { name: "Tattered Cloak", category: ItemCategory.ARMOR, rarity: ItemRarity.COMMON, symbol: "[", defense: 1, minFloor: 1, description: "Thin but better than nothing." },
  { name: "Leather Vest", category: ItemCategory.ARMOR, rarity: ItemRarity.COMMON, symbol: "[", defense: 2, minFloor: 1, description: "Sturdy leather protection." },
  { name: "Void Mail", category: ItemCategory.ARMOR, rarity: ItemRarity.UNCOMMON, symbol: "[", defense: 3, minFloor: 2, description: "Chainmail infused with void essence." },
  { name: "Shadow Plate", category: ItemCategory.ARMOR, rarity: ItemRarity.UNCOMMON, symbol: "[", defense: 4, minFloor: 4, description: "Heavy armor made of crystallized shadow." },
  { name: "Abyssal Ward", category: ItemCategory.ARMOR, rarity: ItemRarity.RARE, symbol: "[", defense: 6, minFloor: 6, description: "Warps space to deflect blows." },

  // Potions
  { name: "Minor Health Potion", category: ItemCategory.POTION, rarity: ItemRarity.COMMON, symbol: "!", healAmount: 10, minFloor: 1, description: "Restores a small amount of health." },
  { name: "Health Potion", category: ItemCategory.POTION, rarity: ItemRarity.UNCOMMON, symbol: "!", healAmount: 20, minFloor: 3, description: "Restores a moderate amount of health." },
  { name: "Major Health Potion", category: ItemCategory.POTION, rarity: ItemRarity.RARE, symbol: "!", healAmount: 40, minFloor: 6, description: "Restores a large amount of health." },
];

function rollRarity(floor: number): ItemRarity {
  const roll = Math.random();
  if (floor >= 7) {
    if (roll < 0.30) return ItemRarity.RARE;
    if (roll < 0.70) return ItemRarity.UNCOMMON;
    return ItemRarity.COMMON;
  } else if (floor >= 4) {
    if (roll < 0.15) return ItemRarity.RARE;
    if (roll < 0.50) return ItemRarity.UNCOMMON;
    return ItemRarity.COMMON;
  } else {
    if (roll < 0.05) return ItemRarity.RARE;
    if (roll < 0.30) return ItemRarity.UNCOMMON;
    return ItemRarity.COMMON;
  }
}

export function generateLootDrop(floor: number, pos: Position): GroundItem | null {
  // Drop chance: 35% base + 3% per floor, capped at 60%
  const dropChance = Math.min(0.60, 0.35 + floor * 0.03);
  if (Math.random() > dropChance) return null;

  const rarity = rollRarity(floor);

  // Filter templates by floor and rarity
  const eligible = ITEM_TEMPLATES.filter(
    (t) => t.minFloor <= floor && t.rarity === rarity
  );
  if (eligible.length === 0) return null;

  const template = eligible[Math.floor(Math.random() * eligible.length)];

  const item: Item = {
    id: `item_${nextItemId++}`,
    name: template.name,
    category: template.category,
    rarity: template.rarity,
    symbol: template.symbol,
    color: RARITY_COLORS[template.rarity],
    attack: template.attack,
    defense: template.defense,
    healAmount: template.healAmount,
    minFloor: template.minFloor,
    description: template.description,
  };

  return { item, pos: { ...pos } };
}

export function resetItemIds() {
  nextItemId = 0;
}
