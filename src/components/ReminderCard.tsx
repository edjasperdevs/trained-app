import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Card, Button } from '@/components'
import { useRemindersStore, ActiveReminder, ReminderType } from '@/stores/remindersStore'

interface ReminderCardProps {
  reminder: ActiveReminder
  onDismiss?: () => void
}

const TYPE_STYLES: Record<ReminderType, string> = {
  checkIn: 'border-l-primary',
  claimXP: 'border-l-secondary',
  workout: 'border-l-warning',
  logMacros: 'border-l-info',
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

  const style = TYPE_STYLES[reminder.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer border-l-[3px] ${style}`}
        onClick={handleAction}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {reminder.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm font-heading uppercase tracking-wide">
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
