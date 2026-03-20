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

const SCALED_TILE = TILE_SIZE * SCALE;

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

  // Draw entities (only visible ones)
  for (const entity of state.entities) {
    if (entity.hp <= 0) continue;
    if (!state.fov[entity.pos.y][entity.pos.x]) continue;

    const screenX = (entity.pos.x - camX) * SCALED_TILE;
    const screenY = (entity.pos.y - camY) * SCALED_TILE;

    if (screenX < 0 || screenX >= CANVAS_WIDTH || screenY < 0 || screenY >= CANVAS_HEIGHT) continue;

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
