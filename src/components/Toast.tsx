import { motion, AnimatePresence } from 'motion/react'
import { useToastStore, ToastType } from '@/stores/toastStore'
import { Check, X, AlertTriangle, Info } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const toastVariants = cva(
  'bg-surface border border-border rounded px-4 py-3 shadow-card flex items-center gap-3',
  {
    variants: {
      type: {
        success: 'border-l-[3px] border-l-success',
        error: 'border-l-[3px] border-l-error',
        warning: 'border-l-[3px] border-l-warning',
        info: 'border-l-[3px] border-l-info',
      },
    },
  }
)

const toastIcons: Record<ToastType, JSX.Element> = {
  success: <Check size={16} className="text-success" />,
  error: <X size={16} className="text-error" />,
  warning: <AlertTriangle size={16} className="text-warning" />,
  info: <Info size={16} className="text-info" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 left-4 right-4 z-[100] pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            layout
            className={cn(
              'pointer-events-auto w-full max-w-sm',
              toastVariants({ type: toast.type })
            )}
          >
            {toastIcons[toast.type]}
            <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
