// ============================================================
// Game Event Bus — Communication between Phaser and React
// ============================================================

type EventCallback = (...args: unknown[]) => void;

class GameEventBus {
  private readonly listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event);
    if (set) set.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  removeAll(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new GameEventBus();

// Event names
export const GAME_EVENTS = {
  // Phaser → React
  PLAYER_DIED: "player:died",
  LEVEL_COMPLETE: "level:complete",
  COINS_CHANGED: "coins:changed",
  GAME_READY: "game:ready",
  GAME_PAUSED: "game:paused",
  GAME_RESUMED: "game:resumed",

  // React → Phaser
  LOAD_LEVEL: "level:load",
  RESTART_LEVEL: "level:restart",
  PAUSE_GAME: "game:pause",
  RESUME_GAME: "game:resume",
} as const;
