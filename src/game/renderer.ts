import {
  GameState,
  TileType,
  TILE_COLORS,
  TILE_SIZE,
  SCALE,
  VIEWPORT_TILES_X,
  VIEWPORT_TILES_Y,
  MAP_WIDTH,
  MAP_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "./config";

export const FLOAT_DURATION = 800;

export interface ActiveFloatingText {
  text: string;
  color: string;
  x: number;
  y: number;
  startTime: number;
}

const SCALED_TILE = TILE_SIZE * SCALE;

// Mini-map constants
const MINIMAP_TILE = 3; // pixels per tile on minimap
const MINIMAP_PADDING = 8;

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  // Clear
  ctx.fillStyle = "#0a0a0f";
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
      ctx.fillStyle = TILE_COLORS[tile as TileType] || TILE_COLORS[TileType.VOID];
      if (!isVisible) {
        // Dim explored but not visible tiles
        ctx.globalAlpha = 0.3;
      }
      ctx.fillRect(screenX, screenY, SCALED_TILE, SCALED_TILE);
      ctx.globalAlpha = 1.0;

      // Draw stairs symbol
      if (tile === TileType.STAIRS_DOWN && isVisible) {
        ctx.fillStyle = "#06b6d4";
        ctx.font = `bold ${SCALED_TILE - 4}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(">", screenX + SCALED_TILE / 2, screenY + SCALED_TILE / 2);
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
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = hpRatio > 0.5 ? "#06b6d4" : hpRatio > 0.25 ? "#eab308" : "#ef4444";
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
  const mmWidth = MAP_WIDTH * MINIMAP_TILE;
  const mmHeight = MAP_HEIGHT * MINIMAP_TILE;
  const mx = CANVAS_WIDTH - mmWidth - MINIMAP_PADDING;
  const my = MINIMAP_PADDING;

  // Semi-transparent background
  ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
  ctx.fillRect(mx - 2, my - 2, mmWidth + 4, mmHeight + 4);

  // Border
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 2, my - 2, mmWidth + 4, mmHeight + 4);

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
        ctx.fillStyle = isVisible ? "#4a4a66" : "#2a2a3e";
      } else if (tile === TileType.FLOOR) {
        ctx.fillStyle = isVisible ? "#2a2a4e" : "#161628";
      } else if (tile === TileType.STAIRS_DOWN) {
        ctx.fillStyle = isVisible ? "#06b6d4" : "#044a5a";
      } else {
        ctx.fillStyle = isVisible ? "#2a2a4e" : "#161628";
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
