import React, { useEffect, useState, useCallback } from 'react'
import ReactCanvasConfetti from 'react-canvas-confetti'

interface ThankYouModalProps {
  onClose: () => void
  buttonPosition?: DOMRect
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ onClose, buttonPosition }) => {
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)

    const timer = setTimeout(() => {
      onClose()
    }, 1500) // Changed to 1500ms (1.5 seconds)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [onClose])

  const confettiOrigin = buttonPosition
    ? {
        x: (buttonPosition.left + buttonPosition.right) / 2 / window.innerWidth,
        y: (buttonPosition.top + buttonPosition.bottom) / 2 / window.innerHeight,
      }
    : { x: 0.5, y: 0.5 }

  const makeShot = useCallback((particleRatio: number, opts: any) => {
    return {
      ...opts,
      origin: confettiOrigin,
      particleCount: Math.floor(200 * particleRatio),
    }
  }, [confettiOrigin])

  const fire = useCallback(() => {
    const fireworksInstance = (window as any).fireworks;
    if (fireworksInstance) {
      fireworksInstance(makeShot(0.25, {
        spread: 26,
        startVelocity: 55,
      }))

      fireworksInstance(makeShot(0.2, {
        spread: 60,
      }))

      fireworksInstance(makeShot(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      }))

      fireworksInstance(makeShot(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      }))

      fireworksInstance(makeShot(0.1, {
        spread: 120,
        startVelocity: 45,
      }))
    }
  }, [makeShot])

  useEffect(() => {
    fire()
    const interval = setInterval(fire, 300) // Reduced to 300ms for faster fireworks during shorter display
    return () => clearInterval(interval)
  }, [fire])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ReactCanvasConfetti
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0
        }}
        refConfetti={(node) => ((window as any).fireworks = node)}
      />
      <div className="bg-white p-8 rounded-lg shadow-lg text-center animate-fade-in-up">
        <h2 className="text-3xl font-bold mb-4 text-blue-600">Thank You!</h2>
        <p className="text-xl mb-6">Your order has been placed successfully.</p>
      </div>
    </div>
  )
}

export default ThankYouModal