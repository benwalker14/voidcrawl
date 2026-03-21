"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CANVAS_WIDTH, CANVAS_HEIGHT, RUNIC_NAMES, CONSUMABLE_EFFECT_NAMES, VICTORY_FLOOR } from "@/game/config";
import { initGame, processPlayerTurn, applyInventoryItem, processShrine, continueEndless, MoveDirection, getAttunementAtkBonus } from "@/game/engine";
import { render, renderMinimap, renderFloatingTexts, renderHitEffects, FLOAT_DURATION, HIT_EFFECT_DURATION } from "@/game/renderer";
import type { ActiveFloatingText, ActiveHitEffect } from "@/game/renderer";
import type { GameState, GameMessage, PlayerInventory, RunStats, StatusEffect, GameEntity, DailyResult } from "@/game/config";
import { getDailySeed, formatDailyDate } from "@/game/rng";
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

// Daily challenge localStorage helpers
const DAILY_KEY_PREFIX = "nullcrawl_daily_";

function getDailyStorageKey(seed: string): string {
  return `${DAILY_KEY_PREFIX}${seed}`;
}

function loadDailyResult(seed: string): DailyResult | null {
  try {
    const raw = localStorage.getItem(getDailyStorageKey(seed));
    if (!raw) return null;
    return JSON.parse(raw) as DailyResult;
  } catch {
    return null;
  }
}

function saveDailyResult(result: DailyResult): void {
  try {
    localStorage.setItem(getDailyStorageKey(result.date), JSON.stringify(result));
  } catch {
    // localStorage may be full or unavailable
  }
}

interface GameCanvasProps {
  mode?: "standard" | "daily";
}

