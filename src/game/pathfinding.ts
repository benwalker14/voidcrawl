import { Position, TileType, MAP_WIDTH, MAP_HEIGHT } from "./config";

// Binary min-heap for A* open set
class MinHeap {
  private data: { pos: Position; f: number }[] = [];

  push(pos: Position, f: number) {
    this.data.push({ pos, f });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): Position | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top.pos;
  }

  get length() {
    return this.data.length;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f >= this.data[parent].f) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].f < this.data[smallest].f) smallest = left;
      if (right < n && this.data[right].f < this.data[smallest].f) smallest = right;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}

const DIRS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

function key(x: number, y: number): number {
  return y * MAP_WIDTH + x;
}

/**
 * A* pathfinding. Returns the next step position toward the goal,
 * or null if no path exists. maxSteps limits search depth for performance.
 */
export function findPath(
  map: TileType[][],
  from: Position,
  to: Position,
  blocked: Set<string>,
  maxSteps: number = 30,
): Position | null {
  if (from.x === to.x && from.y === to.y) return null;

  const open = new MinHeap();
  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();

  const startKey = key(from.x, from.y);
  const goalKey = key(to.x, to.y);

  gScore.set(startKey, 0);
  open.push(from, Math.abs(to.x - from.x) + Math.abs(to.y - from.y));

  let iterations = 0;

  while (open.length > 0 && iterations < maxSteps * 10) {
    iterations++;
    const current = open.pop()!;
    const currentKey = key(current.x, current.y);

    if (currentKey === goalKey) {
      // Reconstruct path — find the first step
      let step = goalKey;
      while (cameFrom.get(step) !== startKey) {
        const prev = cameFrom.get(step);
        if (prev === undefined) return null;
        step = prev;
      }
      return { x: step % MAP_WIDTH, y: Math.floor(step / MAP_WIDTH) };
    }

    const currentG = gScore.get(currentKey) ?? Infinity;
    if (currentG >= maxSteps) continue;

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;

      const tile = map[ny][nx];
      const nKey = key(nx, ny);

      // Can walk on floor, stairs, doors; goal tile is always passable (for adjacent attack)
      if (nKey !== goalKey) {
        if (tile === TileType.WALL || tile === TileType.VOID) continue;
        if (blocked.has(`${nx},${ny}`)) continue;
      }

      const tentativeG = currentG + 1;
      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        gScore.set(nKey, tentativeG);
        cameFrom.set(nKey, currentKey);
        const h = Math.abs(to.x - nx) + Math.abs(to.y - ny);
        open.push({ x: nx, y: ny }, tentativeG + h);
      }
    }
  }

  return null;
}

/**
 * Find a position that moves away from the target (for fleeing).
 */
export function findFleeStep(
  map: TileType[][],
  from: Position,
  away: Position,
  blocked: Set<string>,
): Position | null {
  let bestPos: Position | null = null;
  let bestDist = Math.abs(away.x - from.x) + Math.abs(away.y - from.y);

  for (const dir of DIRS) {
    const nx = from.x + dir.x;
    const ny = from.y + dir.y;

    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
    const tile = map[ny][nx];
    if (tile === TileType.WALL || tile === TileType.VOID) continue;
    if (blocked.has(`${nx},${ny}`)) continue;

    const dist = Math.abs(away.x - nx) + Math.abs(away.y - ny);
    if (dist > bestDist) {
      bestDist = dist;
      bestPos = { x: nx, y: ny };
    }
  }

  return bestPos;
}
