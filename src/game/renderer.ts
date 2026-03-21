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
      ctx.fillStyle = entity.bossPhase === 1
        ? `rgba(34, 197, 94, ${pulse})`  // Green glow when vulnerable
        : `rgba(6, 182, 212, ${pulse})`;  // Cyan glow normally
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

  // Draw enemies (only visible)
  for (const entity of state.entities) {
    if (entity.hp <= 0) continue;
    if (!state.fov[entity.pos.y][entity.pos.x]) continue;
    const px = mx + entity.pos.x * MINIMAP_TILE;
    const py = my + entity.pos.y * MINIMAP_TILE;
    ctx.fillStyle = entity.isBoss ? "#f59e0b" : "#ef4444";
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
