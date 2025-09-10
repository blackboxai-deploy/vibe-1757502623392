'use client'

import { useEffect, useRef, useState } from 'react'
import { GameState } from '@/lib/gameTypes'

interface GameAudioProps {
  gameState: GameState;
}

export default function GameAudio({ gameState }: GameAudioProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      if (!isInitialized && typeof window !== 'undefined') {
        try {
          // Create audio context on first user interaction
          const context = new (window.AudioContext || (window as any).webkitAudioContext)()
          audioContextRef.current = context
          setIsInitialized(true)
          setIsEnabled(true)
        } catch (error) {
          console.log('Web Audio API not supported:', error)
        }
      }
    }

    // Initialize on first user interaction
    const handleUserInteraction = () => {
      initAudio()
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('click', handleUserInteraction)
    }

    document.addEventListener('touchstart', handleUserInteraction, { once: true })
    document.addEventListener('click', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('click', handleUserInteraction)
    }
  }, [isInitialized])

  // Sound generation functions
  const playMatchSound = () => {
    if (!audioContextRef.current || !isEnabled) return
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Pleasant match sound (major chord)
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
    
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.3)
  }

  const playMissSound = () => {
    if (!audioContextRef.current || !isEnabled) return
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Descending miss sound
    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2)
    
    oscillator.type = 'sawtooth'
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.2)
  }

  const playComboSound = (comboLevel: number) => {
    if (!audioContextRef.current || !isEnabled) return
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Higher pitch for higher combos
    const basePitch = 523.25 + (comboLevel * 50)
    oscillator.frequency.setValueAtTime(basePitch, ctx.currentTime)
    oscillator.frequency.setValueAtTime(basePitch * 1.5, ctx.currentTime + 0.1)
    
    oscillator.type = 'triangle'
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.15)
  }

  const playLevelUpSound = () => {
    if (!audioContextRef.current || !isEnabled) return
    
    const ctx = audioContextRef.current
    
    // Ascending arpeggio for level up
    const notes = [261.63, 329.63, 392.00, 523.25] // C4, E4, G4, C5
    
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime)
        oscillator.type = 'triangle'
        
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.3)
      }, index * 100)
    })
  }

  const playGameOverSound = () => {
    if (!audioContextRef.current || !isEnabled) return
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Dramatic descending game over sound
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0)
    
    oscillator.type = 'square'
    
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0)
    
    oscillator.start()
    oscillator.stop(ctx.currentTime + 1.0)
  }

  // Game state sound effects
  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      setTimeout(() => playGameOverSound(), 500) // Delay for dramatic effect
    }
  }, [gameState])

  // Expose sound functions to window for game engine to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gameAudio = {
        playMatchSound,
        playMissSound,
        playComboSound,
        playLevelUpSound,
        playGameOverSound,
        isEnabled
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).gameAudio
      }
    }
  }, [isEnabled])

  const toggleAudio = () => {
    setIsEnabled(!isEnabled)
  }

  return (
    <div className="absolute top-4 right-20 z-50">
      <button
        onClick={toggleAudio}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          isEnabled 
            ? 'bg-green-500/80 hover:bg-green-600/80 text-white' 
            : 'bg-red-500/80 hover:bg-red-600/80 text-white'
        }`}
        title={isEnabled ? 'Mute Sound' : 'Enable Sound'}
      >
        {isEnabled ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        )}
      </button>
    </div>
  )
}