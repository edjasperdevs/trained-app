import { motion } from 'framer-motion'
import { CountUp } from './CountUp'
import { cn } from '@/lib/cn'

interface AnimatedRingProps {
    percentage: number
    label: string
    current: string | number
    target: string | number
    subLabel?: string
    className?: string
}

export function AnimatedRing({
    percentage,
    label,
    current,
    target,
    subLabel,
    className
}: AnimatedRingProps) {
    const safePercentage = Math.min(Math.max(percentage, 0), 100)
    const isComplete = safePercentage >= 100

    // SVG parameters
    const size = 112 // 28 * 4 (Tailwind size-28)
    const strokeWidth = 10
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (safePercentage / 100) * circumference

    return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            <div className="relative size-28">
                <svg
                    className="size-full -rotate-90 origin-center"
                    viewBox={`0 0 ${size} ${size}`}
                >
                    {/* Background Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className="stroke-neutral-700/50"
                        fill="none"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className={cn(
                            "stroke-primary",
                            isComplete && "drop-shadow-[0_0_8px_rgba(200,255,0,0.8)]"
                        )}
                        fill="none"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ type: "spring", bounce: 0, duration: 1.5 }}
                        style={{ strokeDasharray: circumference }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-bold text-xl tracking-tight text-white flex items-center">
                        <CountUp to={safePercentage} />%
                    </span>
                </div>
            </div>
            <div className="text-center">
                <p className="font-display font-bold text-neutral-400 text-sm tracking-widest uppercase">{label}</p>
                <p className="font-mono text-xs text-primary mt-1">
                    {typeof current === 'number' ? <CountUp to={current} /> : current}{subLabel} / {target}{subLabel}
                </p>
            </div>
        </div>
    )
}
