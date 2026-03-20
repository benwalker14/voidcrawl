"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CANVAS_WIDTH, CANVAS_HEIGHT, RUNIC_NAMES } from "@/game/config";
import { initGame, processPlayerTurn, applyInventoryItem, MoveDirection } from "@/game/engine";
import { render, renderFloatingTexts, FLOAT_DURATION } from "@/game/renderer";
import type { ActiveFloatingText } from "@/game/renderer";
import type { GameState, GameMessage, PlayerInventory, RunStats, StatusEffect, GameEntity } from "@/game/config";
import HelpOverlay from "./HelpOverlay";
import PauseMenu from "./PauseMenu";

function formatPlayTime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

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
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(initialState);
  const [messages, setMessages] = useState<GameMessage[]>([{ text: "Welcome to Voidcrawl. Use arrow keys or WASD to move. Space to wait.", color: "#e2e8f0" }]);
  const [stats, setStats] = useState(() => getStatsFromState(initialState));
  const [inventory, setInventory] = useState<PlayerInventory>(() => getInventoryFromState(initialState));
  const [gameOver, setGameOver] = useState(false);
  const [runStats, setRunStats] = useState<RunStats>(initialState.runStats);
  const [statusEffects, setStatusEffects] = useState<StatusEffect[]>([]);
  const [bossInfo, setBossInfo] = useState<GameEntity | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const showHelpRef = useRef(false);
  const [showPause, setShowPause] = useState(false);
  const showPauseRef = useRef(false);
  const floatingTextsRef = useRef<ActiveFloatingText[]>([]);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !gameRef.current) return;
    render(ctx, gameRef.current);
    if (floatingTextsRef.current.length > 0) {
      renderFloatingTexts(ctx, gameRef.current, floatingTextsRef.current, performance.now());
    }
  }, []);

  const updateUI = useCallback((state: GameState) => {
    setStats(getStatsFromState(state));
    setInventory(getInventoryFromState(state));
    setRunStats(state.runStats);
    setStatusEffects(state.statusEffects ?? []);
    const boss = state.entities.find((e) => e.isBoss && e.hp > 0);
    setBossInfo(boss ?? null);
    if (state.messages.length > 0) {
      setMessages((prev) => [...state.messages, ...prev].slice(0, 50));
    }
    if (state.gameOver) {
      setGameOver(true);
    }
  }, []);

  const startFloatingTexts = useCallback((state: GameState) => {
    const pending = state.pendingFloatingTexts;
    if (pending.length === 0) return;
    const now = performance.now();
    for (const ft of pending) {
      floatingTextsRef.current.push({ ...ft, startTime: now });
    }
    if (animFrameRef.current) return; // animation already running

    const animate = () => {
      const now = performance.now();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !gameRef.current) {
        animFrameRef.current = 0;
        return;
      }

      render(ctx, gameRef.current);

      floatingTextsRef.current = floatingTextsRef.current.filter(
        (ft) => now - ft.startTime < FLOAT_DURATION
      );

      if (floatingTextsRef.current.length > 0) {
        renderFloatingTexts(ctx, gameRef.current, floatingTextsRef.current, now);
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = 0;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Help toggle: ? or h/H to open/close
      if (e.key === "?" || e.key === "h" || e.key === "H") {
        e.preventDefault();
        const next = !showHelpRef.current;
        showHelpRef.current = next;
        setShowHelp(next);
        // Close pause menu when opening help
        if (next) {
          showPauseRef.current = false;
          setShowPause(false);
        }
        return;
      }
      // Escape: close help if open, otherwise toggle pause menu
      if (e.key === "Escape") {
        e.preventDefault();
        if (showHelpRef.current) {
          showHelpRef.current = false;
          setShowHelp(false);
        } else {
          const next = !showPauseRef.current;
          showPauseRef.current = next;
          setShowPause(next);
        }
        return;
      }

      // Block game input while help or pause is open
      if (showHelpRef.current || showPauseRef.current) return;

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
        startFloatingTexts(newState);
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
      startFloatingTexts(newState);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [draw, updateUI, startFloatingTexts]);

  const restart = () => {
    const state = initGame();
    gameRef.current = state;
    floatingTextsRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setGameOver(false);
    setStatusEffects([]);
    setInventory({ items: [], equippedWeapon: null, equippedArmor: null });
    setMessages([{ text: "A new journey begins...", color: "#e2e8f0" }]);
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
            <>
              <span style={{ color: inventory.equippedWeapon.color }}>{inventory.equippedWeapon.name}</span>
              {inventory.equippedWeapon.runic && (
                <span style={{ color: "#c084fc" }}> [{RUNIC_NAMES[inventory.equippedWeapon.runic]}]</span>
              )}
            </>
          ) : (
            <span>None</span>
          )}
        </span>
        <span>
          Armor:{" "}
          {inventory.equippedArmor ? (
            <>
              <span style={{ color: inventory.equippedArmor.color }}>{inventory.equippedArmor.name}</span>
              {inventory.equippedArmor.runic && (
                <span style={{ color: "#c084fc" }}> [{RUNIC_NAMES[inventory.equippedArmor.runic]}]</span>
              )}
            </>
          ) : (
            <span>None</span>
          )}
        </span>
      </div>

      {/* Active Status Effects */}
      {statusEffects.length > 0 && (
        <div className="w-full max-w-[640px] flex gap-3 mb-1 px-2 text-xs font-mono">
          {statusEffects.map((e, i) => {
            const label = e.type === "haste" ? "Haste" : e.type === "invisible" ? "Invisible" : "Strength";
            const color = e.type === "haste" ? "#22c55e" : e.type === "invisible" ? "#a78bfa" : "#f97316";
            return (
              <span key={i} style={{ color }}>
                {label} ({e.turnsRemaining}t)
              </span>
            );
          })}
        </div>
      )}

      {/* Boss HP Bar */}
      {bossInfo && (
        <div className="w-full max-w-[640px] mb-1 px-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span style={{ color: "#06b6d4" }} className="font-bold">{bossInfo.name}</span>
            <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}>
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${(bossInfo.hp / bossInfo.maxHp) * 100}%`,
                  backgroundColor: bossInfo.hp / bossInfo.maxHp > 0.5 ? "#06b6d4" : bossInfo.hp / bossInfo.maxHp > 0.25 ? "#eab308" : "#ef4444",
                }}
              />
            </div>
            <span style={{ color: "var(--void-muted)" }}>{bossInfo.hp}/{bossInfo.maxHp}</span>
            <span style={{ color: bossInfo.bossPhase === 1 ? "#22c55e" : "#ef4444" }} className="font-bold">
              {bossInfo.bossPhase === 1 ? "VULNERABLE" : "ACTIVE"}
            </span>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-800"
          tabIndex={0}
        />

        {showPause && (
          <PauseMenu
            onResume={() => { showPauseRef.current = false; setShowPause(false); }}
            onHelp={() => { showPauseRef.current = false; setShowPause(false); showHelpRef.current = true; setShowHelp(true); }}
            onRestart={() => { showPauseRef.current = false; setShowPause(false); restart(); }}
            onQuit={() => { router.push("/"); }}
          />
        )}

        {showHelp && <HelpOverlay onClose={() => { showHelpRef.current = false; setShowHelp(false); }} />}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
            <p className="text-3xl font-bold mb-1" style={{ color: "#ef4444" }}>
              YOU DIED
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--void-muted)" }}>
              Level {stats.level} &middot; Floor {stats.floor} &middot; {stats.turns} turns
            </p>
            <div
              className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono mb-4 px-4 py-2 rounded"
              style={{ backgroundColor: "rgba(26, 26, 46, 0.8)", border: "1px solid #333" }}
            >
              <span style={{ color: "#fb923c" }}>Enemies slain</span>
              <span className="text-right">{runStats.enemiesKilled}</span>
              <span style={{ color: "#06b6d4" }}>Items found</span>
              <span className="text-right">{runStats.itemsFound}</span>
              <span style={{ color: "#f97316" }}>Damage dealt</span>
              <span className="text-right">{runStats.damageDealt}</span>
              <span style={{ color: "#ef4444" }}>Damage taken</span>
              <span className="text-right">{runStats.damageTaken}</span>
              <span style={{ color: "#fbbf24" }}>Deepest floor</span>
              <span className="text-right">{runStats.deepestFloor}</span>
              <span style={{ color: "var(--void-muted)" }}>Time played</span>
              <span className="text-right">{formatPlayTime(runStats.startTime)}</span>
            </div>
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
                  {item.healAmount && item.healAmount > 0 ? ` (+${item.healAmount} HP)` : ""}
                  {item.category === "potion" && !item.healAmount ? ` [${item.description}]` : ""}
                  {item.category === "scroll" ? ` [${item.description}]` : ""}
                </span>
                {item.runic && (
                  <span style={{ color: "#c084fc" }}> [{RUNIC_NAMES[item.runic]}]</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Message Log */}
      <div
        className="w-full max-w-[640px] mt-2 p-2 text-xs font-mono h-24 overflow-y-auto"
        style={{ backgroundColor: "var(--void-dark)" }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ color: msg.color, opacity: i === 0 ? 1 : 0.7 }}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div className="mt-2 text-xs" style={{ color: "var(--void-muted)" }}>
        Arrow keys / WASD to move &middot; Space to wait &middot; Walk into enemies to attack &middot; Find the stairs (&gt;) to descend &middot; 1-8 to use items &middot; Esc to pause &middot; ? for help
      </div>
    </div>
  );
}
