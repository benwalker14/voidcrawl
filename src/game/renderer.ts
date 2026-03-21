import {
  GameState,
  TileType,
  TILE_SIZE,
  SCALE,
  VIEWPORT_TILES_X,
  VIEWPORT_TILES_Y,
  MAP_WIDTH,
  MAP_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  EnemyIntent,
  SpecialAbility,
  TrapType,
  ItemCategory,
  Item,
  RunicEffect,
  WeaponSpecial,
  CurseEffect,
  RUNIC_NAMES,
  WEAPON_SPECIAL_NAMES,
  CURSE_NAMES,
  getZoneTileColors,
  getZoneTheme,
} from "./config";

export const FLOAT_DURATION = 800;
export const HIT_EFFECT_DURATION = 250;

export interface ActiveFloatingText {
  text: string;
  color: string;
  x: number;
  y: number;
  startTime: number;
}

export interface ActiveHitEffect {
  x: number;
  y: number;
  color: string;
  isPlayerAttack: boolean;
  startTime: number;
}

const SCALED_TILE = TILE_SIZE * SCALE;

/** Lighten or darken a hex color by a factor (-1 to 1). Positive = lighter, negative = darker. */
function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const adjust = (c: number) => {
    if (factor > 0) return Math.min(255, Math.round(c + (255 - c) * factor));
    return Math.max(0, Math.round(c * (1 + factor)));
  };
  const rr = adjust(r).toString(16).padStart(2, "0");
  const gg = adjust(g).toString(16).padStart(2, "0");
  const bb = adjust(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

// Mini-map constants
const MINIMAP_TILE = 3; // pixels per tile on minimap
const MINIMAP_PADDING = 8;

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const zoneTileColors = getZoneTileColors(state.floor);
  const zone = getZoneTheme(state.floor);

  // Clear with zone background color
  ctx.fillStyle = zone.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Camera centered on player
  const camX = Math.max(
    0,
    Math.min(state.player.pos.x - Math.floor(VIEWPORT_TILES_X / 2), MAP_WIDTH - VIEWPORT_TILES_X)
  );
  const camY = Math.max(
    0,
    Math.min(state.player.pos.y - Math.floor(VIEWPORT_TILES_Y / 2), MAP_HEIGHT - VIEWPORT_TILES_Y)
  );

  // Draw tiles
  for (let vy = 0; vy < VIEWPORT_TILES_Y; vy++) {
    for (let vx = 0; vx < VIEWPORT_TILES_X; vx++) {
      const mapX = camX + vx;
      const mapY = camY + vy;

      if (mapX >= MAP_WIDTH || mapY >= MAP_HEIGHT) continue;

      const isVisible = state.fov[mapY][mapX];
      const isExplored = state.explored[mapY][mapX];

      if (!isVisible && !isExplored) continue;

      const tile = state.map[mapY][mapX];
      const screenX = vx * SCALED_TILE;
      const screenY = vy * SCALED_TILE;

      // Draw tile
      ctx.fillStyle = zoneTileColors[tile as TileType] || zone.bgColor;
      if (!isVisible) {
        // Dim explored but not visible tiles
        ctx.globalAlpha = 0.3;
      }
      ctx.fillRect(screenX, screenY, SCALED_TILE, SCALED_TILE);
      ctx.globalAlpha = 1.0;

      // Draw stairs symbol
      if (tile === TileType.STAIRS_DOWN && isVisible) {
        ctx.fillStyle = zone.stairsColor;
        ctx.font = `bold ${SCALED_TILE - 4}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(">", screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);
      }

      // Draw shrine symbol with pulsing glow
      if (tile === TileType.SHRINE && isVisible) {
        const shrineKey = `${mapX},${mapY}`;
        const isUsed = state.shrinesUsed?.has(shrineKey);
        if (!isUsed) {
          // Pulsing purple glow behind the symbol
          const pulse = 0.3 + 0.2 * Math.sin(Date.now() / 400);
          ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
          ctx.beginPath();
          ctx.arc(screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2, SCALED_TILE * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#c084fc";
        } else {
          ctx.fillStyle = "#4a3860"; // Dim for used shrines
        }
        ctx.font = `bold ${SCALED_TILE - 4}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);
      }
    }
  }

  // Draw ground items (only visible ones)
  for (const groundItem of state.items) {
    const { item, pos } = groundItem;
    if (!state.fov[pos.y][pos.x]) continue;

    const screenX = (pos.x - camX) * SCALED_TILE;
    const screenY = (pos.y - camY) * SCALED_TILE;

    if (screenX < 0 || screenX >= CANVAS_WIDTH || screenY < 0 || screenY >= CANVAS_HEIGHT) continue;

    ctx.fillStyle = item.color;
    ctx.font = `bold ${SCALED_TILE - 6}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.symbol, screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);
  }

  // Draw void patches (Rift Warden boss hazards)
  for (const patch of state.voidPatches) {
    if (!state.fov[patch.pos.y][patch.pos.x]) continue;

    const screenX = (patch.pos.x - camX) * SCALED_TILE;
    const screenY = (patch.pos.y - camY) * SCALED_TILE;

    if (screenX < 0 || screenX >= CANVAS_WIDTH || screenY < 0 || screenY >= CANVAS_HEIGHT) continue;

    // Pulsing magenta glow for void patches
    const pulse = 0.4 + 0.2 * Math.sin(Date.now() / 400);
    ctx.fillStyle = `rgba(217, 70, 239, ${pulse})`;
    ctx.fillRect(screenX + 4, screenY + 4, SCALED_TILE - 8, SCALED_TILE - 8);

    ctx.fillStyle = "#d946ef";
    ctx.font = `bold ${SCALED_TILE - 8}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u00b7", screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);
  }

  // Draw revealed traps (only visible ones)
  for (const trap of state.traps) {
    if (!trap.revealed) continue;
    if (!state.fov[trap.pos.y][trap.pos.x]) continue;

    const screenX = (trap.pos.x - camX) * SCALED_TILE;
    const screenY = (trap.pos.y - camY) * SCALED_TILE;

    if (screenX < 0 || screenX >= CANVAS_WIDTH || screenY < 0 || screenY >= CANVAS_HEIGHT) continue;

    // Trap color by type
    let trapColor: string;
    switch (trap.type) {
      case TrapType.SPIKE: trapColor = "#ef4444"; break;    // red
      case TrapType.ALARM: trapColor = "#eab308"; break;    // yellow
      case TrapType.TELEPORT: trapColor = "#8b5cf6"; break; // purple
    }

    ctx.fillStyle = trapColor;
    ctx.font = `bold ${SCALED_TILE - 6}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(",", screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);
  }

  // Draw entities (only visible ones)
  for (const entity of state.entities) {
    if (entity.hp <= 0) continue;
    if (!state.fov[entity.pos.y][entity.pos.x]) continue;

    const screenX = (entity.pos.x - camX) * SCALED_TILE;
    const screenY = (entity.pos.y - camY) * SCALED_TILE;

    if (screenX < 0 || screenX >= CANVAS_WIDTH || screenY < 0 || screenY >= CANVAS_HEIGHT) continue;

    // Boss: draw pulsing glow behind symbol
    if (entity.isBoss) {
      const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 300);
      const isShadowTwin = entity.specialAbility === SpecialAbility.BOSS_SHADOW_TWIN;
      const isRiftWarden = entity.specialAbility === SpecialAbility.BOSS_RIFT_WARDEN;
      let glowColor: string;
      if (isShadowTwin) {
        glowColor = entity.bossPhase === 2
          ? `rgba(239, 68, 68, ${pulse})`   // Red glow in desperation
          : entity.bossPhase === 1
          ? `rgba(185, 28, 28, ${pulse})`    // Dark red glow in split
          : `rgba(220, 38, 38, ${pulse})`;   // Red glow in mirror
      } else if (isRiftWarden) {
        glowColor = entity.bossPhase === 2
          ? `rgba(239, 68, 68, ${pulse})`    // Red glow in Final Stand
          : entity.bossPhase === 1
          ? `rgba(251, 191, 36, ${pulse})`   // Gold glow in Unleashed
          : `rgba(212, 212, 216, ${pulse})`; // White/silver glow in Sentinel
      } else {
        glowColor = entity.bossPhase === 1
          ? `rgba(34, 197, 94, ${pulse})`    // Green glow when vulnerable
          : `rgba(6, 182, 212, ${pulse})`;   // Cyan glow normally
      }
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2, SCALED_TILE * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Boss HP bar below symbol
      const barWidth = SCALED_TILE * 1.5;
      const barHeight = 4;
      const barX = screenX + SCALED_TILE / 2 - barWidth / 2;
      const barY = screenY + SCALED_TILE + 2;
      const hpRatio = entity.hp / entity.maxHp;
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = hpRatio > 0.5 ? zone.stairsColor : hpRatio > 0.25 ? "#eab308" : "#ef4444";
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }

    ctx.fillStyle = entity.color;
    ctx.font = `bold ${SCALED_TILE - 4}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(entity.symbol, screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);

    // Draw intent indicator above entity
    if (entity.intent && !entity.friendly) {
      let intentSymbol: string;
      let intentColor: string;
      switch (entity.intent) {
        case EnemyIntent.ATTACKING:
          intentSymbol = "!";
          intentColor = "#ef4444"; // red
          break;
        case EnemyIntent.APPROACHING:
          intentSymbol = "?";
          intentColor = "#eab308"; // yellow
          break;
        case EnemyIntent.FLEEING:
          intentSymbol = "\u2193"; // ↓
          intentColor = "#3b82f6"; // blue
          break;
        case EnemyIntent.IDLE:
        default:
          intentSymbol = "~";
          intentColor = "#6b7280"; // gray
          break;
      }
      ctx.fillStyle = intentColor;
      ctx.font = `bold ${Math.floor(SCALED_TILE * 0.45)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(intentSymbol, screenX + SCALED_TILE / 2, screenY - 1);
    }
  }

  // Draw player
  const playerScreenX = (state.player.pos.x - camX) * SCALED_TILE;
  const playerScreenY = (state.player.pos.y - camY) * SCALED_TILE;

  ctx.fillStyle = state.player.color;
  ctx.font = `bold ${SCALED_TILE - 2}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("@", playerScreenX + SCALED_TILE / 2, playerScreenY + SCALED_TILE / 2);
}

export function renderMinimap(ctx: CanvasRenderingContext2D, state: GameState) {
  const zone = getZoneTheme(state.floor);
  const mmWidth = MAP_WIDTH * MINIMAP_TILE;
  const mmHeight = MAP_HEIGHT * MINIMAP_TILE;
  const mx = CANVAS_WIDTH - mmWidth - MINIMAP_PADDING;
  const my = MINIMAP_PADDING;

  // Semi-transparent background
  ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
  ctx.fillRect(mx - 2, my - 2, mmWidth + 4, mmHeight + 4);

  // Border — tinted by zone accent
  ctx.strokeStyle = zone.accentColor + "44";
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 2, my - 2, mmWidth + 4, mmHeight + 4);

  // Minimap colors derived from zone palette (brighter versions for visibility)
  const wallVis = lightenColor(zone.wallColor, 0.3);
  const wallDim = lightenColor(zone.wallColor, -0.1);
  const floorVis = lightenColor(zone.floorColor, 0.3);
  const floorDim = lightenColor(zone.floorColor, -0.1);
  const stairsVis = zone.stairsColor;
  const stairsDim = lightenColor(zone.stairsColor, -0.4);

  // Draw tiles
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const isVisible = state.fov[y][x];
      const isExplored = state.explored[y][x];
      if (!isExplored) continue;

      const tile = state.map[y][x];
      if (tile === TileType.VOID) continue;

      const px = mx + x * MINIMAP_TILE;
      const py = my + y * MINIMAP_TILE;

      if (tile === TileType.WALL) {
        ctx.fillStyle = isVisible ? wallVis : wallDim;
      } else if (tile === TileType.FLOOR) {
        ctx.fillStyle = isVisible ? floorVis : floorDim;
      } else if (tile === TileType.STAIRS_DOWN) {
        ctx.fillStyle = isVisible ? stairsVis : stairsDim;
      } else if (tile === TileType.SHRINE) {
        const shrineKey = `${x},${y}`;
        const isUsed = state.shrinesUsed?.has(shrineKey);
        ctx.fillStyle = isVisible
          ? (isUsed ? "#2a1a3e" : "#a855f7")
          : (isUsed ? "#1a1028" : "#6b21a8");
      } else {
        ctx.fillStyle = isVisible ? floorVis : floorDim;
      }

      ctx.fillRect(px, py, MINIMAP_TILE, MINIMAP_TILE);
    }
  }

  // Draw ground items (only visible)
  for (const groundItem of state.items) {
    if (!state.fov[groundItem.pos.y][groundItem.pos.x]) continue;
    const px = mx + groundItem.pos.x * MINIMAP_TILE;
    const py = my + groundItem.pos.y * MINIMAP_TILE;
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(px, py, MINIMAP_TILE, MINIMAP_TILE);
  }

  // Draw void patches (only visible)
  for (const patch of state.voidPatches) {
    if (!state.fov[patch.pos.y][patch.pos.x]) continue;
    const ppx = mx + patch.pos.x * MINIMAP_TILE;
    const ppy = my + patch.pos.y * MINIMAP_TILE;
    ctx.fillStyle = "#d946ef"; // magenta
    ctx.fillRect(ppx, ppy, MINIMAP_TILE, MINIMAP_TILE);
  }

  // Draw revealed traps (only visible)
  for (const trap of state.traps) {
    if (!trap.revealed) continue;
    if (!state.fov[trap.pos.y][trap.pos.x]) continue;
    const tpx = mx + trap.pos.x * MINIMAP_TILE;
    const tpy = my + trap.pos.y * MINIMAP_TILE;
    switch (trap.type) {
      case TrapType.SPIKE: ctx.fillStyle = "#ef4444"; break;
      case TrapType.ALARM: ctx.fillStyle = "#eab308"; break;
      case TrapType.TELEPORT: ctx.fillStyle = "#8b5cf6"; break;
    }
    ctx.fillRect(tpx, tpy, MINIMAP_TILE, MINIMAP_TILE);
  }

  // Draw enemies (only visible) — color by intent
  for (const entity of state.entities) {
    if (entity.hp <= 0) continue;
    if (!state.fov[entity.pos.y][entity.pos.x]) continue;
    const px = mx + entity.pos.x * MINIMAP_TILE;
    const py = my + entity.pos.y * MINIMAP_TILE;
    if (entity.isBoss) {
      ctx.fillStyle = "#f59e0b";
    } else if (entity.friendly) {
      ctx.fillStyle = "#22c55e";
    } else {
      switch (entity.intent) {
        case EnemyIntent.ATTACKING: ctx.fillStyle = "#ef4444"; break; // red
        case EnemyIntent.APPROACHING: ctx.fillStyle = "#eab308"; break; // yellow
        case EnemyIntent.FLEEING: ctx.fillStyle = "#3b82f6"; break; // blue
        default: ctx.fillStyle = "#6b7280"; break; // gray for idle
      }
    }
    ctx.fillRect(px, py, MINIMAP_TILE, MINIMAP_TILE);
  }

  // Draw player (always visible, bright cyan)
  const ppx = mx + state.player.pos.x * MINIMAP_TILE;
  const ppy = my + state.player.pos.y * MINIMAP_TILE;
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(ppx, ppy, MINIMAP_TILE, MINIMAP_TILE);

  // Draw viewport rectangle
  const camX = Math.max(
    0,
    Math.min(state.player.pos.x - Math.floor(VIEWPORT_TILES_X / 2), MAP_WIDTH - VIEWPORT_TILES_X)
  );
  const camY = Math.max(
    0,
    Math.min(state.player.pos.y - Math.floor(VIEWPORT_TILES_Y / 2), MAP_HEIGHT - VIEWPORT_TILES_Y)
  );
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    mx + camX * MINIMAP_TILE,
    my + camY * MINIMAP_TILE,
    VIEWPORT_TILES_X * MINIMAP_TILE,
    VIEWPORT_TILES_Y * MINIMAP_TILE
  );
}

