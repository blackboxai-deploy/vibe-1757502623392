// Core Game Engine for Color Match Rush

import {
  GameEngine,
  GameOrb,
  ColorWheel,
  PowerUp,
  ParticleEffect,
  GameState,
  GameStats,
  GameConfig,
  PowerUpType,
  TouchInput,
  Vector2D,
  GameEvent
} from './gameTypes';

export class ColorMatchGame implements GameEngine {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  state: GameState = GameState.MENU;
  stats: GameStats;
  orbs: GameOrb[] = [];
  wheels: ColorWheel[] = [];
  powerUps: PowerUp[] = [];
  particles: ParticleEffect[] = [];
  lastFrameTime: number = 0;
  deltaTime: number = 0;
  config: GameConfig;
  
  private animationFrameId: number | null = null;
  private eventListeners: ((event: GameEvent) => void)[] = [];
  private keys: Set<string> = new Set();
  private lastOrbSpawn: number = 0;
  private lastPowerUpSpawn: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.config = {
      canvas: {
        width: canvas.width,
        height: canvas.height
      },
      orb: {
        baseSpeed: 200,
        spawnRate: 1000, // ms
        maxOnScreen: 8,
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
      },
      wheel: {
        baseRotationSpeed: 1.5,
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
      },
      powerUp: {
        spawnChance: 0.15,
        duration: 5000
      },
      physics: {
        gravity: 300,
        maxVelocity: 500
      },
      scoring: {
        basePoints: 10,
        comboMultiplier: 1.2,
        timeBonus: 5
      }
    };

    this.stats = {
      score: 0,
      lives: 3,
      level: 1,
      combo: 0,
      highScore: this.loadHighScore(),
      achievements: this.initializeAchievements()
    };

