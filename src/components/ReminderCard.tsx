import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/components'
import { useRemindersStore, ActiveReminder, ReminderType } from '@/stores/remindersStore'

interface ReminderCardProps {
  reminder: ActiveReminder
  onDismiss?: () => void
}

const TYPE_COLORS: Record<ReminderType, string> = {
  checkIn: 'from-accent-primary/20 to-accent-secondary/20 border-accent-primary',
  claimXP: 'from-accent-secondary/20 to-accent-primary/20 border-accent-secondary',
  workout: 'from-accent-warning/20 to-accent-primary/20 border-accent-warning',
  logMacros: 'from-cyan-500/20 to-purple-500/20 border-cyan-500'
}

export function ReminderCard({ reminder, onDismiss }: ReminderCardProps) {
  const navigate = useNavigate()
  const dismissReminder = useRemindersStore((state) => state.dismissReminder)

  const handleAction = () => {
    navigate(reminder.route)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    dismissReminder(reminder.type)
    onDismiss?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`bg-gradient-to-r ${TYPE_COLORS[reminder.type]} cursor-pointer`}
        onClick={handleAction}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            {reminder.icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{reminder.title}</p>
            <p className="text-xs text-gray-400 truncate">{reminder.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAction}>
              {reminder.action}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 p-1 text-xs"
              title="Dismiss"
            >
              ✕
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
