import { motion } from 'framer-motion'
import { WeightEntry } from '@/stores'

interface WeightChartProps {
  data: WeightEntry[]
  height?: number
  goalWeight?: number
  showGoalLine?: boolean
  unit?: string
}

export function WeightChart({
  data,
  height = 150,
  goalWeight,
  showGoalLine = true,
  unit = 'lbs'
}: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-secondary text-sm glass rounded-xl"
        style={{ height }}
      >
        No weight data yet
      </div>
    )
  }

  // Calculate min/max for scaling
  const weights = data.map(d => d.weight)
  if (goalWeight) weights.push(goalWeight)

  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1 // Avoid division by zero
  const padding = range * 0.15 // Add 15% padding

  const chartMin = minWeight - padding
  const chartMax = maxWeight + padding
  const chartRange = chartMax - chartMin

  // Create points for the line
  const points = data.map((entry, index) => {
    const x = (index / (data.length - 1 || 1)) * 100
    const y = ((entry.weight - chartMin) / chartRange) * 100
    return { x, y: 100 - y, weight: entry.weight, date: entry.date }
  })

  // Create SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Create area fill path
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} 100 L 0 100 Z`

  // Calculate goal line Y position
  const goalLineY = goalWeight
    ? 100 - ((goalWeight - chartMin) / chartRange) * 100
    : null

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate weekly averages for markers
  const weeklyAverages = calculateWeeklyAverages(data)

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-text-secondary font-digital">
        <span>{Math.round(chartMax)}</span>
        <span>{Math.round((chartMax + chartMin) / 2)}</span>
        <span>{Math.round(chartMin)}</span>
      </div>

      {/* Chart area */}
      <div className="ml-12 h-full relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-text-primary/10" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-text-primary/10" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-text-primary/10" />

          {/* Goal line */}
          {showGoalLine && goalLineY !== null && goalLineY >= 0 && goalLineY <= 100 && (
            <>
              <motion.line
                x1="0"
                y1={goalLineY}
                x2="100"
                y2={goalLineY}
                stroke="var(--chart-goal-alpha)"
                strokeWidth="1"
                strokeDasharray="4 2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.text
                x="2"
                y={goalLineY - 2}
                fill="var(--chart-goal-text)"
                fontSize="3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Goal
              </motion.text>
            </>
          )}

          {/* Area fill */}
          <motion.path
            d={areaD}
            fill="url(#weightGradientNew)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.5 }}
          />

          {/* Line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#lineGradientNew)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="1.5"
              className="fill-accent-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
            />
          ))}

          {/* Weekly average markers */}
          {weeklyAverages.map((avg, index) => {
            const y = 100 - ((avg.weight - chartMin) / chartRange) * 100
            const x = (avg.dataIndex / (data.length - 1 || 1)) * 100
            return (
              <motion.circle
                key={`avg-${index}`}
                cx={x}
                cy={y}
                r="2.5"
                fill="none"
                stroke="var(--chart-avg-stroke)"
                strokeWidth="1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              />
            )
          })}

          {/* Gradients - Updated for gold/green */}
          <defs>
            <linearGradient id="weightGradientNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-line-start)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--chart-line-start)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradientNew" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-line-start)" />
              <stop offset="100%" stopColor="var(--chart-line-end)" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-text-secondary transform translate-y-5">
          {data.length > 0 && <span>{formatDate(data[0].date)}</span>}
          {data.length > 1 && <span>{formatDate(data[data.length - 1].date)}</span>}
        </div>
      </div>

      {/* Current value indicator */}
      {data.length > 0 && (
        <div className="absolute top-0 right-0 glass rounded-lg px-3 py-1.5">
          <span className="text-xs text-text-secondary">Latest: </span>
          <span className="font-digital font-bold text-accent-primary">
            {data[data.length - 1].weight} {unit}
          </span>
        </div>
      )}
    </div>
  )
}

// Calculate weekly averages for markers on the chart
function calculateWeeklyAverages(data: WeightEntry[]): { weight: number; dataIndex: number }[] {
  if (data.length < 7) return []

  const averages: { weight: number; dataIndex: number }[] = []
  const weekSize = 7

  for (let i = weekSize - 1; i < data.length; i += weekSize) {
    const weekData = data.slice(Math.max(0, i - weekSize + 1), i + 1)
    const avg = weekData.reduce((sum, e) => sum + e.weight, 0) / weekData.length
    averages.push({
      weight: Math.round(avg * 10) / 10,
      dataIndex: i
    })
  }

  return averages
}
