import { motion } from 'framer-motion'
import { WeightEntry } from '@/stores'

interface WeightChartProps {
  data: WeightEntry[]
  height?: number
}

export function WeightChart({ data, height = 150 }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500 text-sm"
        style={{ height }}
      >
        No weight data yet
      </div>
    )
  }

  // Calculate min/max for scaling
  const weights = data.map(d => d.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1 // Avoid division by zero
  const padding = range * 0.1 // Add 10% padding

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

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500 font-digital">
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
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-gray-800" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-gray-800" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-gray-800" />

          {/* Area fill */}
          <motion.path
            d={areaD}
            fill="url(#weightGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.5 }}
          />

          {/* Line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
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
              transition={{ delay: index * 0.05, duration: 0.2 }}
            />
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(0, 212, 255)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(0, 212, 255)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(0, 212, 255)" />
              <stop offset="100%" stopColor="rgb(157, 78, 221)" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 transform translate-y-5">
          {data.length > 0 && <span>{formatDate(data[0].date)}</span>}
          {data.length > 1 && <span>{formatDate(data[data.length - 1].date)}</span>}
        </div>
      </div>

      {/* Current value indicator */}
      {data.length > 0 && (
        <div className="absolute top-0 right-0 bg-bg-card rounded px-2 py-1">
          <span className="text-xs text-gray-400">Latest: </span>
          <span className="font-digital font-bold text-accent-primary">
            {data[data.length - 1].weight} lbs
          </span>
        </div>
      )}
    </div>
  )
}
