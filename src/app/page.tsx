'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ColorMatchGame } from '@/lib/gameEngine'
import { GameState, GameEvent } from '@/lib/gameTypes'
import GameHUD from '@/components/Game/GameHUD'
import GameMenu from '@/components/Game/GameMenu'
import GameAudio from '@/components/Game/GameAudio'

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<ColorMatchGame | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU)
  const [gameStats, setGameStats] = useState({
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    highScore: 0,
    achievements: [] as Array<{
      id: string;
      name: string;
      description: string;
      unlocked: boolean;
      icon: string;
    }>
  })
  const [notifications, setNotifications] = useState<string[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 })

  // Handle canvas resizing for mobile optimization
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    
    // Calculate optimal canvas size maintaining aspect ratio
    const aspectRatio = 2/3 // height/width
    let width = Math.min(containerRect.width, 400)
    let height = width * aspectRatio
    
    // Ensure canvas fits in viewport
    if (height > containerRect.height) {
      height = containerRect.height
      width = height / aspectRatio
    }
    
    setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
  }, [])

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height
    
    // Initialize game engine
    gameRef.current = new ColorMatchGame(canvas)
    
    // Set up event listeners
    const handleGameEvent = (event: GameEvent) => {
      switch (event.type) {
        case 'ORB_MATCHED':
          setGameStats(prev => ({ ...prev, ...gameRef.current!.stats }))
          addNotification(`+${event.points} points!`)
          break
          
        case 'ORB_MISSED':
          setGameStats(prev => ({ ...prev, ...gameRef.current!.stats }))
          addNotification('Missed!')
          break
          
        case 'LEVEL_UP':
          setGameStats(prev => ({ ...prev, ...gameRef.current!.stats }))
          addNotification(`Level ${event.newLevel}!`)
          break
          
        case 'GAME_OVER':
          setGameState(GameState.GAME_OVER)
          setGameStats(prev => ({ ...prev, ...gameRef.current!.stats }))
          addNotification(`Game Over! Final Score: ${event.finalScore}`)
          break
          
        case 'ACHIEVEMENT_UNLOCKED':
          addNotification(`Achievement: ${event.achievement.name}`)
          break
      }
    }

    gameRef.current.addEventListener(handleGameEvent)
    
    // Update game state
    const gameStateInterval = setInterval(() => {
      if (gameRef.current) {
        setGameState(gameRef.current.state)
        setGameStats({ ...gameRef.current.stats })
      }
    }, 100)

    return () => {
      if (gameRef.current) {
        gameRef.current.removeEventListener(handleGameEvent)
        gameRef.current.destroy()
      }
      clearInterval(gameStateInterval)
    }
  }, [canvasSize])

  // Handle window resize
  useEffect(() => {
    updateCanvasSize()
    
    const handleResize = () => {
      updateCanvasSize()
    }
    
    const handleOrientationChange = () => {
      setTimeout(updateCanvasSize, 500) // Delay for orientation change completion
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [updateCanvasSize])

  // Handle viewport meta tag for mobile
  useEffect(() => {
    // Prevent zoom on touch
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    // Prevent context menu
    const preventContextMenu = (e: Event) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('touchstart', preventZoom, { passive: false })
    document.addEventListener('touchmove', preventZoom, { passive: false })
    document.addEventListener('contextmenu', preventContextMenu)
    
    // Prevent scroll
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('touchstart', preventZoom)
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [])

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-4), message]) // Keep last 5 notifications
    setTimeout(() => {
      setNotifications(prev => prev.slice(1))
    }, 3000)
  }

  const handleStartGame = () => {
    if (gameRef.current) {
      gameRef.current.startGame()
      setGameState(GameState.PLAYING)
    }
  }

  const handlePauseGame = () => {
    if (gameRef.current) {
      gameRef.current.pauseGame()
    }
  }

  const handleResumeGame = () => {
    if (gameRef.current) {
      gameRef.current.pauseGame() // This toggles pause/resume
    }
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Game Audio */}
      <GameAudio gameState={gameState} />
      
      {/* Main Game Container */}
      <div 
        ref={containerRef}
        className="relative flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-4"
      >
        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border-4 border-white/20 rounded-2xl shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              touchAction: 'none',
              userSelect: 'none',
            }}
          />
          
          {/* Game HUD Overlay */}
          {gameState === GameState.PLAYING && (
            <GameHUD 
              stats={gameStats}
              onPause={handlePauseGame}
              notifications={notifications}
              canvasSize={canvasSize}
            />
          )}
          
          {/* Pause Button for Playing State */}
          {gameState === GameState.PLAYING && (
            <button
              onClick={handlePauseGame}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 z-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
          )}
        </div>

        {/* Game Menu Overlay */}
        {(gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.PAUSED) && (
          <GameMenu 
            gameState={gameState}
            stats={gameStats}
            onStartGame={handleStartGame}
            onResumeGame={handleResumeGame}
            canvasSize={canvasSize}
          />
        )}
      </div>

      {/* Instructions for mobile */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white/80 text-sm">
          {gameState === GameState.MENU && (
            <p>🎯 Tap falling orbs to match them with the rotating color wheels!</p>
          )}
          {gameState === GameState.PLAYING && (
            <p>💫 Combo: {gameStats.combo} | Level: {gameStats.level} | Lives: {'❤️'.repeat(gameStats.lives)}</p>
          )}
        </div>
      </div>

      {/* Performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
          Canvas: {canvasSize.width}×{canvasSize.height}
          <br />
          State: {gameState}
        </div>
      )}
    </div>
  )
}