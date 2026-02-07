import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { WeightChart, ClientMacroAdherence, ClientActivityFeed } from '@/components'
import { useAuthStore, toast } from '@/stores'
import { getSupabaseClient } from '@/lib/supabase'
import { useClientDetails } from '@/hooks/useClientDetails'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { getMockClients, getMockProfileByEmail, addMockClient, removeMockClient } from '@/lib/devSeed'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

type ClientDetailTab = 'overview' | 'progress' | 'activity'

interface ClientSummary {
  client_id: string | null
  status: 'pending' | 'active' | 'inactive' | null
  username: string | null
  email: string | null
  current_streak: number | null
  longest_streak: number | null
  last_check_in_date: string | null
  goal: string | null
  onboarding_complete: boolean | null
  current_level: number | null
  total_xp: number | null
  latest_weight: number | null
  latest_weight_date: string | null
  workouts_last_7_days: number | null
}

export function Coach() {
  const user = useAuthStore((state) => state.user)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null)
  const [activeTab, setActiveTab] = useState<ClientDetailTab>('overview')
  const [showAddClient, setShowAddClient] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteMessage, setInviteMessage] = useState('')

  const {
    weightData: clientWeightData,
    macroData: clientMacroData,
    activityData: clientActivityData,
    isLoading: isClientDetailsLoading,
    error: clientDetailsError,
    refresh: refreshClientDetails
  } = useClientDetails(selectedClient?.client_id || null)

  // Reset tab when selecting a new client
  useEffect(() => {
    if (selectedClient) {
      setActiveTab('overview')
    }
  }, [selectedClient?.client_id])

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    analytics.coachDashboardViewed()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      analytics.clientViewed()
    }
  }, [selectedClient])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (devBypass) {
        setClients(getMockClients())
        return
      }

      const client = getSupabaseClient()

      const { data, error } = await client
        .from('coach_client_summary')
        .select('*')

      if (error) throw error

      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      if (err instanceof Error && err.message.includes('network')) {
        setError('Network error - check your connection')
        toast.error('Unable to load clients - check your internet')
      } else {
        setError('Failed to load clients')
        toast.error('Failed to load clients')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteClient = async (emailOverride?: string) => {
    const emailToSend = emailOverride || inviteEmail
    if (!emailToSend.trim()) return

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailToSend)) {
      setInviteStatus('error')
      setInviteMessage('Please enter a valid email address.')
      return
    }

    setInviteStatus('loading')
    setInviteMessage('')

    try {
      if (devBypass) {
        // Mock Edge Function response for dev bypass
        await new Promise(r => setTimeout(r, 500))

        const profile = getMockProfileByEmail(emailToSend.toLowerCase())
        if (profile) {
          // Simulate 'added_directly' -- existing user
          const existing = clients.find(c => c.client_id === profile.id)
          if (existing) {
            setInviteStatus('error')
            setInviteMessage('This user is already your client.')
            return
          }

          const added = addMockClient(profile.id)
          if (!added) {
            setInviteStatus('error')
            setInviteMessage('Failed to send invite.')
            return
          }

          setInviteStatus('success')
          setInviteMessage('User already had an account -- added as client!')
          toast.success('Client added!')
          setInviteEmail('')
          fetchClients()
        } else {
          // Simulate 'invite_sent' -- new user
          setInviteStatus('success')
          setInviteMessage('Invite sent!')
          toast.success('Invite sent!')
          setInviteEmail('')
        }

        setTimeout(() => {
          setShowAddClient(false)
          setInviteStatus('idle')
          setInviteMessage('')
        }, 1500)
        return
      }

      const client = getSupabaseClient()

      const { data, error } = await client.functions.invoke('send-invite', {
        body: { email: emailToSend.toLowerCase() },
      })

      if (error) {
        // Edge Function network/relay error
        setInviteStatus('error')
        if (error.message?.includes('FunctionsRelayError') || error.message?.includes('non-2xx')) {
          setInviteMessage('Invite service is unavailable. Please try again later.')
        } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          setInviteMessage('Network error - check your connection.')
        } else {
          setInviteMessage(error.message || 'Failed to send invite. Please try again.')
        }
        return
      }

      // Parse Edge Function response
      if (data?.error) {
        setInviteStatus('error')
        setInviteMessage(data.error)
        return
      }

      if (data?.action === 'added_directly') {
        setInviteStatus('success')
        setInviteMessage('User already had an account -- added as client!')
        toast.success('Client added!')
        setInviteEmail('')
        fetchClients()
      } else if (data?.action === 'invite_sent') {
        setInviteStatus('success')
        setInviteMessage('Invite sent!')
        toast.success('Invite sent!')
        setInviteEmail('')
      } else {
        setInviteStatus('success')
        setInviteMessage('Invite sent!')
        toast.success('Invite sent!')
        setInviteEmail('')
      }

      setTimeout(() => {
        setShowAddClient(false)
        setInviteStatus('idle')
        setInviteMessage('')
      }, 1500)

    } catch (err) {
      console.error('Error sending invite:', err)
      setInviteStatus('error')
      if (err instanceof Error && err.message.includes('network')) {
        setInviteMessage('Network error - check your connection.')
      } else {
        setInviteMessage('Failed to send invite. Please try again.')
      }
    }
  }

  const handleRemoveClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to remove this client?')) return

    try {
      if (devBypass) {
        removeMockClient(clientId)
        toast.success('Client removed')
        setSelectedClient(null)
        fetchClients()
        return
      }

      if (!user?.id) return
      const client = getSupabaseClient()

      const { error } = await client
        .from('coach_clients')
        .delete()
        .eq('coach_id', user.id)
        .eq('client_id', clientId)

      if (error) throw error

      toast.success('Client removed')
      setSelectedClient(null)
      fetchClients()
    } catch (err) {
      console.error('Error removing client:', err)
      if (err instanceof Error && err.message.includes('network')) {
        toast.error('Network error - check your connection')
      } else {
        toast.error('Failed to remove client')
      }
    }
  }

  const getStatusColor = (client: ClientSummary) => {
    if (!client.onboarding_complete) return 'text-muted-foreground'

    const daysSinceCheckIn = client.last_check_in_date
      ? Math.floor((Date.now() - new Date(client.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceCheckIn <= 1) return 'text-success'
    if (daysSinceCheckIn <= 3) return 'text-warning'
    return 'text-destructive'
  }

  const getStatusEmoji = (client: ClientSummary) => {
    if (!client.onboarding_complete) return '⏳'

    const daysSinceCheckIn = client.last_check_in_date
      ? Math.floor((Date.now() - new Date(client.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceCheckIn <= 1) return '🟢'
    if (daysSinceCheckIn <= 3) return '🟡'
    return '🔴'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4 animate-pulse">📋</span>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <Card className="py-0">
          <CardContent className="text-center p-4">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchClients}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card pt-8 pb-6 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Coach Dashboard</h1>
            <p className="text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowAddClient(true)}>
            + Invite Client
          </Button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="py-0 text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold font-digital text-success">
                {clients.filter(c => {
                  const days = c.last_check_in_date
                    ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                    : 999
                  return days <= 1
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Active Today</p>
            </CardContent>
          </Card>
          <Card className="py-0 text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold font-digital text-warning">
                {clients.filter(c => {
                  const days = c.last_check_in_date
                    ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                    : 999
                  return days > 1 && days <= 3
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Need Check-in</p>
            </CardContent>
          </Card>
          <Card className="py-0 text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold font-digital text-destructive">
                {clients.filter(c => {
                  const days = c.last_check_in_date
                    ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                    : 999
                  return days > 3
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Falling Off</p>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        {clients.length === 0 ? (
          <Card className="py-0">
            <CardContent className="text-center py-8">
              <span className="text-4xl block mb-4">👥</span>
              <p className="text-muted-foreground mb-2">No clients yet</p>
              <p className="text-sm text-muted-foreground mb-4">Invite your first client to get started</p>
              <Button onClick={() => setShowAddClient(true)}>Invite Client</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2" data-sentry-mask>
            {clients
              .sort((a, b) => {
                // Sort by needs attention first
                const aDays = a.last_check_in_date
                  ? Math.floor((Date.now() - new Date(a.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                const bDays = b.last_check_in_date
                  ? Math.floor((Date.now() - new Date(b.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                return bDays - aDays
              })
              .map((client, index) => (
                <div
                  key={client.client_id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card
                    className="py-0 cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getStatusEmoji(client)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {client.username || client.email?.split('@')[0] || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-digital ${getStatusColor(client)}`}>
                            Lvl {client.current_level || 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.current_streak || 0} day streak
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200"
          onClick={() => setSelectedClient(null)}
        >
          <div
            className="bg-card rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] overflow-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedClient.username || selectedClient.email?.split('@')[0] || 'Unknown'}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-muted-foreground hover:text-foreground text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              {selectedClient.onboarding_complete && (
                <div className="flex border-b border-border">
                  {(['overview', 'progress', 'activity'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'flex-1 py-3 text-sm font-medium transition-colors',
                        activeTab === tab
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4" data-sentry-mask>
              {!selectedClient.onboarding_complete ? (
                <Card className="py-0">
                  <CardContent className="text-center py-6">
                    <span className="text-3xl block mb-2">⏳</span>
                    <p className="text-muted-foreground">Hasn't completed onboarding yet</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Loading/Error state for client details */}
                  {isClientDetailsLoading && (
                    <div className="text-center py-4">
                      <span className="text-2xl animate-pulse">...</span>
                      <p className="text-sm text-muted-foreground mt-1">Loading details...</p>
                    </div>
                  )}

                  {clientDetailsError && (
                    <Card className="py-0">
                      <CardContent className="text-center py-4">
                        <p className="text-sm text-destructive mb-2">{clientDetailsError}</p>
                        <Button size="sm" onClick={refreshClientDetails}>Retry</Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
                      {/* Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="py-0">
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Level</p>
                            <p className="text-2xl font-bold font-digital text-primary">
                              {selectedClient.current_level || 1}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedClient.total_xp?.toLocaleString() || 0} XP
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="py-0">
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Streak</p>
                            <p className="text-2xl font-bold font-digital text-secondary">
                              {selectedClient.current_streak || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Best: {selectedClient.longest_streak || 0}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Activity Summary */}
                      <Card className="py-0">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">ACTIVITY</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Check-in</span>
                              <span className={getStatusColor(selectedClient)}>
                                {selectedClient.last_check_in_date
                                  ? new Date(selectedClient.last_check_in_date).toLocaleDateString()
                                  : 'Never'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Workouts (7 days)</span>
                              <span>{selectedClient.workouts_last_7_days || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Goal</span>
                              <span className="capitalize">{selectedClient.goal || 'Not set'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Mini Weight Chart */}
                      {clientWeightData.length > 0 && (
                        <Card className="py-0">
                          <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">WEIGHT TREND</h3>
                            <WeightChart data={clientWeightData} height={100} />
                            {clientWeightData.length >= 2 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Change: {' '}
                                <span className={
                                  clientWeightData[clientWeightData.length - 1].weight < clientWeightData[0].weight
                                    ? 'text-success'
                                    : clientWeightData[clientWeightData.length - 1].weight > clientWeightData[0].weight
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                                }>
                                  {(clientWeightData[clientWeightData.length - 1].weight - clientWeightData[0].weight).toFixed(1)} lbs
                                </span>
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Progress Tab */}
                  {activeTab === 'progress' && (
                    <>
                      {/* Full Weight Chart */}
                      <Card className="py-0">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">WEIGHT TREND (30 DAYS)</h3>
                          <WeightChart data={clientWeightData} height={150} />
                          {clientWeightData.length >= 2 && (
                            <p className="text-sm text-muted-foreground mt-3">
                              Change: {' '}
                              <span className={cn(
                                'font-digital',
                                clientWeightData[clientWeightData.length - 1].weight < clientWeightData[0].weight
                                  ? 'text-success'
                                  : clientWeightData[clientWeightData.length - 1].weight > clientWeightData[0].weight
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                              )}>
                                {(clientWeightData[clientWeightData.length - 1].weight - clientWeightData[0].weight).toFixed(1)} lbs
                              </span>
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Macro Adherence */}
                      <Card className="py-0">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">MACRO ADHERENCE (14 DAYS)</h3>
                          <ClientMacroAdherence data={clientMacroData} />
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <ClientActivityFeed activities={clientActivityData} />
                  )}
                </>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => selectedClient.client_id && handleRemoveClient(selectedClient.client_id)}
                >
                  Remove Client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowAddClient(false)
            setInviteEmail('')
            setInviteStatus('idle')
            setInviteMessage('')
          }}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Invite Client</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your client's email address to send them a signup invite.
            </p>

            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="client@example.com"
              className="mb-4"
              autoFocus
            />

            {inviteMessage && (
              <p className={cn(
                'text-sm mb-4',
                inviteStatus === 'success' ? 'text-success' : 'text-destructive'
              )}>
                {inviteMessage}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddClient(false)
                  setInviteEmail('')
                  setInviteStatus('idle')
                  setInviteMessage('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleInviteClient()}
                disabled={!inviteEmail.trim() || inviteStatus === 'loading'}
              >
                {inviteStatus === 'loading' ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
