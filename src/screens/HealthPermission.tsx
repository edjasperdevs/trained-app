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
    <div className="min-h-screen bg-background px-5 py-8 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Track Your Health</h1>
        <p className="text-muted-foreground">
          Connect Apple Health to automatically track your steps and sleep
        </p>
      </div>

      {/* Benefits Card */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Health Rewards
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Footprints size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Daily Steps</p>
                <p className="text-sm text-muted-foreground">10,000+ steps</p>
              </div>
              <span className="text-primary font-mono font-bold">+10 DP</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Moon size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Quality Sleep</p>
                <p className="text-sm text-muted-foreground">7+ hours</p>
              </div>
              <span className="text-primary font-mono font-bold">+10 DP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="mb-8">
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            How it works
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span>Steps sync automatically from Apple Health</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span>Sleep can be entered manually each day</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span>DP awarded once per day when thresholds are met</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacer */}
      <div className="flex-1" />

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
