/**
 * Debug Screen - For QA testing on iOS
 * Access: Tap version number in Settings 7 times
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, User, RefreshCw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RankUpModal } from '@/components/RankUpModal'
import { useUserStore, useDPStore, useSubscriptionStore } from '@/stores'
import { seedPersona, clearTestData } from '@/lib/devSeed'
import { RANKS } from '@/stores/dpStore'

type TestPersona = 'newbie' | 'veteran' | 'premium_himbo' | 'premium_brute' |
  'premium_pup' | 'premium_bull' | 'female_user' | 'metric_user' |
  'streak_master' | 'struggling'

interface PersonaInfo {
  id: TestPersona
  name: string
  description: string
  archetype: string
  isPremium: boolean
  rank: number
  streak: number
}

const PERSONAS: PersonaInfo[] = [
  { id: 'newbie', name: 'Newbie', description: 'Fresh user, minimal data', archetype: 'Bro', isPremium: false, rank: 1, streak: 2 },
  { id: 'veteran', name: 'Veteran', description: 'Long-term free user', archetype: 'Bro', isPremium: false, rank: 8, streak: 14 },
  { id: 'premium_himbo', name: 'Himbo Pro', description: 'Training focused', archetype: 'Himbo', isPremium: true, rank: 5, streak: 10 },
  { id: 'premium_brute', name: 'Brute Pro', description: 'Nutrition focused, metric', archetype: 'Brute', isPremium: true, rank: 6, streak: 7 },
  { id: 'premium_pup', name: 'Pup Pro', description: 'Lifestyle focused, metric', archetype: 'Pup', isPremium: true, rank: 4, streak: 12 },
  { id: 'premium_bull', name: 'Bull Pro', description: 'Consistency king', archetype: 'Bull', isPremium: true, rank: 7, streak: 21 },
  { id: 'female_user', name: 'Female User', description: 'Female, cutting', archetype: 'Bro', isPremium: false, rank: 3, streak: 5 },
  { id: 'metric_user', name: 'Metric User', description: 'Tests unit conversion', archetype: 'Bro', isPremium: false, rank: 4, streak: 8 },
  { id: 'streak_master', name: 'Streak Master', description: '45-day streak', archetype: 'Bro', isPremium: false, rank: 10, streak: 45 },
  { id: 'struggling', name: 'Struggling', description: 'Broken streak, paused', archetype: 'Bro', isPremium: false, rank: 2, streak: 0 },
]

export function DebugScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showRankUp, setShowRankUp] = useState(false)

  const profile = useUserStore((s) => s.profile)
  const totalDP = useDPStore((s) => s.totalDP)
  const currentRank = useDPStore((s) => s.currentRank)
  const isPremium = useSubscriptionStore((s) => s.isPremium)

  // For RankUpModal preview
  const previewRank = Math.min(currentRank + 1, 15)
  const previewRankName = RANKS[previewRank]?.name || 'Forged'

  const handleSeedPersona = async (persona: TestPersona) => {
    setLoading(persona)
    setMessage(null)

    // Small delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      seedPersona(persona)
      setMessage(`Seeded "${persona}" - Reloading...`)

      // Reload the app to pick up new data
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
    } catch (err) {
      setMessage(`Error: ${err}`)
      setLoading(null)
    }
  }

  const handleClearData = async () => {
    setLoading('clear')
    setMessage(null)

    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      clearTestData()
      setMessage('Data cleared - Reloading...')

      setTimeout(() => {
        window.location.href = '/auth'
      }, 500)
    } catch (err) {
      setMessage(`Error: ${err}`)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Debug / QA Testing</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Current State */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Current Account</CardTitle>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-mono">{profile.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Archetype</span>
                  <span className="font-mono">{profile.archetype}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rank</span>
                  <span className="font-mono">{currentRank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total DP</span>
                  <span className="font-mono">{totalDP?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-mono">{profile.currentStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Premium</span>
                  <span className={isPremium ? 'text-primary font-bold' : 'text-muted-foreground'}>
                    {isPremium ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Units</span>
                  <span className="font-mono">{profile.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-mono">{profile.goal}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No profile loaded</p>
            )}
          </CardContent>
        </Card>

        {/* UI Previews */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">UI Previews</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowRankUp(true)}
              className="w-full"
              variant="outline"
            >
              <Trophy size={16} className="mr-2" />
              Preview RankUp Modal
            </Button>
          </CardContent>
        </Card>

        {/* Message */}
        {message && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        {/* Test Personas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
              Seed Test Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handleSeedPersona(persona.id)}
                disabled={loading !== null}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {loading === persona.id ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {persona.name}
                        {persona.isPremium && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {persona.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>R{persona.rank}</div>
                    <div>{persona.streak}d streak</div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive uppercase tracking-wider">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleClearData}
              disabled={loading !== null}
            >
              {loading === 'clear' ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              Clear All Data & Sign Out
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This will delete all local data and return to login
            </p>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1 pt-4">
          <p>Debug screen for QA testing</p>
          <p>Seeding a persona will reload the app</p>
        </div>
      </div>

      {/* RankUp Modal Preview */}
      {showRankUp && (
        <RankUpModal
          oldRank={currentRank}
          newRank={previewRank}
          rankName={previewRankName}
          onClose={() => setShowRankUp(false)}
        />
      )}
    </div>
  )
}
