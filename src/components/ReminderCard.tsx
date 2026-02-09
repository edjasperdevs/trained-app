import { useNavigate } from 'react-router-dom'
import { X, Beef, CheckCircle, Trophy, Dumbbell, Gift, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRemindersStore, ActiveReminder, ReminderType } from '@/stores/remindersStore'

const ICON_MAP: Record<string, LucideIcon> = {
  Beef, CheckCircle, Trophy, Dumbbell, Gift
}

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
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <Card
        className={`py-0 cursor-pointer border-l-[3px] ${style}`}
        onClick={handleAction}
      >
        <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {(() => {
              const Icon = ICON_MAP[reminder.icon]
              return Icon ? <Icon size={24} className="text-muted-foreground" /> : null
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              {reminder.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{reminder.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAction}>
              {reminder.action}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ReminderListProps {
  maxReminders?: number
  excludeTypes?: ReminderType[]
}

export function ReminderList({ maxReminders = 3, excludeTypes }: ReminderListProps) {
  const activeReminders = useRemindersStore((state) => state.getActiveReminders())
  const filtered = excludeTypes
    ? activeReminders.filter(r => !excludeTypes.includes(r.type))
    : activeReminders
  const displayReminders = filtered.slice(0, maxReminders)

  if (displayReminders.length === 0) return null

  return (
    <div className="space-y-3">
      {displayReminders.map((reminder) => (
        <ReminderCard key={reminder.type} reminder={reminder} />
      ))}
    </div>
  )
}
