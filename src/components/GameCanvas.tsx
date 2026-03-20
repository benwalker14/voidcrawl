"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/game/config";
import { initGame, processPlayerTurn, applyInventoryItem, MoveDirection } from "@/game/engine";
import { render } from "@/game/renderer";
import type { GameState, PlayerInventory, PlayerProgression } from "@/game/config";

function getStatsFromState(state: GameState) {
  const weaponAtk = state.inventory.equippedWeapon?.attack ?? 0;
  const armorDef = state.inventory.equippedArmor?.defense ?? 0;
  return {
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    floor: state.floor,
    turns: state.turnCount,
    attack: state.player.attack + weaponAtk,
    defense: state.player.defense + armorDef,
    level: state.progression.level,
    xp: state.progression.xp,
    xpToNext: state.progression.xpToNext,
  };
}

function getInventoryFromState(state: GameState): PlayerInventory {
  return {
    items: [...state.inventory.items],
    equippedWeapon: state.inventory.equippedWeapon,
    equippedArmor: state.inventory.equippedArmor,
  };
}

const initialState = initGame();

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(initialState);
  const [messages, setMessages] = useState<string[]>(["Welcome to Voidcrawl. Use arrow keys or WASD to move. Space to wait."]);
  const [stats, setStats] = useState(() => getStatsFromState(initialState));
  const [inventory, setInventory] = useState<PlayerInventory>(() => getInventoryFromState(initialState));
  const [gameOver, setGameOver] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !gameRef.current) return;
    render(ctx, gameRef.current);
  }, []);

  const updateUI = useCallback((state: GameState) => {
    setStats(getStatsFromState(state));
    setInventory(getInventoryFromState(state));
    if (state.messages.length > 0) {
      setMessages((prev) => [...state.messages, ...prev].slice(0, 50));
    }
    if (state.gameOver) {
      setGameOver(true);
    }
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameRef.current || gameRef.current.gameOver) return;

      let dir: MoveDirection | null = null;

      // Number keys 1-8 to use inventory items
      if (e.key >= "1" && e.key <= "8") {
        const index = parseInt(e.key) - 1;
        e.preventDefault();
        const newState = applyInventoryItem(gameRef.current, index);
        gameRef.current = newState;
        updateUI(newState);
        draw();
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          dir = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dir = "down";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          dir = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dir = "right";
          break;
        case " ":
          dir = "wait";
          break;
        default:
          return;
      }

      e.preventDefault();
      const newState = processPlayerTurn(gameRef.current, dir);
      gameRef.current = newState;
      updateUI(newState);
      draw();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [draw, updateUI]);

  const restart = () => {
    const state = initGame();
    gameRef.current = state;
    setGameOver(false);
    setInventory({ items: [], equippedWeapon: null, equippedArmor: null });
    setMessages(["A new journey begins..."]);
    updateUI(state);
    draw();
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-2">
      {/* HUD */}
      <div className="w-full max-w-[640px] flex justify-between items-center mb-0.5 px-2 text-sm font-mono">
        <div>
          <span style={{ color: "var(--void-cyan)" }}>HP: </span>
          <span style={{ color: stats.hp < stats.maxHp * 0.3 ? "#ef4444" : "var(--void-text)" }}>
            {stats.hp}/{stats.maxHp}
          </span>
        </div>
        <div>
          <span style={{ color: "#ef8844" }}>ATK: </span>
          <span>{stats.attack}</span>
        </div>
        <div>
          <span style={{ color: "#44aaef" }}>DEF: </span>
          <span>{stats.defense}</span>
        </div>
        <div>
          <span style={{ color: "#fbbf24" }}>Lv: </span>
          <span>{stats.level}</span>
        </div>
        <div>
          <span style={{ color: "var(--void-cyan)" }}>Floor: </span>
          <span>{stats.floor}</span>
        </div>
        <div>
          <span style={{ color: "var(--void-cyan)" }}>Turns: </span>
          <span>{stats.turns}</span>
        </div>
      </div>
      {/* XP Bar */}
      <div className="w-full max-w-[640px] flex items-center gap-2 mb-1 px-2 text-xs font-mono">
        <span style={{ color: "#fbbf24" }}>XP</span>
        <div className="flex-1 h-2 rounded-sm overflow-hidden" style={{ backgroundColor: "#1a1a2e" }}>
          <div
            className="h-full rounded-sm transition-all duration-300"
            style={{
              width: `${(stats.xp / stats.xpToNext) * 100}%`,
              backgroundColor: "#fbbf24",
            }}
          />
        </div>
        <span style={{ color: "var(--void-muted)" }}>{stats.xp}/{stats.xpToNext}</span>
      </div>
      {/* Equipment bar */}
      <div className="w-full max-w-[640px] flex gap-4 mb-2 px-2 text-xs font-mono" style={{ color: "var(--void-muted)" }}>
        <span>
          Weapon:{" "}
          {inventory.equippedWeapon ? (
            <span style={{ color: inventory.equippedWeapon.color }}>{inventory.equippedWeapon.name}</span>
          ) : (
            <span>None</span>
          )}
        </span>
        <span>
          Armor:{" "}
          {inventory.equippedArmor ? (
            <span style={{ color: inventory.equippedArmor.color }}>{inventory.equippedArmor.name}</span>
          ) : (
            <span>None</span>
          )}
        </span>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-800"
          tabIndex={0}
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <p className="text-3xl font-bold mb-4" style={{ color: "#ef4444" }}>
              YOU DIED
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--void-muted)" }}>
              Level {stats.level} &middot; Floor {stats.floor} &middot; {stats.turns} turns
            </p>
            <button
              onClick={restart}
              className="px-6 py-2 border-2 font-bold tracking-wider transition-all hover:scale-105"
              style={{ borderColor: "var(--void-cyan)", color: "var(--void-cyan)" }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Inventory */}
      {inventory.items.length > 0 && (
        <div
          className="w-full max-w-[640px] mt-2 p-2 text-xs font-mono"
          style={{ backgroundColor: "var(--void-dark)", borderTop: "1px solid #333" }}
        >
          <div style={{ color: "var(--void-cyan)" }} className="mb-1">Inventory ({inventory.items.length}/8) — press number to use:</div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {inventory.items.map((item, i) => (
              <span key={item.id}>
                <span style={{ color: "var(--void-muted)" }}>{i + 1}.</span>{" "}
                <span style={{ color: item.color }}>{item.name}</span>
                <span style={{ color: "var(--void-muted)" }}>
                  {item.attack != null ? ` (+${item.attack} ATK)` : ""}
                  {item.defense != null ? ` (+${item.defense} DEF)` : ""}
                  {item.healAmount != null ? ` (+${item.healAmount} HP)` : ""}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Message Log */}
      <div
        className="w-full max-w-[640px] mt-2 p-2 text-xs font-mono h-24 overflow-y-auto"
        style={{ backgroundColor: "var(--void-dark)", color: "var(--void-muted)" }}
      >
        {messages.map((msg, i) => (
          <div key={i} className={i === 0 ? "text-white" : ""}>
            {msg}
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div className="mt-2 text-xs" style={{ color: "var(--void-muted)" }}>
        Arrow keys / WASD to move &middot; Space to wait &middot; Walk into enemies to attack &middot; Find the stairs (&gt;) to descend &middot; 1-8 to use items
      </div>
    </div>
  );
}
