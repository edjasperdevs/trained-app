import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Card, Button } from '@/components'
import { useRemindersStore, ActiveReminder, ReminderType } from '@/stores/remindersStore'
import { useTheme } from '@/themes'

interface ReminderCardProps {
  reminder: ActiveReminder
  onDismiss?: () => void
}

const TYPE_STYLES: Record<ReminderType, { gyg: string; trained: string }> = {
  checkIn: {
    gyg: 'from-primary/20 to-secondary/20 border-primary',
    trained: 'border-l-primary'
  },
  claimXP: {
    gyg: 'from-secondary/20 to-primary/20 border-secondary',
    trained: 'border-l-secondary'
  },
  workout: {
    gyg: 'from-warning/20 to-primary/20 border-warning',
    trained: 'border-l-warning'
  },
  logMacros: {
    gyg: 'from-info/20 to-secondary/20 border-info',
    trained: 'border-l-info'
  }
}

export function ReminderCard({ reminder, onDismiss }: ReminderCardProps) {
  const navigate = useNavigate()
  const dismissReminder = useRemindersStore((state) => state.dismissReminder)
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const handleAction = () => {
    navigate(reminder.route)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    dismissReminder(reminder.type)
    onDismiss?.()
  }

  const style = TYPE_STYLES[reminder.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer ${
          isTrained
            ? `border-l-[3px] ${style.trained}`
            : `bg-gradient-to-r ${style.gyg}`
        }`}
        onClick={handleAction}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={isTrained ? undefined : { scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            {reminder.icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
              {reminder.title}
            </p>
            <p className="text-xs text-text-secondary truncate">{reminder.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAction}>
              {reminder.action}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-text-secondary hover:text-text-primary p-1 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

interface ReminderListProps {
  maxReminders?: number
}

export function ReminderList({ maxReminders = 3 }: ReminderListProps) {
  const activeReminders = useRemindersStore((state) => state.getActiveReminders())
  const displayReminders = activeReminders.slice(0, maxReminders)

  if (displayReminders.length === 0) return null

  return (
    <div className="space-y-3">
      {displayReminders.map((reminder) => (
        <ReminderCard key={reminder.type} reminder={reminder} />
      ))}
    </div>
  )
}
