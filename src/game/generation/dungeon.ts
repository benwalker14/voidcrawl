import { TileType, MAP_WIDTH, MAP_HEIGHT, Position } from "../config";
import { random } from "../rng";

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

function roomsOverlap(a: Room, b: Room, padding = 1): boolean {
  return (
    a.x - padding < b.x + b.width + padding &&
    a.x + a.width + padding > b.x - padding &&
    a.y - padding < b.y + b.height + padding &&
    a.y + a.height + padding > b.y - padding
  );
}

function carveRoom(map: TileType[][], room: Room) {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
        map[y][x] = TileType.FLOOR;
      }
    }
  }
}

function carveCorridor(map: TileType[][], from: Position, to: Position) {
  let { x, y } = from;
  const dx = to.x > x ? 1 : -1;
  const dy = to.y > y ? 1 : -1;

  // Horizontal first, then vertical (or vice versa randomly)
  if (random() > 0.5) {
    while (x !== to.x) {
      if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
        map[y][x] = TileType.FLOOR;
      }
      x += dx;
    }
    while (y !== to.y) {
      if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
        map[y][x] = TileType.FLOOR;
      }
      y += dy;
    }
  } else {
    while (y !== to.y) {
      if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
        map[y][x] = TileType.FLOOR;
      }
      y += dy;
    }
    while (x !== to.x) {
      if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
        map[y][x] = TileType.FLOOR;
      }
      x += dx;
    }
  }
}

export interface DungeonResult {
  map: TileType[][];
  rooms: Room[];
  playerStart: Position;
  stairsPos: Position;
}

function isBossFloor(floor: number): boolean {
  return floor === 5;
}

function generateBossRoom(): DungeonResult {
  const map: TileType[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(TileType.WALL)
  );

  // Single large room centered on the map (16x12)
  const roomWidth = 16;
  const roomHeight = 12;
  const roomX = Math.floor((MAP_WIDTH - roomWidth) / 2);
  const roomY = Math.floor((MAP_HEIGHT - roomHeight) / 2);
  const bossRoom: Room = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
  carveRoom(map, bossRoom);

  // Player starts at the bottom-center of the room
  const playerStart = {
    x: Math.floor(roomX + roomWidth / 2),
    y: roomY + roomHeight - 2,
  };

  // Stairs hidden behind boss position (top-center), only accessible after boss dies
  const stairsPos = {
    x: Math.floor(roomX + roomWidth / 2),
    y: roomY + 1,
  };
  map[stairsPos.y][stairsPos.x] = TileType.STAIRS_DOWN;

  // Add walls around floors
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x] === TileType.WALL) {
        let adjacentToFloor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < MAP_HEIGHT && nx >= 0 && nx < MAP_WIDTH) {
              if (map[ny][nx] === TileType.FLOOR || map[ny][nx] === TileType.STAIRS_DOWN) {
                adjacentToFloor = true;
              }
            }
          }
        }
        if (!adjacentToFloor) {
          map[y][x] = TileType.VOID;
        }
      }
    }
  }

  return { map, rooms: [bossRoom], playerStart, stairsPos };
}

export function generateDungeon(floor: number): DungeonResult {
  if (isBossFloor(floor)) {
    return generateBossRoom();
  }

  // Initialize with walls
  const map: TileType[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(TileType.WALL)
  );

  const rooms: Room[] = [];
  const maxRooms = 8 + Math.min(floor, 10);
  const minRoomSize = 4;
  const maxRoomSize = 8;

  // Generate rooms
  for (let attempt = 0; attempt < 100; attempt++) {
    if (rooms.length >= maxRooms) break;

    const width = minRoomSize + Math.floor(random() * (maxRoomSize - minRoomSize));
    const height = minRoomSize + Math.floor(random() * (maxRoomSize - minRoomSize));
    const x = 1 + Math.floor(random() * (MAP_WIDTH - width - 2));
    const y = 1 + Math.floor(random() * (MAP_HEIGHT - height - 2));

    const room: Room = { x, y, width, height };

    if (!rooms.some((r) => roomsOverlap(r, room))) {
      carveRoom(map, room);
      rooms.push(room);
    }
  }

  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const from = {
      x: Math.floor(rooms[i - 1].x + rooms[i - 1].width / 2),
      y: Math.floor(rooms[i - 1].y + rooms[i - 1].height / 2),
    };
    const to = {
      x: Math.floor(rooms[i].x + rooms[i].width / 2),
      y: Math.floor(rooms[i].y + rooms[i].height / 2),
    };
    carveCorridor(map, from, to);
  }

  // Place stairs in the last room
  const lastRoom = rooms[rooms.length - 1];
  const stairsPos = {
    x: Math.floor(lastRoom.x + lastRoom.width / 2),
    y: Math.floor(lastRoom.y + lastRoom.height / 2),
  };
  map[stairsPos.y][stairsPos.x] = TileType.STAIRS_DOWN;

  // Player starts in the first room
  const firstRoom = rooms[0];
  const playerStart = {
    x: Math.floor(firstRoom.x + firstRoom.width / 2),
    y: Math.floor(firstRoom.y + firstRoom.height / 2),
  };

  // Add walls around floors (ensure proper wall borders)
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x] === TileType.WALL) {
        // Check if adjacent to floor — if not, make it void
        let adjacentToFloor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < MAP_HEIGHT && nx >= 0 && nx < MAP_WIDTH) {
              if (map[ny][nx] === TileType.FLOOR || map[ny][nx] === TileType.STAIRS_DOWN) {
                adjacentToFloor = true;
              }
            }
          }
        }
        if (!adjacentToFloor) {
          map[y][x] = TileType.VOID;
        }
      }
    }
  }

  return { map, rooms, playerStart, stairsPos };
}
