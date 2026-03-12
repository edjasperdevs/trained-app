import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useHealthStore } from '@/stores'
import { Heart, Footprints, Moon, Check } from 'lucide-react'

export function HealthPermission() {
  const navigate = useNavigate()
  const requestPermission = useHealthStore((state) => state.requestPermission)
  const setPermissionStatus = useHealthStore((state) => state.setPermissionStatus)
  const [isRequesting, setIsRequesting] = useState(false)

  const handleEnableHealth = async () => {
    setIsRequesting(true)
    try {
      await requestPermission()
      // Permission status is already set by requestPermission
      navigate('/', { replace: true })
    } catch {
      // On error, mark as denied and continue
      setPermissionStatus('denied')
      navigate('/', { replace: true })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleManualEntry = () => {
    setPermissionStatus('denied')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-16 pb-8 flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Track Your Health</h1>
        <p className="text-muted-foreground">
          Connect Apple Health to automatically track your steps and sleep
        </p>
      </div>

      {/* Cards - centered in remaining space */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Benefits Card */}
        <Card className="mb-3">
          <CardContent className="px-3 py-2 space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Health Rewards
            </h2>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Footprints size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Daily Steps</p>
                  <p className="text-xs text-muted-foreground">10,000+ steps</p>
                </div>
                <span className="text-primary font-mono font-bold text-sm">+10 DP</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Moon size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Quality Sleep</p>
                  <p className="text-xs text-muted-foreground">7+ hours</p>
                </div>
                <span className="text-primary font-mono font-bold text-sm">+10 DP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardContent className="px-3 py-2 space-y-1">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              How it works
            </h2>

            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>Steps sync automatically from Apple Health</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>Sleep syncs automatically from Apple Health</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>DP awarded once per day when thresholds are met</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleEnableHealth}
          className="w-full"
          size="lg"
          disabled={isRequesting}
        >
          {isRequesting ? 'Connecting...' : 'Enable Apple Health'}
        </Button>

        <Button
          onClick={handleManualEntry}
          variant="ghost"
          className="w-full"
          size="lg"
          disabled={isRequesting}
        >
          Enter Manually
        </Button>
      </div>
    </div>
  )
}
