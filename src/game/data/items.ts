import { Item, ItemCategory, ItemRarity, ConsumableEffect, RARITY_COLORS, GroundItem, Position, RunicEffect, WEAPON_RUNICS, ARMOR_RUNICS, RUNIC_NAMES, CurseEffect, WEAPON_CURSES, ARMOR_CURSES, CURSE_NAMES, TileType, WeaponSpecial } from "../config";
import { random } from "../rng";

let nextItemId = 0;

// Randomized cosmetic descriptors for potions (12 descriptors for 7 potion effects)
const POTION_APPEARANCES = [
  "Fizzing", "Crimson", "Murky", "Glowing", "Swirling", "Iridescent",
  "Bubbling", "Pale", "Dark", "Viscous", "Sparkling", "Smoky",
];

// Randomized cosmetic descriptors for scrolls (12 descriptors for 4 scroll effects)
const SCROLL_APPEARANCES = [
  "Tattered", "Gilded", "Charred", "Faded", "Ornate", "Crumpled",
  "Ancient", "Bloodstained", "Shimmering", "Dusty", "Sealed", "Fragile",
];

const POTION_EFFECTS: ConsumableEffect[] = [
  ConsumableEffect.HEAL, ConsumableEffect.HASTE, ConsumableEffect.INVISIBILITY,
  ConsumableEffect.TELEPORT, ConsumableEffect.FIRE, ConsumableEffect.POISON,
  ConsumableEffect.STRENGTH,
];

const SCROLL_EFFECTS: ConsumableEffect[] = [
  ConsumableEffect.MAGIC_MAPPING, ConsumableEffect.ENCHANT,
  ConsumableEffect.FEAR, ConsumableEffect.SUMMON,
  ConsumableEffect.REMOVE_CURSE,
];

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Create randomized per-run mapping of ConsumableEffect -> appearance descriptor */
export function initConsumableAppearances(): Record<string, string> {
  const shuffledPotions = shuffleArray(POTION_APPEARANCES);
  const shuffledScrolls = shuffleArray(SCROLL_APPEARANCES);
  const appearances: Record<string, string> = {};
  POTION_EFFECTS.forEach((effect, i) => {
    appearances[effect] = shuffledPotions[i];
  });
  SCROLL_EFFECTS.forEach((effect, i) => {
    appearances[effect] = shuffledScrolls[i];
  });
  return appearances;
}

/** Create initial identification state — all consumable effects start unidentified */
export function initIdentified(): Record<string, boolean> {
  const identified: Record<string, boolean> = {};
  for (const effect of [...POTION_EFFECTS, ...SCROLL_EFFECTS]) {
    identified[effect] = false;
  }
  return identified;
}

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
  weaponSpecial?: WeaponSpecial;
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
  { name: "Null Scythe", category: ItemCategory.WEAPON, rarity: ItemRarity.RARE, symbol: "/", attack: 5, weaponSpecial: WeaponSpecial.CLEAVE, minFloor: 8, description: "Sweeps through multiple foes. Hits an adjacent enemy on each attack." },
  { name: "Rift Dagger", category: ItemCategory.WEAPON, rarity: ItemRarity.RARE, symbol: "/", attack: 3, weaponSpecial: WeaponSpecial.DOUBLE_STRIKE, minFloor: 8, description: "Strikes twice per attack. Each hit can trigger runics." },

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
  { name: "Scroll of Remove Curse", category: ItemCategory.SCROLL, rarity: ItemRarity.UNCOMMON, symbol: "?", effect: ConsumableEffect.REMOVE_CURSE, minFloor: 2, description: "Lifts curses from all equipped items." },
];

