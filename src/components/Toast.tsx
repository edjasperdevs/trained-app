import { motion, AnimatePresence } from 'motion/react'
import { useToastStore, ToastType } from '@/stores/toastStore'
import { Check, X, AlertTriangle, Info } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-surface border-l-[3px] border-l-success border border-border',
          icon: <Check size={16} className="text-success" />,
        }
      case 'error':
        return {
          container: 'bg-surface border-l-[3px] border-l-error border border-border',
          icon: <X size={16} className="text-error" />,
        }
      case 'warning':
        return {
          container: 'bg-surface border-l-[3px] border-l-warning border border-border',
          icon: <AlertTriangle size={16} className="text-warning" />,
        }
      case 'info':
        return {
          container: 'bg-surface border-l-[3px] border-l-info border border-border',
          icon: <Info size={16} className="text-info" />,
        }
    }
  }

  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 left-4 right-4 z-[100] pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = getToastStyles(toast.type)

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              layout
              className={`
                pointer-events-auto w-full max-w-sm
                ${style.container}
                rounded
                px-4 py-3 shadow-card
                flex items-center gap-3
              `}
            >
              {style.icon}
              <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
