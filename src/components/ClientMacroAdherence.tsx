import { ProgressBar } from './ProgressBar'
import type { MacroAdherence } from '@/hooks/useClientDetails'

interface ClientMacroAdherenceProps {
  data: MacroAdherence
}

interface DailyStatus {
  date: string
  proteinHit: boolean
  caloriesHit: boolean
}

export function ClientMacroAdherence({ data }: ClientMacroAdherenceProps) {
  const { logs, targets } = data

  if (!targets) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No macro targets set
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No macro data logged
      </div>
    )
  }

  // Calculate daily hit/miss status (within 10% tolerance)
  const tolerance = 0.1
  const dailyStatus: DailyStatus[] = logs.map(log => ({
    date: log.date,
    proteinHit: log.protein >= targets.protein * (1 - tolerance),
    caloriesHit: log.calories >= targets.calories * (1 - tolerance) &&
                 log.calories <= targets.calories * (1 + tolerance)
  }))

  // Calculate aggregate adherence rates
  const proteinHitCount = dailyStatus.filter(d => d.proteinHit).length
  const caloriesHitCount = dailyStatus.filter(d => d.caloriesHit).length
  const totalDays = dailyStatus.length

  const proteinRate = Math.round((proteinHitCount / totalDays) * 100)
  const caloriesRate = Math.round((caloriesHitCount / totalDays) * 100)

  // Format date for bar chart label
  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.getDate().toString()
  }

  return (
    <div className="space-y-4">
      {/* Aggregate rates */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Protein</span>
            <span className="font-digital text-success">{proteinRate}%</span>
          </div>
          <ProgressBar
            progress={proteinRate}
            color={proteinRate >= 80 ? 'success' : proteinRate >= 60 ? 'primary' : 'secondary'}
            size="sm"
          />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Calories</span>
            <span className="font-digital text-primary">{caloriesRate}%</span>
          </div>
          <ProgressBar
            progress={caloriesRate}
            color={caloriesRate >= 80 ? 'success' : caloriesRate >= 60 ? 'primary' : 'secondary'}
            size="sm"
          />
        </div>
      </div>

      {/* Daily bar chart */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Last {totalDays} days</p>
        <div className="flex gap-1 items-end h-12">
          {dailyStatus.map((day, index) => {
            const bothHit = day.proteinHit && day.caloriesHit
            const oneHit = day.proteinHit || day.caloriesHit

            let bgColor = 'bg-secondary' // neither hit
            if (bothHit) bgColor = 'bg-success'
            else if (oneHit) bgColor = 'bg-warning'

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center animate-in fade-in duration-200"
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <div
                  className={`w-full rounded-t ${bgColor}`}
                  style={{
                    height: bothHit ? '100%' : oneHit ? '66%' : '33%',
                    minHeight: '8px'
                  }}
                  title={`${new Date(day.date).toLocaleDateString()}: ${
                    bothHit ? 'Both targets hit' :
                    day.proteinHit ? 'Protein hit' :
                    day.caloriesHit ? 'Calories hit' :
                    'Targets missed'
                  }`}
                />
              </div>
            )
          })}
        </div>
        {/* Date labels for first and last */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatDay(dailyStatus[0]?.date || '')}</span>
          <span>{formatDay(dailyStatus[dailyStatus.length - 1]?.date || '')}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-success" />
          <span>Both</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-warning" />
          <span>One</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-secondary" />
          <span>Neither</span>
        </div>
      </div>
    </div>
  )
}
