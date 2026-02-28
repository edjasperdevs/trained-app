import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar, RankUpModal } from '@/components'
import { ManualHealthEntry } from '@/components/ManualHealthEntry'
import { useHealthStore, useDPStore } from '@/stores'
import { RANKS } from '@/stores/dpStore'
import { isIOS } from '@/lib/platform'
import { Footprints, Moon, Check, Pencil, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS_THRESHOLD = 10000
const SLEEP_THRESHOLD_MINUTES = 420 // 7 hours

export function HealthCard() {
  const navigate = useNavigate()
  const permissionStatus = useHealthStore((state) => state.permissionStatus)
  const getEffectiveSteps = useHealthStore((state) => state.getEffectiveSteps)
  const getEffectiveSleep = useHealthStore((state) => state.getEffectiveSleep)
  const fetchTodayHealth = useHealthStore((state) => state.fetchTodayHealth)

  const [showManualEntry, setShowManualEntry] = useState(false)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)
  const [dpAwarded, setDpAwarded] = useState({ steps: false, sleep: false })

  const steps = getEffectiveSteps()
  const sleepMinutes = getEffectiveSleep()

  const stepsProgress = Math.min(steps / STEPS_THRESHOLD, 1)
  const sleepProgress = Math.min(sleepMinutes / SLEEP_THRESHOLD_MINUTES, 1)
  const stepsMet = steps >= STEPS_THRESHOLD
  const sleepMet = sleepMinutes >= SLEEP_THRESHOLD_MINUTES

  // Format sleep as "Xh Ym"
  const formatSleep = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Fetch health data on mount if permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted') {
      fetchTodayHealth()
    }
  }, [permissionStatus, fetchTodayHealth])

  // Check and award DP when thresholds are met
  useEffect(() => {
    const todayLog = useDPStore.getState().getTodayLog()

    // Award steps DP if threshold met and not already awarded
    if (steps >= STEPS_THRESHOLD && !(todayLog && todayLog.steps > 0) && !dpAwarded.steps) {
      const result = useDPStore.getState().awardDP('steps')
      setDpAwarded(prev => ({ ...prev, steps: true }))
      if (result.rankedUp) {
        const rankEntry = RANKS.find(r => r.rank === result.newRank)
        setRankUpData({
          oldRank: result.newRank - 1,
          newRank: result.newRank,
          rankName: rankEntry?.name || 'Unknown'
        })
      }
    }

    // Award sleep DP if threshold met and not already awarded
    if (sleepMinutes >= SLEEP_THRESHOLD_MINUTES && !(todayLog && todayLog.sleep > 0) && !dpAwarded.sleep) {
      const result = useDPStore.getState().awardDP('sleep')
      setDpAwarded(prev => ({ ...prev, sleep: true }))
      if (result.rankedUp) {
        const rankEntry = RANKS.find(r => r.rank === result.newRank)
        setRankUpData({
          oldRank: result.newRank - 1,
          newRank: result.newRank,
          rankName: rankEntry?.name || 'Unknown'
        })
      }
    }
  }, [steps, sleepMinutes, dpAwarded])

  // Show "Connect Health" prompt if iOS user hasn't made a choice
  if (isIOS() && permissionStatus === 'unknown') {
    return (
      <Card className="py-0">
        <CardContent className="p-4">
          <button
            onClick={() => navigate('/health-permission')}
            className="w-full flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Connect Health</p>
              <p className="text-sm text-muted-foreground">
                Track steps and sleep for +20 DP daily
              </p>
            </div>
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Health Tracking
            </h3>
            <button
              onClick={() => setShowManualEntry(true)}
              className="text-primary hover:text-primary/80 transition-colors p-1"
              aria-label="Edit health data"
            >
              <Pencil size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Footprints size={18} className={stepsMet ? 'text-success' : 'text-muted-foreground'} />
                  <span className="text-sm">Steps</span>
                  {stepsMet && <Check size={14} className="text-success" />}
                </div>
                <span className="text-sm font-mono">
                  {steps.toLocaleString()} / {STEPS_THRESHOLD.toLocaleString()}
                </span>
              </div>
              <ProgressBar
                progress={stepsProgress * 100}
                color={stepsMet ? 'success' : 'primary'}
                size="sm"
              />
              {stepsMet && (
                <p className="text-xs text-success mt-1">+10 DP earned</p>
              )}
            </div>

            {/* Sleep */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon size={18} className={sleepMet ? 'text-success' : 'text-muted-foreground'} />
                  <span className="text-sm">Sleep</span>
                  {sleepMet && <Check size={14} className="text-success" />}
                </div>
                <span className="text-sm font-mono">
                  {formatSleep(sleepMinutes)} / 7h
                </span>
              </div>
              <ProgressBar
                progress={sleepProgress * 100}
                color={sleepMet ? 'success' : 'primary'}
                size="sm"
              />
              {sleepMet && (
                <p className="text-xs text-success mt-1">+10 DP earned</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Modal */}
      <ManualHealthEntry
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
      />

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          rankName={rankUpData.rankName}
          onClose={() => setRankUpData(null)}
        />
      )}
    </>
  )
}
