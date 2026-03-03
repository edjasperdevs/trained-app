import { motion } from 'framer-motion'
import { pageVariants, springs } from '@/lib/animations'
import { type ReactNode } from 'react'

/**
 * Wraps a screen/page with entrance/exit animation.
 * Use this inside each screen component for consistent page transitions.
 */
export function AnimatedPage({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springs.smooth}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Staggered list container — children animate in sequence.
 * Use with motion.div items that have fadeUp variants.
 */
export function StaggerList({
    children,
    className,
    delay = 0.05,
}: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            className={className}
            transition={{ staggerChildren: delay }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Individual stagger item — use as children of StaggerList.
 */
export function StaggerItem({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            variants={{
                initial: { opacity: 0, y: 16 },
                animate: { opacity: 1, y: 0 },
            }}
            transition={springs.default}
            className={className}
        >
            {children}
        </motion.div>
    )
}