function rollRarity(floor: number): ItemRarity {
  const roll = random();
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

function rollRunic(category: ItemCategory, rarity: ItemRarity): RunicEffect | undefined {
  if (category !== ItemCategory.WEAPON && category !== ItemCategory.ARMOR) return undefined;
  const chance = rarity === ItemRarity.RARE ? 0.60 : rarity === ItemRarity.UNCOMMON ? 0.25 : 0;
  if (chance === 0 || random() > chance) return undefined;
  const pool = category === ItemCategory.WEAPON ? WEAPON_RUNICS : ARMOR_RUNICS;
  return pool[Math.floor(random() * pool.length)];
}

function rollCurse(category: ItemCategory, rarity: ItemRarity): CurseEffect | undefined {
  if (category !== ItemCategory.WEAPON && category !== ItemCategory.ARMOR) return undefined;
  // 15% of Uncommon, 30% of Rare spawn cursed
  const chance = rarity === ItemRarity.RARE ? 0.30 : rarity === ItemRarity.UNCOMMON ? 0.15 : 0;
  if (chance === 0 || random() > chance) return undefined;
  const pool = category === ItemCategory.WEAPON ? WEAPON_CURSES : ARMOR_CURSES;
  return pool[Math.floor(random() * pool.length)];
}

function applyRunicToItem(item: Item): Item {
  const runic = rollRunic(item.category, item.rarity);
  if (runic) {
    item = { ...item, runic, name: `${item.name} of ${RUNIC_NAMES[runic]}` };
  }
  // Roll curse independently — an item can have both a runic and a curse
  const curse = rollCurse(item.category, item.rarity);
  if (curse) {
    item = { ...item, cursed: true, curse, name: `${item.name} (cursed)` };
  }
  return item;
}

export function generateLootDrop(floor: number, pos: Position): GroundItem | null {
  // Drop chance: 35% base + 3% per floor, capped at 60%
  const dropChance = Math.min(0.60, 0.35 + floor * 0.03);
  if (random() > dropChance) return null;

  const rarity = rollRarity(floor);

  // Filter templates by floor and rarity
  const eligible = ITEM_TEMPLATES.filter(
    (t) => t.minFloor <= floor && t.rarity === rarity
  );
  if (eligible.length === 0) return null;

  const template = eligible[Math.floor(random() * eligible.length)];

  const item = applyRunicToItem({
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
    weaponSpecial: template.weaponSpecial,
    minFloor: template.minFloor,
    description: template.description,
  });

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
    const template = rareEquipment[Math.floor(random() * rareEquipment.length)];
    loot.push({
      item: applyRunicToItem({
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
      }),
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
    const template = rareConsumables[Math.floor(random() * rareConsumables.length)];
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

/**
 * Guaranteed floor loot (pity mechanic): pre-place items at generation time
 * so every non-boss floor has at least 1 random item + 1 healing potion.
 * Items are placed in rooms the player won't start in.
 */
export function generateGuaranteedFloorLoot(
  floor: number,
  rooms: { x: number; y: number; width: number; height: number }[],
  map: TileType[][],
  playerStart: Position,
): GroundItem[] {
  if (rooms.length < 2) return [];

  const loot: GroundItem[] = [];
  const usedPositions = new Set<string>();

  // Helper: pick a random floor tile in a room that isn't the player start room
  function pickLootPosition(): Position | null {
    // Candidate rooms: skip the first room (player start)
    const candidates = rooms.slice(1);
    // Shuffle candidates so we try different rooms
    for (let attempt = 0; attempt < 20; attempt++) {
      const room = candidates[Math.floor(random() * candidates.length)];
      const x = room.x + 1 + Math.floor(random() * Math.max(1, room.width - 2));
      const y = room.y + 1 + Math.floor(random() * Math.max(1, room.height - 2));
      const key = `${x},${y}`;
      if (
        !usedPositions.has(key) &&
        map[y]?.[x] === TileType.FLOOR &&
        (Math.abs(x - playerStart.x) + Math.abs(y - playerStart.y)) > 3
      ) {
        usedPositions.add(key);
        return { x, y };
      }
    }
    return null;
  }

  // 1. Guaranteed random item (weapon, armor, or consumable)
  const pos1 = pickLootPosition();
  if (pos1) {
    const rarity = rollRarity(floor);
    const eligible = ITEM_TEMPLATES.filter(
      (t) => t.minFloor <= floor && t.rarity === rarity
    );
    if (eligible.length > 0) {
      const template = eligible[Math.floor(random() * eligible.length)];
      const item = applyRunicToItem({
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
      });
      loot.push({ item, pos: pos1 });
    }
  }

  // 2. Guaranteed healing potion (scales with floor depth)
  const pos2 = pickLootPosition();
  if (pos2) {
    let healTemplate: ItemTemplate;
    if (floor >= 6) {
      healTemplate = ITEM_TEMPLATES.find(t => t.name === "Major Health Potion")!;
    } else if (floor >= 3) {
      healTemplate = ITEM_TEMPLATES.find(t => t.name === "Health Potion")!;
    } else {
      healTemplate = ITEM_TEMPLATES.find(t => t.name === "Minor Health Potion")!;
    }
    loot.push({
      item: {
        id: `item_${nextItemId++}`,
        name: healTemplate.name,
        category: healTemplate.category,
        rarity: healTemplate.rarity,
        symbol: healTemplate.symbol,
        color: RARITY_COLORS[healTemplate.rarity],
        attack: healTemplate.attack,
        defense: healTemplate.defense,
        healAmount: healTemplate.healAmount,
        effect: healTemplate.effect,
        effectValue: healTemplate.effectValue,
        minFloor: healTemplate.minFloor,
        description: healTemplate.description,
      },
      pos: pos2,
    });
  }

  return loot;
}

export function resetItemIds() {
  nextItemId = 0;
}