export default function GameCanvas({ mode = "standard" }: GameCanvasProps) {
  const isDaily = mode === "daily";
  const dailySeed = isDaily ? getDailySeed() : undefined;
  const [dailyCompleted, setDailyCompleted] = useState<DailyResult | null>(() => {
    if (isDaily && dailySeed && typeof window !== "undefined") {
      const existing = loadDailyResult(dailySeed);
      if (existing?.completed) return existing;
    }
    return null;
  });
  const dailyCheckedRef = useRef(false);

  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [initializedState] = useState<GameState>(() => initGame(mode, dailySeed));
  const gameRef = useRef<GameState>(initializedState);
  const [messages, setMessages] = useState<GameMessage[]>(() => {
    const welcomeMsg = isDaily
      ? `Daily Void \u2014 ${formatDailyDate(dailySeed!)}. Same dungeon for everyone today.`
      : "Welcome to Nullcrawl. Use arrow keys or WASD to move. Space to wait.";
    return [{ text: welcomeMsg, color: "#e2e8f0" }];
  });
  const [stats, setStats] = useState(() => getStatsFromState(initializedState));
  const [inventory, setInventory] = useState<PlayerInventory>(() => getInventoryFromState(initializedState));
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [runStats, setRunStats] = useState<RunStats>(initializedState.runStats);
  const [statusEffects, setStatusEffects] = useState<StatusEffect[]>([]);
  const [voidAttunement, setVoidAttunement] = useState(0);
  const [bossInfo, setBossInfo] = useState<GameEntity | null>(null);
  const [identified, setIdentified] = useState<Record<string, boolean>>(initializedState.identified);
  const [consumableAppearances, setConsumableAppearances] = useState<Record<string, string>>(initializedState.consumableAppearances);
  const [copied, setCopied] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem("nullcrawl_tutorial_seen");
    } catch {
      return false;
    }
  });
  const showTutorialRef = useRef(false);
  const [showHelp, setShowHelp] = useState(false);
  const showHelpRef = useRef(false);
  const [showPause, setShowPause] = useState(false);
  const showPauseRef = useRef(false);
  const [shrinePrompt, setShrinePrompt] = useState(false);
  const showMinimapRef = useRef(true);
  const floatingTextsRef = useRef<ActiveFloatingText[]>([]);
  const hitEffectsRef = useRef<ActiveHitEffect[]>([]);
  const animFrameRef = useRef<number>(0);
  const shakeRef = useRef<{ intensity: number; startTime: number }>({ intensity: 0, startTime: 0 });
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !gameRef.current) return;
    render(ctx, gameRef.current);
    if (showMinimapRef.current) {
      renderMinimap(ctx, gameRef.current);
    }
    const now = performance.now();
    if (hitEffectsRef.current.length > 0) {
      renderHitEffects(ctx, gameRef.current, hitEffectsRef.current, now);
    }
    if (floatingTextsRef.current.length > 0) {
      renderFloatingTexts(ctx, gameRef.current, floatingTextsRef.current, now);
    }
  }, []);

  // Save daily result when game ends — called from updateUI when gameOver triggers
  const saveDailyOnDeath = useCallback(() => {
    if (!isDaily || !dailySeed || dailyCheckedRef.current) return;
    dailyCheckedRef.current = true;
    const state = gameRef.current;
    const result: DailyResult = {
      date: dailySeed,
      floor: state.runStats.deepestFloor,
      level: getStatsFromState(state).level,
      kills: state.runStats.enemiesKilled,
      damageDealt: state.runStats.damageDealt,
      damageTaken: state.runStats.damageTaken,
      itemsFound: state.runStats.itemsFound,
      time: formatPlayTime(state.runStats.startTime),
      killedBy: state.runStats.killedBy,
      completed: true,
    };
    saveDailyResult(result);
    setDailyCompleted(result);
  }, [isDaily, dailySeed]);

  const updateUI = useCallback((state: GameState) => {
    setStats(getStatsFromState(state));
    setInventory(getInventoryFromState(state));
    setRunStats(state.runStats);
    setStatusEffects(state.statusEffects ?? []);
    setVoidAttunement(state.voidAttunement ?? 0);
    setIdentified(state.identified);
    setConsumableAppearances(state.consumableAppearances);
    setShrinePrompt(state.shrinePrompt ?? false);
    const boss = state.entities.find((e) => e.isBoss && e.hp > 0);
    setBossInfo(boss ?? null);
    if (state.messages.length > 0) {
      setMessages((prev) => [...state.messages, ...prev].slice(0, 50));
    }
    if (state.gameOver) {
      setGameOver(true);
      if (state.victory) {
        setVictory(true);
      } else {
        saveDailyOnDeath();
      }
    }
  }, [saveDailyOnDeath]);

  const startAnimations = useCallback((state: GameState) => {
    const now = performance.now();
    const pendingFloats = state.pendingFloatingTexts;
    const pendingHits = state.pendingHitEffects;
    if (pendingFloats.length === 0 && pendingHits.length === 0) return;

    for (const ft of pendingFloats) {
      floatingTextsRef.current.push({ ...ft, startTime: now });
    }
    for (const hf of pendingHits) {
      hitEffectsRef.current.push({ ...hf, startTime: now });
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
      if (showMinimapRef.current) {
        renderMinimap(ctx, gameRef.current);
      }

      hitEffectsRef.current = hitEffectsRef.current.filter(
        (hf) => now - hf.startTime < HIT_EFFECT_DURATION
      );
      floatingTextsRef.current = floatingTextsRef.current.filter(
        (ft) => now - ft.startTime < FLOAT_DURATION
      );

      const hasAnimations = hitEffectsRef.current.length > 0 || floatingTextsRef.current.length > 0;

      if (hitEffectsRef.current.length > 0) {
        renderHitEffects(ctx, gameRef.current, hitEffectsRef.current, now);
      }
      if (floatingTextsRef.current.length > 0) {
        renderFloatingTexts(ctx, gameRef.current, floatingTextsRef.current, now);
      }

      if (hasAnimations) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = 0;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Sync tutorial ref with initial state
  useEffect(() => {
    showTutorialRef.current = showTutorial;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Dismiss tutorial overlay
      if (showTutorialRef.current) {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          showTutorialRef.current = false;
          setShowTutorial(false);
          try { localStorage.setItem("nullcrawl_tutorial_seen", "1"); } catch {}
        }
        return;
      }

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

      // Mini-map toggle: M key
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        showMinimapRef.current = !showMinimapRef.current;
        draw();
        return;
      }

      // Block game input while help or pause is open
      if (showHelpRef.current || showPauseRef.current) return;

      if (!gameRef.current) return;

      // Death/Victory screen keyboard shortcuts
      if (gameRef.current.gameOver) {
        if (e.key === "r" || e.key === "R" || e.key === "Enter") {
          e.preventDefault();
          restart();
        } else if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          copyRunSummary();
        } else if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          if (gameRef.current.victory) {
            continueToEndless();
          }
        }
        return;
      }

      // Handle shrine prompt Y/N
      if (gameRef.current.shrinePrompt) {
        if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          const newState = processShrine(gameRef.current, true);
          gameRef.current = newState;
          updateUI(newState);
          draw();
          startAnimations(newState);
        } else if (e.key === "n" || e.key === "N" || e.key === "Escape") {
          e.preventDefault();
          const newState = processShrine(gameRef.current, false);
          gameRef.current = newState;
          updateUI(newState);
          draw();
          startAnimations(newState);
        }
        return;
      }

      let dir: MoveDirection | null = null;

      // Number keys 1-8 to use inventory items
      if (e.key >= "1" && e.key <= "8") {
        const index = parseInt(e.key) - 1;
        e.preventDefault();
        const newState = applyInventoryItem(gameRef.current, index);
        gameRef.current = newState;
        updateUI(newState);
        draw();
        startAnimations(newState);
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
      startAnimations(newState);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [draw, updateUI, startAnimations]);

  const restart = () => {
    // Daily mode: no restart, redirect to regular play
    if (isDaily) {
      router.push("/play");
      return;
    }
    const state = initGame();
    gameRef.current = state;
    floatingTextsRef.current = [];
    hitEffectsRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setGameOver(false);
    setVictory(false);
    setCopied(false);
    setStatusEffects([]);
    setIdentified(state.identified);
    setConsumableAppearances(state.consumableAppearances);
    setInventory({ items: [], equippedWeapon: null, equippedArmor: null });
    setMessages([{ text: "A new journey begins...", color: "#e2e8f0" }]);
    updateUI(state);
    draw();
  };

  const continueToEndless = () => {
    const state = continueEndless(gameRef.current);
    gameRef.current = state;
    setGameOver(false);
    setCopied(false);
    updateUI(state);
    draw();
  };

  const copyRunSummary = () => {
    const state = gameRef.current;
    if (!state) return;
    const currentStats = getStatsFromState(state);
    const rs = state.runStats;
    const maxFloor = VICTORY_FLOOR;
    const filled = Math.min(maxFloor, Math.round((rs.deepestFloor / maxFloor) * maxFloor));
    const bar = "\u2593".repeat(filled) + "\u2591".repeat(maxFloor - filled);
    const dailyTag = isDaily ? ` (Daily ${dailySeed})` : "";
    const isVictory = state.victory;
    const summary = isVictory
      ? [
          `\uD83C\uDFC6 NULLCRAWL \uD83C\uDFC6 ESCAPED!${dailyTag}`,
          `Floor ${rs.deepestFloor} | Level ${currentStats.level} | ${rs.enemiesKilled} kills | ${formatPlayTime(rs.startTime)}`,
          `${bar} Floor ${rs.deepestFloor}/${maxFloor}`,
        ].join("\n")
      : [
          `\u2620 NULLCRAWL \u2620${dailyTag}`,
          `Floor ${rs.deepestFloor} | Level ${currentStats.level} | ${rs.enemiesKilled} kills | ${formatPlayTime(rs.startTime)}${rs.killedBy ? ` | Killed by ${rs.killedBy}` : ""}`,
          `${bar} Floor ${rs.deepestFloor}/${maxFloor}`,
        ].join("\n");
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // If daily was already completed, show result screen instead of game
  if (isDaily && dailyCompleted && !gameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#c084fc" }}>DAILY VOID COMPLETE</h2>
          <p className="text-sm mb-4" style={{ color: "var(--void-muted)" }}>
            {formatDailyDate(dailyCompleted.date)}
          </p>
          <div
            className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono mb-6 px-4 py-3 rounded mx-auto"
            style={{ backgroundColor: "rgba(26, 26, 46, 0.8)", border: "1px solid #333", maxWidth: 280 }}
          >
            <span style={{ color: "#fbbf24" }}>Deepest floor</span>
            <span className="text-right">{dailyCompleted.floor}</span>
            <span style={{ color: "#fbbf24" }}>Level</span>
            <span className="text-right">{dailyCompleted.level}</span>
            <span style={{ color: "#fb923c" }}>Enemies slain</span>
            <span className="text-right">{dailyCompleted.kills}</span>
            <span style={{ color: "#06b6d4" }}>Items found</span>
            <span className="text-right">{dailyCompleted.itemsFound}</span>
            <span style={{ color: "var(--void-muted)" }}>Time played</span>
            <span className="text-right">{dailyCompleted.time}</span>
            {dailyCompleted.killedBy && (
              <>
                <span style={{ color: "#ef4444" }}>Killed by</span>
                <span className="text-right">{dailyCompleted.killedBy}</span>
              </>
            )}
          </div>
          <p className="text-xs mb-6" style={{ color: "var(--void-muted)" }}>
            You already played today&apos;s daily challenge. Come back tomorrow for a new one!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/play")}
              className="px-6 py-2 border-2 font-bold tracking-wider text-sm transition-all hover:scale-105"
              style={{ borderColor: "var(--void-cyan)", color: "var(--void-cyan)" }}
            >
              PLAY STANDARD
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 border-2 font-bold tracking-wider text-sm transition-all hover:scale-105"
              style={{ borderColor: "var(--void-muted)", color: "var(--void-muted)" }}
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-2">
      {/* Daily mode indicator */}
      {isDaily && (
        <div className="w-full max-w-[640px] text-center mb-1">
          <span className="text-xs font-bold tracking-widest" style={{ color: "#c084fc" }}>
            DAILY VOID &mdash; {formatDailyDate(dailySeed!)}
          </span>
        </div>
      )}
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
      {/* Null Attunement Meter */}
      {voidAttunement > 0 && (
        <div className="w-full max-w-[640px] mb-1 px-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span style={{ color: "#c084fc" }} className="font-bold">NULL</span>
            <div className="relative flex-1 h-2 rounded-sm overflow-hidden" style={{ backgroundColor: "#1a1a2e" }}>
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${voidAttunement}%`,
                  backgroundColor: voidAttunement >= 50 ? "#a855f7" : voidAttunement >= 25 ? "#c084fc" : "#7c3aed",
                }}
              />
              {/* Threshold markers */}
              <div className="absolute top-0 bottom-0 w-px" style={{ left: "25%", backgroundColor: "#4c1d95" }} />
              <div className="absolute top-0 bottom-0 w-px" style={{ left: "50%", backgroundColor: "#4c1d95" }} />
            </div>
            <span style={{ color: "var(--void-muted)" }}>{voidAttunement}/100</span>
          </div>
          {/* Active attunement effects */}
          <div className="flex gap-3 mt-0.5 text-xs font-mono">
            {voidAttunement >= 25 && (
              <>
                <span style={{ color: "#a855f7" }}>Void Sight (+2 FOV)</span>
                <span style={{ color: "#ef4444" }}>Enhanced Detection (+3)</span>
              </>
            )}
            {voidAttunement >= 50 && (
              <>
                <span style={{ color: "#a855f7" }}>Void Strike (+{getAttunementAtkBonus(voidAttunement)} ATK)</span>
                <span style={{ color: "#ef4444" }}>Weakened Healing (50%)</span>
              </>
            )}
          </div>
        </div>
      )}
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

        {shrinePrompt && (
          <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
            <div className="pointer-events-auto px-6 py-3 rounded border-2 text-center"
              style={{
                backgroundColor: "rgba(10, 10, 15, 0.95)",
                borderColor: "#a855f7",
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)",
              }}
            >
              <p className="text-sm font-bold mb-1" style={{ color: "#c084fc" }}>
                Void Shrine
              </p>
              <p className="text-xs mb-2" style={{ color: "#e2e8f0" }}>
                Commune with the Void? <span style={{ color: "#c084fc" }}>(+15 Null Attunement)</span>
              </p>
              <div className="flex gap-4 justify-center text-xs font-bold">
                <span style={{ color: "#22c55e" }}>[Y] Accept</span>
                <span style={{ color: "#ef4444" }}>[N] Decline</span>
              </div>
            </div>
          </div>
        )}

        {showTutorial && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
            <div
              className="pointer-events-auto px-6 py-4 rounded border-2 text-center max-w-xs"
              style={{
                backgroundColor: "rgba(10, 10, 15, 0.95)",
                borderColor: "#06b6d4",
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
              }}
            >
              <p className="text-sm font-bold mb-3" style={{ color: "#06b6d4" }}>
                HOW TO PLAY
              </p>
              <div className="text-xs font-mono space-y-2 mb-4" style={{ color: "#e2e8f0" }}>
                <p><span style={{ color: "#fbbf24" }}>WASD</span> or <span style={{ color: "#fbbf24" }}>Arrow Keys</span> to move</p>
                <p>Walk into enemies to <span style={{ color: "#ef4444" }}>attack</span></p>
                <p>Find the stairs <span style={{ color: "#06b6d4" }}>&gt;</span> to go deeper</p>
              </div>
              <button
                onClick={() => {
                  showTutorialRef.current = false;
                  setShowTutorial(false);
                  try { localStorage.setItem("nullcrawl_tutorial_seen", "1"); } catch {}
                }}
                className="px-4 py-1.5 border-2 font-bold tracking-wider text-xs transition-all hover:scale-105"
                style={{ borderColor: "#06b6d4", color: "#06b6d4" }}
              >
                GOT IT
              </button>
              <p className="text-xs mt-2" style={{ color: "var(--void-muted)" }}>
                Press <span style={{ color: "#fbbf24" }}>?</span> for full help
              </p>
            </div>
          </div>
        )}

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
            {victory ? (
              <>
                <p className="text-3xl font-bold mb-1" style={{ color: "#22c55e" }}>
                  YOU ESCAPED THE VOID!
                </p>
                <p className="text-sm mb-1" style={{ color: "#06b6d4" }}>
                  Congratulations, Void Walker.
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold mb-1" style={{ color: "#ef4444" }}>
                YOU DIED
              </p>
            )}
            {isDaily && (
              <p className="text-xs font-bold mb-1" style={{ color: "#c084fc" }}>
                DAILY VOID &mdash; {formatDailyDate(dailySeed!)}
              </p>
            )}
            <p className="text-sm mb-3" style={{ color: "var(--void-muted)" }}>
              Level {stats.level} &middot; Floor {stats.floor} &middot; {stats.turns} turns
            </p>
            <div
              className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono mb-4 px-4 py-2 rounded"
              style={{ backgroundColor: "rgba(26, 26, 46, 0.8)", border: `1px solid ${victory ? "#166534" : "#333"}` }}
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
            <div className="flex gap-3">
              <button
                onClick={copyRunSummary}
                className="px-4 py-2 border-2 font-bold tracking-wider text-sm transition-all hover:scale-105"
                style={{
                  borderColor: copied ? "#22c55e" : "#fbbf24",
                  color: copied ? "#22c55e" : "#fbbf24",
                }}
              >
                {copied ? "COPIED!" : victory ? "COPY VICTORY SUMMARY" : "COPY RUN SUMMARY"}
              </button>
              {victory && (
                <button
                  onClick={continueToEndless}
                  className="px-4 py-2 border-2 font-bold tracking-wider text-sm transition-all hover:scale-105"
                  style={{ borderColor: "#c084fc", color: "#c084fc" }}
                >
                  CONTINUE (ENDLESS)
                </button>
              )}
              <button
                onClick={restart}
                className="px-6 py-2 border-2 font-bold tracking-wider transition-all hover:scale-105"
                style={{ borderColor: "var(--void-cyan)", color: "var(--void-cyan)" }}
              >
                {isDaily ? "PLAY STANDARD" : victory ? "NEW RUN" : "TRY AGAIN"}
              </button>
            </div>
            <p className="mt-3 text-xs font-mono" style={{ color: "var(--void-muted)" }}>
              <span style={{ color: "#fbbf24" }}>C</span> copy{" "}
              {victory && <><span style={{ color: "#c084fc" }}>E</span> endless{" "}</>}
              <span style={{ color: "var(--void-cyan)" }}>R</span>/<span style={{ color: "var(--void-cyan)" }}>Enter</span> {isDaily ? "standard" : victory ? "new run" : "retry"}
            </p>
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
            {inventory.items.map((item, i) => {
              const isConsumable = item.category === "potion" || item.category === "scroll";
              const isIdent = item.effect ? identified[item.effect] ?? false : true;
              const appearance = item.effect ? consumableAppearances[item.effect] : undefined;
              const typeLabel = item.category === "potion" ? "Potion" : item.category === "scroll" ? "Scroll" : "";
              // Build display name for consumables
              const itemDisplayName = isConsumable && appearance
                ? isIdent
                  ? `${appearance} ${typeLabel} (${CONSUMABLE_EFFECT_NAMES[item.effect!]})`
                  : `${appearance} ${typeLabel} (?)`
                : item.name;
              return (
                <span key={item.id}>
                  <span style={{ color: "var(--void-muted)" }}>{i + 1}.</span>{" "}
                  <span style={{ color: item.color }}>{itemDisplayName}</span>
                  <span style={{ color: "var(--void-muted)" }}>
                    {item.attack != null ? ` (+${item.attack} ATK)` : ""}
                    {item.defense != null ? ` (+${item.defense} DEF)` : ""}
                    {isConsumable && isIdent && item.healAmount && item.healAmount > 0 ? ` (+${item.healAmount} HP)` : ""}
                    {isConsumable && isIdent && item.category === "potion" && !item.healAmount ? ` [${item.description}]` : ""}
                    {isConsumable && isIdent && item.category === "scroll" ? ` [${item.description}]` : ""}
                  </span>
                  {item.runic && (
                    <span style={{ color: "#c084fc" }}> [{RUNIC_NAMES[item.runic]}]</span>
                  )}
                </span>
              );
            })}
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
        Arrow keys / WASD to move &middot; Space to wait &middot; Walk into enemies to attack &middot; Find the stairs (&gt;) to descend &middot; 1-8 to use items &middot; M for map &middot; Esc to pause &middot; ? for help
      </div>
    </div>
  );
}