    this.initializeWheels();
    this.setupEventListeners();
  }

  private initializeAchievements() {
    return [
      { id: 'first_match', name: 'First Match', description: 'Match your first orb', unlocked: false, icon: '🎯' },
      { id: 'combo_5', name: 'Combo Master', description: 'Get a 5x combo', unlocked: false, icon: '⚡' },
      { id: 'level_5', name: 'Speed Demon', description: 'Reach level 5', unlocked: false, icon: '🚀' },
      { id: 'score_1000', name: 'High Scorer', description: 'Score 1000 points', unlocked: false, icon: '👑' },
      { id: 'perfect_game', name: 'Perfectionist', description: 'Complete a level without missing', unlocked: false, icon: '💎' }
    ];
  }

  private initializeWheels() {
    // Create two color wheels
    this.wheels = [
      {
        id: 'wheel1',
        position: { x: this.config.canvas.width * 0.25, y: this.config.canvas.height * 0.8 },
        radius: 60,
        rotation: 0,
        rotationSpeed: this.config.wheel.baseRotationSpeed,
        colors: this.config.wheel.colors.slice(0, 4),
        segments: 4
      },
      {
        id: 'wheel2',
        position: { x: this.config.canvas.width * 0.75, y: this.config.canvas.height * 0.8 },
        radius: 60,
        rotation: 0,
        rotationSpeed: -this.config.wheel.baseRotationSpeed,
        colors: this.config.wheel.colors.slice(4, 8),
        segments: 4
      }
    ];
  }

  private setupEventListeners() {
    if (!this.canvas) return;

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouch.bind(this), { passive: false });
    
    // Mouse events for desktop testing
    this.canvas.addEventListener('mousedown', this.handleMouse.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouse.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouse.bind(this));

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleTouch(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const rect = this.canvas!.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.handleInput({ x, y, timestamp: Date.now() });
    }
  }

  private handleMouse(event: MouseEvent) {
    const rect = this.canvas!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.handleInput({ x, y, timestamp: Date.now() });
  }

  private handleInput(input: TouchInput) {
    if (this.state === GameState.PLAYING) {
      this.checkOrbTap(input);
    } else if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) {
      // Handle menu interactions
      this.startGame();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    this.keys.add(event.key.toLowerCase());
    
    if (event.key === ' ' && this.state === GameState.PLAYING) {
      this.pauseGame();
    } else if (event.key === 'Enter' && (this.state === GameState.MENU || this.state === GameState.GAME_OVER)) {
      this.startGame();
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    this.keys.delete(event.key.toLowerCase());
  }

  public startGame() {
    this.state = GameState.PLAYING;
    this.stats.score = 0;
    this.stats.lives = 3;
    this.stats.level = 1;
    this.stats.combo = 0;
    this.orbs = [];
    this.powerUps = [];
    this.particles = [];
    this.lastOrbSpawn = 0;
    this.lastPowerUpSpawn = 0;
    
    if (!this.animationFrameId) {
      this.gameLoop();
    }
  }

  public pauseGame() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
    }
  }

  public gameOver() {
    this.state = GameState.GAME_OVER;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      this.saveHighScore(this.stats.score);
    }
    this.emitEvent({ type: 'GAME_OVER', finalScore: this.stats.score });
  }

  private gameLoop = (timestamp: number = 0) => {
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // Cap delta time to prevent spiral of death
    this.deltaTime = Math.min(this.deltaTime, 1/30);

    if (this.state === GameState.PLAYING) {
      this.update();
    }
    
    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update() {
    const now = Date.now();
    
    // Spawn orbs
    if (now - this.lastOrbSpawn > this.config.orb.spawnRate / this.stats.level && 
        this.orbs.length < this.config.orb.maxOnScreen) {
      this.spawnOrb();
      this.lastOrbSpawn = now;
    }

    // Spawn power-ups occasionally
    if (now - this.lastPowerUpSpawn > 10000 && Math.random() < this.config.powerUp.spawnChance) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = now;
    }

    // Update orbs
    this.updateOrbs();
    
    // Update wheels
    this.updateWheels();
    
    // Update power-ups
    this.updatePowerUps();
    
    // Update particles
    this.updateParticles();
    
    // Check level progression
    this.checkLevelProgression();
  }

  private spawnOrb() {
    const colors = [...this.config.orb.colors];
    const orb: GameOrb = {
      id: `orb_${Date.now()}_${Math.random()}`,
      position: {
        x: Math.random() * (this.config.canvas.width - 60) + 30,
        y: -30
      },
      velocity: { x: 0, y: this.config.orb.baseSpeed * this.stats.level },
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 20,
      lifetime: 5000,
      maxLifetime: 5000
    };
    
    this.orbs.push(orb);
  }

  private spawnPowerUp() {
    const types = [PowerUpType.TIME_SLOW, PowerUpType.COLOR_REVEAL, PowerUpType.EXTRA_LIFE, PowerUpType.SCORE_MULTIPLIER];
    const powerUp: PowerUp = {
      id: `powerup_${Date.now()}`,
      type: types[Math.floor(Math.random() * types.length)],
      position: {
        x: Math.random() * (this.config.canvas.width - 40) + 20,
        y: -30
      },
      duration: this.config.powerUp.duration,
      maxDuration: this.config.powerUp.duration,
      isActive: false
    };
    
    this.powerUps.push(powerUp);
  }

  private updateOrbs() {
    this.orbs.forEach(orb => {
      orb.velocity.y += this.config.physics.gravity * this.deltaTime;
      orb.velocity.y = Math.min(orb.velocity.y, this.config.physics.maxVelocity);
      
      orb.position.x += orb.velocity.x * this.deltaTime;
      orb.position.y += orb.velocity.y * this.deltaTime;
      
      orb.lifetime -= this.deltaTime * 1000;
    });

    // Remove orbs that are off-screen or expired
    const orbsToRemove = this.orbs.filter(orb => 
      orb.position.y > this.config.canvas.height + 50 || orb.lifetime <= 0
    );
    
    orbsToRemove.forEach(orb => {
      this.stats.lives--;
      this.stats.combo = 0;
      this.createMissEffect(orb.position);
      this.emitEvent({ type: 'ORB_MISSED', orb });
      
      if (this.stats.lives <= 0) {
        this.gameOver();
      }
    });

    this.orbs = this.orbs.filter(orb => 
      orb.position.y <= this.config.canvas.height + 50 && orb.lifetime > 0
    );
  }

  private updateWheels() {
    this.wheels.forEach(wheel => {
      wheel.rotation += wheel.rotationSpeed * this.deltaTime;
    });
  }

  private updatePowerUps() {
    this.powerUps.forEach(powerUp => {
      if (!powerUp.isActive) {
        powerUp.position.y += 100 * this.deltaTime;
      } else {
        powerUp.duration -= this.deltaTime * 1000;
      }
    });

    // Remove expired power-ups
    this.powerUps = this.powerUps.filter(powerUp => 
      (!powerUp.isActive && powerUp.position.y <= this.config.canvas.height + 50) ||
      (powerUp.isActive && powerUp.duration > 0)
    );
  }

  private updateParticles() {
    this.particles.forEach(particle => {
      particle.position.x += particle.velocity.x * this.deltaTime;
      particle.position.y += particle.velocity.y * this.deltaTime;
      particle.lifetime -= this.deltaTime * 1000;
      particle.size *= 0.98; // Shrink over time
    });

    this.particles = this.particles.filter(particle => particle.lifetime > 0);
  }

  private checkOrbTap(input: TouchInput) {
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      const distance = Math.sqrt(
        Math.pow(input.x - orb.position.x, 2) + 
        Math.pow(input.y - orb.position.y, 2)
      );

      if (distance <= orb.radius + 10) { // Add touch tolerance
        this.checkOrbWheelMatch(orb, input);
        break;
      }
    }
  }

  private checkOrbWheelMatch(orb: GameOrb, input: TouchInput) {
    for (const wheel of this.wheels) {
      const distance = Math.sqrt(
        Math.pow(input.x - wheel.position.x, 2) + 
        Math.pow(input.y - wheel.position.y, 2)
      );

      if (distance <= wheel.radius + 50) { // Expanded match area
        const currentSegment = this.getCurrentWheelSegment(wheel);
        
        if (orb.color === wheel.colors[currentSegment]) {
          this.handleSuccessfulMatch(orb, wheel);
          return;
        }
      }
    }

    // No match found
    this.handleMissedMatch(orb);
  }

  private getCurrentWheelSegment(wheel: ColorWheel): number {
    const normalizedRotation = ((wheel.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const segmentAngle = (Math.PI * 2) / wheel.segments;
    return Math.floor(normalizedRotation / segmentAngle);
  }

  private handleSuccessfulMatch(orb: GameOrb, wheel: ColorWheel) {
    this.stats.combo++;
    const points = Math.floor(
      this.config.scoring.basePoints * 
      Math.pow(this.config.scoring.comboMultiplier, this.stats.combo - 1)
    );
    
    this.stats.score += points;
    this.createMatchEffect(orb.position, orb.color);
    this.emitEvent({ type: 'ORB_MATCHED', orb, wheel, points });
    
    // Remove the orb
    this.orbs = this.orbs.filter(o => o.id !== orb.id);
    
    // Check achievements
    this.checkAchievements();
  }

  private handleMissedMatch(orb: GameOrb) {
    this.stats.combo = 0;
    this.createMissEffect(orb.position);
    this.emitEvent({ type: 'ORB_MISSED', orb });
    
    // Remove the orb
    this.orbs = this.orbs.filter(o => o.id !== orb.id);
  }

  private createMatchEffect(position: Vector2D, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const particle: ParticleEffect = {
        id: `particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * 100,
          y: Math.sin(angle) * 100
        },
        color,
        size: 8,
        lifetime: 500,
        maxLifetime: 500,
        type: 'explosion'
      };
      this.particles.push(particle);
    }
  }

  private createMissEffect(position: Vector2D) {
    for (let i = 0; i < 4; i++) {
      const particle: ParticleEffect = {
        id: `miss_particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 50
        },
        color: '#FF4444',
        size: 6,
        lifetime: 300,
        maxLifetime: 300,
        type: 'miss'
      };
      this.particles.push(particle);
    }
  }

  private checkLevelProgression() {
    const targetScore = this.stats.level * 200;
    if (this.stats.score >= targetScore) {
      this.stats.level++;
      this.emitEvent({ type: 'LEVEL_UP', newLevel: this.stats.level });
      
      // Increase difficulty
      this.wheels.forEach(wheel => {
        wheel.rotationSpeed *= 1.1;
      });
    }
  }

  private checkAchievements() {
    const achievements = this.stats.achievements;
    
    if (this.stats.combo >= 1 && !achievements.find(a => a.id === 'first_match')?.unlocked) {
      this.unlockAchievement('first_match');
    }
    
    if (this.stats.combo >= 5 && !achievements.find(a => a.id === 'combo_5')?.unlocked) {
      this.unlockAchievement('combo_5');
    }
    
    if (this.stats.level >= 5 && !achievements.find(a => a.id === 'level_5')?.unlocked) {
      this.unlockAchievement('level_5');
    }
    
    if (this.stats.score >= 1000 && !achievements.find(a => a.id === 'score_1000')?.unlocked) {
      this.unlockAchievement('score_1000');
    }
  }

  private unlockAchievement(id: string) {
    const achievement = this.stats.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.emitEvent({ type: 'ACHIEVEMENT_UNLOCKED', achievement });
    }
  }

  private render() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
      this.renderGame();
    } else if (this.state === GameState.MENU) {
      this.renderMenu();
    } else if (this.state === GameState.GAME_OVER) {
      this.renderGameOver();
    }
  }

  private renderGame() {
    if (!this.ctx) return;

    // Render wheels
    this.wheels.forEach(wheel => this.renderWheel(wheel));
    
    // Render orbs
    this.orbs.forEach(orb => this.renderOrb(orb));
    
    // Render power-ups
    this.powerUps.forEach(powerUp => this.renderPowerUp(powerUp));
    
    // Render particles
    this.particles.forEach(particle => this.renderParticle(particle));

    if (this.state === GameState.PAUSED) {
      this.renderPauseOverlay();
    }
  }

  private renderWheel(wheel: ColorWheel) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.translate(wheel.position.x, wheel.position.y);
    this.ctx.rotate(wheel.rotation);

    const segmentAngle = (Math.PI * 2) / wheel.segments;
    
    for (let i = 0; i < wheel.segments; i++) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, wheel.radius, i * segmentAngle, (i + 1) * segmentAngle);
      this.ctx.arc(0, 0, wheel.radius * 0.3, (i + 1) * segmentAngle, i * segmentAngle, true);
      this.ctx.closePath();
      this.ctx.fillStyle = wheel.colors[i];
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private renderOrb(orb: GameOrb) {
    if (!this.ctx) return;

    // Orb glow
    const gradient = this.ctx.createRadialGradient(
      orb.position.x, orb.position.y, 0,
      orb.position.x, orb.position.y, orb.radius * 1.5
    );
    gradient.addColorStop(0, orb.color);
    gradient.addColorStop(0.7, orb.color + '80');
    gradient.addColorStop(1, orb.color + '00');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(orb.position.x, orb.position.y, orb.radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Orb body
    this.ctx.fillStyle = orb.color;
    this.ctx.beginPath();
    this.ctx.arc(orb.position.x, orb.position.y, orb.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Orb highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(orb.position.x - 5, orb.position.y - 5, orb.radius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderPowerUp(powerUp: PowerUp) {
    if (!this.ctx || powerUp.isActive) return;

    this.ctx.save();
    this.ctx.translate(powerUp.position.x, powerUp.position.y);
    
    // Power-up glow
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.7, '#FFD70080');
    gradient.addColorStop(1, '#FFD70000');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // Power-up icon background
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Power-up icon
    this.ctx.fillStyle = '#333';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const icon = this.getPowerUpIcon(powerUp.type);
    this.ctx.fillText(icon, 0, 0);

    this.ctx.restore();
  }

  private getPowerUpIcon(type: PowerUpType): string {
    switch (type) {
      case PowerUpType.TIME_SLOW: return '⏰';
      case PowerUpType.COLOR_REVEAL: return '👁';
      case PowerUpType.EXTRA_LIFE: return '❤️';
      case PowerUpType.SCORE_MULTIPLIER: return '⭐';
      default: return '?';
    }
  }

  private renderParticle(particle: ParticleEffect) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.globalAlpha = particle.lifetime / particle.maxLifetime;
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private renderMenu() {
    if (!this.ctx) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Color Match Rush', this.config.canvas.width / 2, this.config.canvas.height / 2 - 100);

    this.ctx.font = '24px Arial';
    this.ctx.fillText('Tap to Start', this.config.canvas.width / 2, this.config.canvas.height / 2);

    this.ctx.font = '18px Arial';
    this.ctx.fillText(`High Score: ${this.stats.highScore}`, this.config.canvas.width / 2, this.config.canvas.height / 2 + 50);
  }

  private renderGameOver() {
    if (!this.ctx) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', this.config.canvas.width / 2, this.config.canvas.height / 2 - 80);

    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${this.stats.score}`, this.config.canvas.width / 2, this.config.canvas.height / 2 - 20);
    this.ctx.fillText(`High Score: ${this.stats.highScore}`, this.config.canvas.width / 2, this.config.canvas.height / 2 + 20);

    this.ctx.font = '18px Arial';
    this.ctx.fillText('Tap to Play Again', this.config.canvas.width / 2, this.config.canvas.height / 2 + 70);
  }

  private renderPauseOverlay() {
    if (!this.ctx) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.config.canvas.width / 2, this.config.canvas.height / 2);
  }

  // Event system
  public addEventListener(listener: (event: GameEvent) => void) {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: GameEvent) => void) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emitEvent(event: GameEvent) {
    this.eventListeners.forEach(listener => listener(event));
  }

  // Persistence
  private loadHighScore(): number {
    try {
      const stored = localStorage.getItem('colorMatchRush_highScore');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number) {
    try {
      localStorage.setItem('colorMatchRush_highScore', score.toString());
    } catch {
      // Ignore storage errors
    }
  }

  // Cleanup
  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.eventListeners = [];
    
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.handleTouch);
      this.canvas.removeEventListener('touchmove', this.handleTouch);
      this.canvas.removeEventListener('touchend', this.handleTouch);
      this.canvas.removeEventListener('mousedown', this.handleMouse);
      this.canvas.removeEventListener('mousemove', this.handleMouse);
      this.canvas.removeEventListener('mouseup', this.handleMouse);
    }
    
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}