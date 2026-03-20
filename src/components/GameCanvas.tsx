"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/game/config";
import { initGame, processPlayerTurn, MoveDirection } from "@/game/engine";
import { render } from "@/game/renderer";
import type { GameState } from "@/game/config";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const [messages, setMessages] = useState<string[]>(["Welcome to Voidcrawl. Use arrow keys or WASD to move. Space to wait."]);
  const [stats, setStats] = useState({ hp: 0, maxHp: 0, floor: 1, turns: 0 });
  const [gameOver, setGameOver] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !gameRef.current) return;
    render(ctx, gameRef.current);
  }, []);

  const updateUI = useCallback((state: GameState) => {
    setStats({
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      floor: state.floor,
      turns: state.turnCount,
    });
    if (state.messages.length > 0) {
      setMessages((prev) => [...state.messages, ...prev].slice(0, 50));
    }
    if (state.gameOver) {
      setGameOver(true);
    }
  }, []);

  useEffect(() => {
    const state = initGame();
    gameRef.current = state;
    updateUI(state);
    draw();
  }, [draw, updateUI]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameRef.current || gameRef.current.gameOver) return;

      let dir: MoveDirection | null = null;

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
    setMessages(["A new journey begins..."]);
    updateUI(state);
    draw();
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-2">
      {/* HUD */}
      <div className="w-full max-w-[640px] flex justify-between items-center mb-2 px-2 text-sm font-mono">
        <div>
          <span style={{ color: "var(--void-cyan)" }}>HP: </span>
          <span style={{ color: stats.hp < stats.maxHp * 0.3 ? "#ef4444" : "var(--void-text)" }}>
            {stats.hp}/{stats.maxHp}
          </span>
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
              Reached floor {stats.floor} in {stats.turns} turns
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
        Arrow keys / WASD to move &middot; Space to wait &middot; Walk into enemies to attack &middot; Find the stairs (&gt;) to descend
      </div>
    </div>
  );
}
