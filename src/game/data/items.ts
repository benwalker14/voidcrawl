import { Item, ItemCategory, ItemRarity, ConsumableEffect, RARITY_COLORS, GroundItem, Position } from "../config";

let nextItemId = 0;

interface ItemTemplate {
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  symbol: string;
  attack?: number;
  defense?: number;
  healAmount?: number;
  effect?: ConsumableEffect;
  effectValue?: number;
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

  // Health Potions
  { name: "Minor Health Potion", category: ItemCategory.POTION, rarity: ItemRarity.COMMON, symbol: "!", healAmount: 10, effect: ConsumableEffect.HEAL, minFloor: 1, description: "Restores a small amount of health." },
  { name: "Health Potion", category: ItemCategory.POTION, rarity: ItemRarity.UNCOMMON, symbol: "!", healAmount: 20, effect: ConsumableEffect.HEAL, minFloor: 3, description: "Restores a moderate amount of health." },
  { name: "Major Health Potion", category: ItemCategory.POTION, rarity: ItemRarity.RARE, symbol: "!", healAmount: 40, effect: ConsumableEffect.HEAL, minFloor: 6, description: "Restores a large amount of health." },

  // Tactical Potions
  { name: "Haste Potion", category: ItemCategory.POTION, rarity: ItemRarity.UNCOMMON, symbol: "!", effect: ConsumableEffect.HASTE, effectValue: 8, minFloor: 2, description: "Enemies move at half speed for 8 turns." },
  { name: "Invisibility Potion", category: ItemCategory.POTION, rarity: ItemRarity.RARE, symbol: "!", effect: ConsumableEffect.INVISIBILITY, effectValue: 10, minFloor: 4, description: "Enemies cannot detect you for 10 turns." },
  { name: "Teleport Potion", category: ItemCategory.POTION, rarity: ItemRarity.COMMON, symbol: "!", effect: ConsumableEffect.TELEPORT, minFloor: 1, description: "Instantly teleport to a random location." },
  { name: "Fire Potion", category: ItemCategory.POTION, rarity: ItemRarity.UNCOMMON, symbol: "!", effect: ConsumableEffect.FIRE, effectValue: 8, minFloor: 3, description: "Explodes, dealing 8 damage to nearby enemies." },
  { name: "Poison Potion", category: ItemCategory.POTION, rarity: ItemRarity.UNCOMMON, symbol: "!", effect: ConsumableEffect.POISON, effectValue: 5, minFloor: 2, description: "Poisons nearby enemies for 5 turns." },
  { name: "Strength Potion", category: ItemCategory.POTION, rarity: ItemRarity.RARE, symbol: "!", effect: ConsumableEffect.STRENGTH, effectValue: 10, minFloor: 3, description: "+3 ATK for 10 turns." },

  // Scrolls
  { name: "Scroll of Mapping", category: ItemCategory.SCROLL, rarity: ItemRarity.UNCOMMON, symbol: "?", effect: ConsumableEffect.MAGIC_MAPPING, minFloor: 1, description: "Reveals the entire floor layout." },
  { name: "Scroll of Enchanting", category: ItemCategory.SCROLL, rarity: ItemRarity.RARE, symbol: "?", effect: ConsumableEffect.ENCHANT, effectValue: 2, minFloor: 3, description: "Enchants equipped weapon or armor (+2)." },
  { name: "Scroll of Fear", category: ItemCategory.SCROLL, rarity: ItemRarity.UNCOMMON, symbol: "?", effect: ConsumableEffect.FEAR, effectValue: 6, minFloor: 2, description: "All visible enemies flee for 6 turns." },
  { name: "Scroll of Summoning", category: ItemCategory.SCROLL, rarity: ItemRarity.RARE, symbol: "?", effect: ConsumableEffect.SUMMON, effectValue: 15, minFloor: 5, description: "Summons a void spirit ally for 15 turns." },
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
    effect: template.effect,
    effectValue: template.effectValue,
    minFloor: template.minFloor,
    description: template.description,
  };

  return { item, pos: { ...pos } };
}

export function generateBossLoot(floor: number, pos: Position): GroundItem[] {
  const loot: GroundItem[] = [];

  // Guaranteed rare weapon or armor
  const rareEquipment = ITEM_TEMPLATES.filter(
    (t) =>
      t.rarity === ItemRarity.RARE &&
      (t.category === ItemCategory.WEAPON || t.category === ItemCategory.ARMOR)
  );
  if (rareEquipment.length > 0) {
    const template = rareEquipment[Math.floor(Math.random() * rareEquipment.length)];
    loot.push({
      item: {
        id: `item_${nextItemId++}`,
        name: template.name,
        category: template.category,
        rarity: template.rarity,
        symbol: template.symbol,
        color: RARITY_COLORS[template.rarity],
        attack: template.attack,
        defense: template.defense,
        healAmount: template.healAmount,
        effect: template.effect,
        effectValue: template.effectValue,
        minFloor: template.minFloor,
        description: template.description,
      },
      pos: { x: pos.x, y: pos.y },
    });
  }

  // Guaranteed rare consumable
  const rareConsumables = ITEM_TEMPLATES.filter(
    (t) =>
      t.rarity === ItemRarity.RARE &&
      (t.category === ItemCategory.POTION || t.category === ItemCategory.SCROLL) &&
      t.minFloor <= floor
  );
  if (rareConsumables.length > 0) {
    const template = rareConsumables[Math.floor(Math.random() * rareConsumables.length)];
    loot.push({
      item: {
        id: `item_${nextItemId++}`,
        name: template.name,
        category: template.category,
        rarity: template.rarity,
        symbol: template.symbol,
        color: RARITY_COLORS[template.rarity],
        attack: template.attack,
        defense: template.defense,
        healAmount: template.healAmount,
        effect: template.effect,
        effectValue: template.effectValue,
        minFloor: template.minFloor,
        description: template.description,
      },
      pos: { x: pos.x + 1, y: pos.y },
    });
  }

  return loot;
}

export function resetItemIds() {
  nextItemId = 0;
}
