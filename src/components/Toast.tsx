import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore, ToastType } from '@/stores/toastStore'

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-accent-success/20',
    border: 'border-accent-success/50',
    icon: '✓'
  },
  error: {
    bg: 'bg-accent-danger/20',
    border: 'border-accent-danger/50',
    icon: '✕'
  },
  warning: {
    bg: 'bg-accent-warning/20',
    border: 'border-accent-warning/50',
    icon: '⚠'
  },
  info: {
    bg: 'bg-accent-primary/20',
    border: 'border-accent-primary/50',
    icon: 'ℹ'
  }
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type]

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              layout
              className={`
                pointer-events-auto w-full max-w-sm
                ${style.bg} ${style.border}
                border rounded-lg px-4 py-3 shadow-lg
                flex items-center gap-3
              `}
            >
              <span className="text-lg">{style.icon}</span>
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
