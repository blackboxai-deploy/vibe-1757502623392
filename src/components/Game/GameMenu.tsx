'use client'

import { GameState } from '@/lib/gameTypes'

interface GameStats {
  score: number;
  lives: number;
  level: number;
  combo: number;
  highScore: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    icon: string;
  }>;
}

interface GameMenuProps {
  gameState: GameState;
  stats: GameStats;
  onStartGame: () => void;
  onResumeGame: () => void;
  canvasSize: { width: number; height: number };
}

export default function GameMenu({ 
  gameState, 
  stats, 
  onStartGame, 
  onResumeGame, 
  canvasSize 
}: GameMenuProps) {
  
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore && stats.score > 0

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
      }}
    >
      <div className="text-center text-white p-8 max-w-sm mx-auto">
        
        {/* Menu State */}
        {gameState === GameState.MENU && (
          <>
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
                Color Match
              </h1>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Rush
              </h2>
              <div className="flex justify-center mt-4 space-x-2">
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <div className="w-4 h-4 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
            </div>

            {/* Game Description */}
            <div className="mb-8 text-gray-300">
              <p className="text-sm mb-4">
                Fast-paced color matching action!
              </p>
              <div className="flex justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <span>🎯</span>
                  <span>Match Colors</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⚡</span>
                  <span>Build Combos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🚀</span>
                  <span>Level Up</span>
                </div>
              </div>
            </div>

            {/* High Score */}
            {stats.highScore > 0 && (
              <div className="mb-6 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="text-yellow-400 text-sm font-semibold">Best Score</div>
                <div className="text-yellow-300 text-2xl font-bold">
                  {stats.highScore.toLocaleString()}
                </div>
              </div>
            )}

            {/* Achievements Preview */}
            <div className="mb-8">
              <div className="text-sm text-gray-400 mb-2">Achievements</div>
              <div className="flex justify-center space-x-2">
                {stats.achievements.slice(0, 5).map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className={`text-xl ${
                      achievement.unlocked ? '' : 'grayscale opacity-30'
                    }`}
                    title={achievement.unlocked ? achievement.name : '???'}
                  >
                    {achievement.icon}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.achievements.filter(a => a.unlocked).length} / {stats.achievements.length} unlocked
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={onStartGame}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="text-xl">🚀 START GAME</span>
            </button>

            {/* Instructions */}
            <div className="mt-6 text-xs text-gray-400">
              <p>Tap falling orbs to match wheel colors</p>
              <p>Build combos • Avoid misses • Level up!</p>
            </div>
          </>
        )}

        {/* Paused State */}
        {gameState === GameState.PAUSED && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">⏸️ PAUSED</h2>
              <div className="text-gray-300">Game is paused</div>
            </div>

            {/* Current Stats */}
            <div className="mb-8 space-y-3">
              <div className="bg-black/40 rounded-lg p-3 flex justify-between">
                <span className="text-gray-400">Score:</span>
                <span className="text-yellow-400 font-bold">{stats.score.toLocaleString()}</span>
              </div>
              <div className="bg-black/40 rounded-lg p-3 flex justify-between">
                <span className="text-gray-400">Level:</span>
                <span className="text-blue-400 font-bold">{stats.level}</span>
              </div>
              <div className="bg-black/40 rounded-lg p-3 flex justify-between">
                <span className="text-gray-400">Lives:</span>
                <span className="text-red-400 font-bold">{'❤️'.repeat(stats.lives)}</span>
              </div>
            </div>

            {/* Resume Button */}
            <button
              onClick={onResumeGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="text-xl">▶️ RESUME</span>
            </button>
          </>
        )}

        {/* Game Over State */}
        {gameState === GameState.GAME_OVER && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-red-400 mb-2">💀 GAME OVER</h2>
              {isNewHighScore && (
                <div className="text-yellow-400 font-bold animate-pulse mb-2">
                  🏆 NEW HIGH SCORE! 🏆
                </div>
              )}
            </div>

            {/* Final Stats */}
            <div className="mb-8 space-y-4">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="text-yellow-400 text-sm font-semibold">Final Score</div>
                <div className="text-yellow-300 text-3xl font-bold">
                  {stats.score.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-gray-400">Level Reached</div>
                  <div className="text-blue-400 font-bold text-xl">{stats.level}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-gray-400">Best Combo</div>
                  <div className="text-purple-400 font-bold text-xl">{stats.combo}</div>
                </div>
              </div>

              {stats.highScore > 0 && !isNewHighScore && (
                <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Previous Best</div>
                  <div className="text-gray-300 font-bold">
                    {stats.highScore.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Play Again Button */}
            <button
              onClick={onStartGame}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="text-xl">🔄 PLAY AGAIN</span>
            </button>

            {/* Share Score (placeholder) */}
            <div className="mt-6 text-xs text-gray-400">
              <p>Challenge friends to beat your score!</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}