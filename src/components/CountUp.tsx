import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { springs } from '@/lib/animations'

export function CountUp({
    to,
    from = 0,
    className
}: {
    to: number
    from?: number
    className?: string
}) {
    const count = useMotionValue(from)

    // Use spring physics for a more natural number roll
    const smoothCount = useSpring(count, springs.bouncy)

    const rounded = useTransform(smoothCount, (latest) => {
        return Math.round(latest).toLocaleString()
    })

    useEffect(() => {
        count.set(to)
    }, [count, to])

    return <motion.span className={className}>{rounded}</motion.span>
}
