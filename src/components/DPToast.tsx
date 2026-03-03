import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { dpToastVariants } from '@/lib/animations'
import { Zap } from 'lucide-react'

interface DPToastData {
    id: number
    amount: number
    action: string
}

const ACTION_LABELS: Record<string, string> = {
    training: 'Training',
    meal: 'Meal Logged',
    protein: 'Protein Target',
    steps: '10k Steps',
    sleep: 'Sleep',
}

/**
 * Floating "+15 DP" toast that appears when DP is awarded.
 * Animates upward and fades out.
 */
export function DPToastContainer({ toasts, onRemove }: {
    toasts: DPToastData[]
    onRemove: (id: number) => void
}) {
    return (
        <div className="fixed top-20 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        variants={dpToastVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        onAnimationComplete={() => {
                            setTimeout(() => onRemove(toast.id), 800)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm"
                    >
                        <Zap size={14} className="text-primary fill-primary" />
                        <span className="text-sm font-bold font-heading text-primary">
                            +{toast.amount} DP
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {ACTION_LABELS[toast.action] || toast.action}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

/**
 * Hook for managing DP toast notifications.
 * Usage:
 *   const { showDPToast, toasts, removeToast } = useDPToasts()
 *   showDPToast(15, 'meal')
 *   return <DPToastContainer toasts={toasts} onRemove={removeToast} />
 */
let toastIdCounter = 0

export function useDPToasts() {
    const [toasts, setToasts] = useState<DPToastData[]>([])

    const showDPToast = useCallback((amount: number, action: string) => {
        if (amount <= 0) return
        const id = ++toastIdCounter
        setToasts((prev) => [...prev, { id, amount, action }])

        // Auto-remove after 2.5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 2500)
    }, [])

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return { showDPToast, toasts, removeToast }
}
