import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CONFETTI_COLORS = [
    '#C8FF00', // Signal/Primary lime
    '#4CAF50', // Success green
    '#D4A843', // Warning gold
    '#4488FF', // Info blue
    '#FAFAFA', // White
    '#A1A1AA', // Muted
]

const PARTICLE_COUNT = 40

interface Particle {
    id: number
    x: number
    y: number
    color: string
    rotation: number
    size: number
    shape: 'circle' | 'square' | 'strip'
}

function generateParticles(): Particle[] {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: -(Math.random() * 300 + 150),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 720 - 360,
        size: Math.random() * 8 + 4,
        shape: (['circle', 'square', 'strip'] as const)[Math.floor(Math.random() * 3)],
    }))
}

export function Confetti({
    trigger,
    duration = 2000,
    onComplete,
}: {
    trigger: boolean
    duration?: number
    onComplete?: () => void
}) {
    const [particles, setParticles] = useState<Particle[]>([])
    const [active, setActive] = useState(false)

    useEffect(() => {
        if (trigger && !active) {
            setActive(true)
            setParticles(generateParticles())

            const timer = setTimeout(() => {
                setActive(false)
                setParticles([])
                onComplete?.()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [trigger, active, duration, onComplete])

    if (!active) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            rotate: 0,
                        }}
                        animate={{
                            opacity: 0,
                            x: p.x,
                            y: p.y,
                            rotate: p.rotation,
                            scale: 0.3,
                        }}
                        transition={{
                            duration: 1.2 + Math.random() * 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            delay: p.id * 0.015,
                        }}
                        style={{
                            position: 'absolute',
                            width: p.shape === 'strip' ? p.size * 0.4 : p.size,
                            height: p.shape === 'strip' ? p.size * 2 : p.size,
                            backgroundColor: p.color,
                            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'strip' ? '2px' : '1px',
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}

/**
 * Hook for triggering confetti imperatively.
 * Usage:
 *   const { fire, ConfettiComponent } = useConfetti()
 *   fire() // triggers confetti
 *   return <>{ConfettiComponent}</>
 */
export function useConfetti() {
    const [trigger, setTrigger] = useState(false)

    const fire = useCallback(() => {
        setTrigger(false)
        // Force a re-trigger on next tick
        requestAnimationFrame(() => setTrigger(true))
    }, [])

    const ConfettiComponent = (
        <Confetti
            trigger={trigger}
            onComplete={() => setTrigger(false)}
        />
    )

    return { fire, ConfettiComponent }
}
