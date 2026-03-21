import { TileType, MAP_WIDTH, MAP_HEIGHT } from "../config";

export const FOV_RADIUS = 7;

// Simple raycasting FOV
export function computeFov(
  map: TileType[][],
  px: number,
  py: number,
  radiusOverride?: number,
): boolean[][] {
  const radius = radiusOverride ?? FOV_RADIUS;
  const visible: boolean[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  );

  visible[py][px] = true;

  // Cast rays in all directions
  const steps = 360;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let x = px + 0.5;
    let y = py + 0.5;

    for (let step = 0; step < radius; step++) {
      x += dx * 0.5;
      y += dy * 0.5;

      const tileX = Math.floor(x);
      const tileY = Math.floor(y);

      if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) break;

      visible[tileY][tileX] = true;

      if (map[tileY][tileX] === TileType.WALL) break;
    }
  }

  return visible;
}
