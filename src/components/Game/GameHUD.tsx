'use client'

import { useState, useEffect } from 'react'

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

interface GameHUDProps {
  stats: GameStats;
  onPause: () => void;
  notifications: string[];
  canvasSize: { width: number; height: number };
}

export default function GameHUD({ stats, onPause, notifications, canvasSize }: GameHUDProps) {
  const [showAchievements, setShowAchievements] = useState(false)
  
  // Auto-hide achievements after 3 seconds
  useEffect(() => {
    if (showAchievements) {
      const timer = setTimeout(() => setShowAchievements(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showAchievements])

  const comboColor = stats.combo >= 5 ? '#FFD700' : stats.combo >= 3 ? '#FF6B6B' : '#4ECDC4'
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
        {/* Score and Level */}
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 text-white min-w-[120px]">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-xs text-gray-300">
            Level {stats.level}
          </div>
        </div>

        {/* Lives */}
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 text-white flex items-center gap-1">
          {Array.from({ length: Math.max(stats.lives, 0) }, (_, i) => (
            <span key={i} className="text-red-500 text-lg">❤️</span>
          ))}
          {stats.lives === 0 && <span className="text-gray-500 text-sm">💔</span>}
        </div>
      </div>

      {/* Combo Indicator */}
      {stats.combo > 1 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <div 
            className="bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 text-white font-bold animate-pulse"
            style={{ 
              color: comboColor,
              textShadow: `0 0 10px ${comboColor}`,
              border: `2px solid ${comboColor}40`
            }}
          >
            <span className="text-lg">{stats.combo}x</span>
            <span className="text-sm ml-1">COMBO!</span>
          </div>
        </div>
      )}

      {/* High Score Badge (when achieved) */}
      {stats.score > 0 && stats.score >= stats.highScore && stats.highScore > 0 && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-3 py-1 rounded-full text-sm">
            🏆 NEW HIGH SCORE!
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold text-sm animate-fade-in-up"
            style={{
              animationDelay: `${index * 100}ms`,
              animationDuration: '0.5s',
              animationFillMode: 'both'
            }}
          >
            {notification}
          </div>
        ))}
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-auto">
        {/* High Score */}
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-2 text-white text-xs">
          <div className="text-gray-300">Best</div>
          <div className="font-bold text-yellow-400">{stats.highScore.toLocaleString()}</div>
        </div>

        {/* Achievements Button */}
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-xl p-3 text-white transition-all duration-200 relative"
        >
          <span className="text-lg">🏆</span>
          {stats.achievements.filter(a => a.unlocked).length > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {stats.achievements.filter(a => a.unlocked).length}
            </div>
          )}
        </button>
      </div>

      {/* Achievements Popup */}
      {showAchievements && (
        <div className="absolute inset-4 bg-black/90 backdrop-blur-sm rounded-2xl p-6 text-white pointer-events-auto overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">🏆 Achievements</h2>
            <button
              onClick={() => setShowAchievements(false)}
              className="text-white/60 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {stats.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  achievement.unlocked 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-gray-500/20 border border-gray-500/30'
                }`}
              >
                <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </span>
                <div className="flex-1">
                  <div className={`font-semibold ${achievement.unlocked ? 'text-green-400' : 'text-gray-400'}`}>
                    {achievement.name}
                  </div>
                  <div className={`text-sm ${achievement.unlocked ? 'text-green-300' : 'text-gray-500'}`}>
                    {achievement.description}
                  </div>
                </div>
                {achievement.unlocked && (
                  <div className="text-green-400 font-bold text-sm">✓</div>
                )}
              </div>
            ))}
          </div>

          {stats.achievements.filter(a => a.unlocked).length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <div className="text-4xl mb-2">🎯</div>
              <div>Complete achievements by playing!</div>
            </div>
          )}
        </div>
      )}

      {/* Game Instructions Overlay (first time) */}
      {stats.score === 0 && stats.level === 1 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 text-white text-center max-w-xs mx-4">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-bold mb-2">How to Play</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>• Tap falling orbs to catch them</p>
              <p>• Match orb colors with wheel segments</p>
              <p>• Build combos for higher scores</p>
              <p>• Don't let orbs fall off screen!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add CSS animation styles
const styles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}