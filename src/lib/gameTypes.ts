// Game Types and Interfaces for Color Match Rush

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameOrb {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  color: string;
  radius: number;
  lifetime: number;
  maxLifetime: number;
}

export interface ColorWheel {
  id: string;
  position: Vector2D;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  colors: string[];
  segments: number;
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector2D;
  duration: number;
  maxDuration: number;
  isActive: boolean;
}

export enum PowerUpType {
  TIME_SLOW = 'time_slow',
  COLOR_REVEAL = 'color_reveal',
  EXTRA_LIFE = 'extra_life',
  SCORE_MULTIPLIER = 'score_multiplier'
}

export interface ParticleEffect {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  type: 'explosion' | 'miss' | 'powerup';
}

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

export interface GameStats {
  score: number;
  lives: number;
  level: number;
  combo: number;
  highScore: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  orb: {
    baseSpeed: number;
    spawnRate: number;
    maxOnScreen: number;
    colors: string[];
  };
  wheel: {
    baseRotationSpeed: number;
    colors: string[];
  };
  powerUp: {
    spawnChance: number;
    duration: number;
  };
  physics: {
    gravity: number;
    maxVelocity: number;
  };
  scoring: {
    basePoints: number;
    comboMultiplier: number;
    timeBonus: number;
  };
}

export interface TouchInput {
  x: number;
  y: number;
  timestamp: number;
}

export interface GameEngine {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  state: GameState;
  stats: GameStats;
  orbs: GameOrb[];
  wheels: ColorWheel[];
  powerUps: PowerUp[];
  particles: ParticleEffect[];
  lastFrameTime: number;
  deltaTime: number;
  config: GameConfig;
}

export interface AudioManager {
  context: AudioContext | null;
  sounds: Map<string, AudioBuffer>;
  isEnabled: boolean;
  volume: number;
}

// Game Events
export type GameEvent = 
  | { type: 'ORB_MATCHED'; orb: GameOrb; wheel: ColorWheel; points: number }
  | { type: 'ORB_MISSED'; orb: GameOrb }
  | { type: 'POWER_UP_COLLECTED'; powerUp: PowerUp }
  | { type: 'LEVEL_UP'; newLevel: number }
  | { type: 'GAME_OVER'; finalScore: number }
  | { type: 'ACHIEVEMENT_UNLOCKED'; achievement: Achievement };