export function renderFloatingTexts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  texts: ActiveFloatingText[],
  now: number,
) {
  const camX = Math.max(
    0,
    Math.min(state.player.pos.x - Math.floor(VIEWPORT_TILES_X / 2), MAP_WIDTH - VIEWPORT_TILES_X)
  );
  const camY = Math.max(
    0,
    Math.min(state.player.pos.y - Math.floor(VIEWPORT_TILES_Y / 2), MAP_HEIGHT - VIEWPORT_TILES_Y)
  );

  ctx.font = `bold 16px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";

  for (const ft of texts) {
    const age = now - ft.startTime;
    const progress = Math.min(age / FLOAT_DURATION, 1);

    const screenX = (ft.x - camX) * SCALED_TILE + SCALED_TILE / 2;
    const screenY = (ft.y - camY) * SCALED_TILE + SCALED_TILE / 2;

    // Float upward by 1.5 tiles
    const floatOffset = progress * SCALED_TILE * 1.5;
    // Full opacity for first 40%, then fade out
    const opacity = progress < 0.4 ? 1.0 : Math.max(0, 1.0 - (progress - 0.4) / 0.6);

    const drawY = screenY - floatOffset;

    ctx.globalAlpha = opacity;
    ctx.strokeText(ft.text, screenX, drawY);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, screenX, drawY);
  }

  ctx.globalAlpha = 1.0;
}

export function renderHitEffects(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  effects: ActiveHitEffect[],
  now: number,
) {
  const camX = Math.max(
    0,
    Math.min(state.player.pos.x - Math.floor(VIEWPORT_TILES_X / 2), MAP_WIDTH - VIEWPORT_TILES_X)
  );
  const camY = Math.max(
    0,
    Math.min(state.player.pos.y - Math.floor(VIEWPORT_TILES_Y / 2), MAP_HEIGHT - VIEWPORT_TILES_Y)
  );

  for (const fx of effects) {
    const age = now - fx.startTime;
    const progress = Math.min(age / HIT_EFFECT_DURATION, 1);

    const screenX = (fx.x - camX) * SCALED_TILE;
    const screenY = (fx.y - camY) * SCALED_TILE;
    const cx = screenX + SCALED_TILE / 2;
    const cy = screenY + SCALED_TILE / 2;

    // Phase 1 (0-40%): bright white flash on the tile
    if (progress < 0.4) {
      const flashAlpha = 0.6 * (1 - progress / 0.4);
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX, screenY, SCALED_TILE, SCALED_TILE);
    }

    // Phase 2 (0-100%): colored impact burst — 4 diagonal lines radiating outward
    const burstAlpha = progress < 0.3 ? 1.0 : Math.max(0, 1.0 - (progress - 0.3) / 0.7);
    const burstRadius = SCALED_TILE * 0.2 + SCALED_TILE * 0.5 * progress;
    ctx.globalAlpha = burstAlpha;
    ctx.strokeStyle = fx.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // 4 diagonal lines from center outward
    for (let angle = Math.PI / 4; angle < Math.PI * 2; angle += Math.PI / 2) {
      const innerR = burstRadius * 0.3;
      const outerR = burstRadius;
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    }
    ctx.stroke();

    // Phase 1 extra (0-25%): bright center dot
    if (progress < 0.25) {
      const dotAlpha = 0.8 * (1 - progress / 0.25);
      ctx.globalAlpha = dotAlpha;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1.0;
}

/** Render an item stat comparison tooltip when player stands on a weapon/armor ground item */
export function renderItemTooltip(ctx: CanvasRenderingContext2D, state: GameState) {
  // Find ground item at player position
  const groundItem = state.items.find(
    (gi) => gi.pos.x === state.player.pos.x && gi.pos.y === state.player.pos.y
  );
  if (!groundItem) return;

  const { item } = groundItem;
  // Only show tooltip for weapons and armor (equipment with stats to compare)
  if (item.category !== ItemCategory.WEAPON && item.category !== ItemCategory.ARMOR) return;

  const isWeapon = item.category === ItemCategory.WEAPON;
  const equipped: Item | null = isWeapon ? state.inventory.equippedWeapon : state.inventory.equippedArmor;
  const statLabel = isWeapon ? "ATK" : "DEF";
  const itemStat = (isWeapon ? item.attack : item.defense) ?? 0;
  const equippedStat = equipped ? ((isWeapon ? equipped.attack : equipped.defense) ?? 0) : 0;
  const diff = itemStat - equippedStat;

  // Build tooltip lines
  const lines: { text: string; color: string }[] = [];

  // Line 1: Ground item name + stat
  lines.push({ text: `${item.name} (+${itemStat} ${statLabel})`, color: item.color });

  // Runic / special / curse tags for ground item
  const groundTags = buildItemTags(item);
  if (groundTags) {
    lines.push({ text: groundTags, color: "#c084fc" });
  }

  // Line 2: Comparison
  if (equipped) {
    const arrow = diff > 0 ? "\u25B2" : diff < 0 ? "\u25BC" : "=";
    const diffColor = diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#9ca3af";
    const diffText = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "\u00B10";
    lines.push({ text: `vs ${equipped.name} (+${equippedStat}) ${arrow}${diffText}`, color: diffColor });

    // Show equipped item tags if different from ground item
    const equippedTags = buildItemTags(equipped);
    if (equippedTags) {
      lines.push({ text: `  ${equippedTags}`, color: "#8b7bb0" });
    }
  } else {
    lines.push({ text: `No ${isWeapon ? "weapon" : "armor"} equipped`, color: "#6b7280" });
  }

  // Cursed warning
  if (item.cursed && item.curse) {
    lines.push({ text: `\u26A0 Cursed: ${CURSE_NAMES[item.curse]}`, color: "#ef4444" });
  }

  // Measure tooltip dimensions
  const fontSize = 11;
  const lineHeight = fontSize + 4;
  const padding = 6;
  ctx.font = `bold ${fontSize}px monospace`;

  let maxWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line.text).width;
    if (w > maxWidth) maxWidth = w;
  }

  const tooltipW = maxWidth + padding * 2;
  const tooltipH = lines.length * lineHeight + padding * 2;

  // Position tooltip above the player
  const camX = Math.max(
    0,
    Math.min(state.player.pos.x - Math.floor(VIEWPORT_TILES_X / 2), MAP_WIDTH - VIEWPORT_TILES_X)
  );
  const camY = Math.max(
    0,
    Math.min(state.player.pos.y - Math.floor(VIEWPORT_TILES_Y / 2), MAP_HEIGHT - VIEWPORT_TILES_Y)
  );

  const playerScreenX = (state.player.pos.x - camX) * SCALED_TILE + SCALED_TILE / 2;
  const playerScreenY = (state.player.pos.y - camY) * SCALED_TILE;

  // Try above player, fall back to below if too close to top
  let tooltipX = playerScreenX - tooltipW / 2;
  let tooltipY = playerScreenY - tooltipH - 8;

  if (tooltipY < 4) {
    tooltipY = playerScreenY + SCALED_TILE + 8;
  }

  // Clamp horizontally
  if (tooltipX < 4) tooltipX = 4;
  if (tooltipX + tooltipW > CANVAS_WIDTH - 4) tooltipX = CANVAS_WIDTH - 4 - tooltipW;

  // Draw background
  ctx.fillStyle = "rgba(10, 10, 20, 0.92)";
  ctx.beginPath();
  roundRect(ctx, tooltipX, tooltipY, tooltipW, tooltipH, 4);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = item.color + "88";
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, tooltipX, tooltipY, tooltipW, tooltipH, 4);
  ctx.stroke();

  // Draw text lines
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = lines[i].color;
    ctx.font = i === 0 ? `bold ${fontSize}px monospace` : `${fontSize}px monospace`;
    ctx.fillText(lines[i].text, tooltipX + padding, tooltipY + padding + i * lineHeight);
  }
}

/** Build a tag string for item runics/specials/curses */
function buildItemTags(item: Item): string {
  const tags: string[] = [];
  if (item.weaponSpecial) tags.push(WEAPON_SPECIAL_NAMES[item.weaponSpecial]);
  if (item.runic) tags.push(RUNIC_NAMES[item.runic]);
  if (item.cursed && item.curse) tags.push(CURSE_NAMES[item.curse]);
  return tags.length > 0 ? `[${tags.join("] [")}]` : "";
}

/** Draw a rounded rectangle path */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
