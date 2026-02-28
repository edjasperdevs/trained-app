import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useHealthStore, useDPStore } from '@/stores'
import { RANKS } from '@/stores/dpStore'
import { RankUpModal } from '@/components'
import { Footprints, Moon, X } from 'lucide-react'

interface ManualHealthEntryProps {
  isOpen: boolean
  onClose: () => void
}

export function ManualHealthEntry({ isOpen, onClose }: ManualHealthEntryProps) {
  const setManualSteps = useHealthStore((state) => state.setManualSteps)
  const setManualSleep = useHealthStore((state) => state.setManualSleep)
  const getEffectiveSteps = useHealthStore((state) => state.getEffectiveSteps)
  const getEffectiveSleep = useHealthStore((state) => state.getEffectiveSleep)

  // Initialize with current effective values
  const currentSteps = getEffectiveSteps()
  const currentSleepMinutes = getEffectiveSleep()

  const [steps, setSteps] = useState<string>(currentSteps > 0 ? currentSteps.toString() : '')
  const [sleepHours, setSleepHours] = useState<string>(
    currentSleepMinutes > 0 ? Math.floor(currentSleepMinutes / 60).toString() : ''
  )
  const [sleepMinutes, setSleepMinutes] = useState<string>(
    currentSleepMinutes > 0 ? (currentSleepMinutes % 60).toString() : ''
  )
  const [errors, setErrors] = useState<{ steps?: string; sleep?: string }>({})
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)

  const validate = (): boolean => {
    const newErrors: { steps?: string; sleep?: string } = {}

    const stepsNum = steps ? parseInt(steps, 10) : 0
    if (steps && (isNaN(stepsNum) || stepsNum < 0)) {
      newErrors.steps = 'Steps must be a positive number'
    }

    const hoursNum = sleepHours ? parseInt(sleepHours, 10) : 0
    const minsNum = sleepMinutes ? parseInt(sleepMinutes, 10) : 0
    const totalSleepHours = hoursNum + minsNum / 60

    if (sleepHours && (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24)) {
      newErrors.sleep = 'Hours must be 0-24'
    }
    if (sleepMinutes && (isNaN(minsNum) || minsNum < 0 || minsNum > 59)) {
      newErrors.sleep = 'Minutes must be 0-59'
    }
    if (totalSleepHours > 24) {
      newErrors.sleep = 'Total sleep cannot exceed 24 hours'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const stepsNum = steps ? parseInt(steps, 10) : 0
    const hoursNum = sleepHours ? parseInt(sleepHours, 10) : 0
    const minsNum = sleepMinutes ? parseInt(sleepMinutes, 10) : 0
    const totalSleepMinutes = hoursNum * 60 + minsNum

    // Set manual values in store
    if (stepsNum > 0) {
      setManualSteps(stepsNum)
    }
    if (totalSleepMinutes > 0) {
      setManualSleep(totalSleepMinutes)
    }

    // Check and award DP for steps and sleep
    const todayLog = useDPStore.getState().getTodayLog()
    let lastRankUp: { rankedUp: boolean; newRank: number } | null = null

    // Award steps DP if threshold met and not already awarded
    if (stepsNum >= 10000 && !(todayLog && todayLog.steps > 0)) {
      const result = useDPStore.getState().awardDP('steps')
      if (result.rankedUp) lastRankUp = result
    }

    // Award sleep DP if threshold met (7h = 420 min) and not already awarded
    if (totalSleepMinutes >= 420 && !(todayLog && todayLog.sleep > 0)) {
      const result = useDPStore.getState().awardDP('sleep')
      if (result.rankedUp) lastRankUp = result
    }

    // Handle rank-up
    if (lastRankUp && lastRankUp.rankedUp) {
      const rankEntry = RANKS.find(r => r.rank === lastRankUp!.newRank)
      setRankUpData({
        oldRank: lastRankUp.newRank - 1,
        newRank: lastRankUp.newRank,
        rankName: rankEntry?.name || 'Unknown'
      })
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manual health entry"
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-card max-h-[90vh] flex flex-col rounded-t-xl sm:rounded-xl border border-border animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Log Health Data</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Steps Input */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Footprints size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Steps</p>
                    <p className="text-xs text-muted-foreground">10,000+ for +10 DP</p>
                  </div>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="10000"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.steps && (
                  <p className="text-destructive text-sm mt-1">{errors.steps}</p>
                )}
              </CardContent>
            </Card>

            {/* Sleep Input */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Moon size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Sleep</p>
                    <p className="text-xs text-muted-foreground">7+ hours for +10 DP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="7"
                      min="0"
                      max="24"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-1">hours</p>
                  </div>
                  <span className="text-muted-foreground font-bold">:</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={sleepMinutes}
                      onChange={(e) => setSleepMinutes(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="59"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-1">minutes</p>
                  </div>
                </div>
                {errors.sleep && (
                  <p className="text-destructive text-sm mt-1">{errors.sleep}</p>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full" size="lg">
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          rankName={rankUpData.rankName}
          onClose={() => {
            setRankUpData(null)
            onClose()
          }}
        />
      )}
    </>
  )
}
