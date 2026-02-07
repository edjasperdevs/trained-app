import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { WeightChart, ClientMacroAdherence, ClientActivityFeed } from '@/components'
import { useAuthStore, toast } from '@/stores'
import { getSupabaseClient } from '@/lib/supabase'
import { useClientDetails } from '@/hooks/useClientDetails'
import { useClientRoster, ClientSummary } from '@/hooks/useClientRoster'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { getMockProfileByEmail, addMockClient, removeMockClient } from '@/lib/devSeed'
import { Search } from 'lucide-react'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

type ClientDetailTab = 'overview' | 'progress' | 'activity'

interface InviteRow {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
  accepted_at: string | null
}

export function Coach() {
  const user = useAuthStore((state) => state.user)
  const {
    clients,
    totalCount,
    page,
    search,
    isLoading,
    error,
    totalPages,
    setPage,
    setSearch,
    refresh,
  } = useClientRoster()

  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null)
  const [activeTab, setActiveTab] = useState<ClientDetailTab>('overview')
  const [showAddClient, setShowAddClient] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteMessage, setInviteMessage] = useState('')
  const [invites, setInvites] = useState<InviteRow[]>([])

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
    fetchInvites()
  }, [])

  useEffect(() => {
    analytics.coachDashboardViewed()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      analytics.clientViewed()
    }
  }, [selectedClient])

  const fetchInvites = async () => {
    try {
      if (devBypass) {
        setInvites([])
        return
      }

      const client = getSupabaseClient()

      const { data, error } = await client
        .from('invites')
        .select('id, email, status, created_at, expires_at, accepted_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invites:', error)
        return
      }

      // Compute display status: if status is 'pending' but expires_at is past, display as 'expired'
      const processedInvites = (data || []).map((inv) => ({
        ...inv,
        status: (inv.status === 'pending' && new Date(inv.expires_at) < new Date()
          ? 'expired'
          : inv.status) as InviteRow['status'],
      }))

      setInvites(processedInvites)
    } catch (err) {
      console.error('Error fetching invites:', err)
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
          refresh()
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
        refresh()
        fetchInvites()
      } else if (data?.action === 'invite_sent') {
        setInviteStatus('success')
        setInviteMessage('Invite sent!')
        toast.success('Invite sent!')
        setInviteEmail('')
        fetchInvites()
      } else {
        setInviteStatus('success')
        setInviteMessage('Invite sent!')
        toast.success('Invite sent!')
        setInviteEmail('')
        fetchInvites()
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
        refresh()
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
      refresh()
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

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  // Filter invites to show only non-accepted (pending + expired)
  const visibleInvites = invites.filter(inv => inv.status !== 'accepted')

  if (isLoading && clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4 animate-pulse">📋</span>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error && clients.length === 0 && !search.trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <Card className="py-0">
          <CardContent className="text-center p-4">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refresh}>Retry</Button>
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
            <p className="text-muted-foreground">{totalCount} client{totalCount !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowAddClient(true)}>
            + Invite Client
          </Button>
        </div>

        {/* Search Input */}
        {(totalCount > 0 || search.trim()) && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9"
            />
          </div>
        )}
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Quick Stats -- only show when all clients fit on one page */}
        {totalPages <= 1 && clients.length > 0 && (
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
        )}

        {/* Pending Invites */}
        {visibleInvites.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground">PENDING INVITES</h2>
              <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
                {visibleInvites.length}
              </span>
            </div>
            <div className="space-y-2" data-sentry-mask>
              {visibleInvites.map((invite) => (
                <Card key={invite.id} className="py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            invite.status === 'pending'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {invite.status === 'pending' ? 'Pending' : 'Expired'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Sent {getTimeAgo(invite.created_at)}
                          </span>
                        </div>
                      </div>
                      {invite.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleInviteClient(invite.email)}
                          disabled={inviteStatus === 'loading'}
                        >
                          Resend
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Client List */}
        {clients.length === 0 ? (
          search.trim() ? (
            <Card className="py-0">
              <CardContent className="text-center py-8">
                <span className="text-4xl block mb-4">🔍</span>
                <p className="text-muted-foreground mb-2">No clients match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try a different name or email</p>
                <Button variant="ghost" onClick={() => setSearch('')}>Clear search</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <CardContent className="text-center py-8">
                <span className="text-4xl block mb-4">👥</span>
                <p className="text-muted-foreground mb-2">No clients yet</p>
                <p className="text-sm text-muted-foreground mb-4">Invite your first client to get started</p>
                <Button onClick={() => setShowAddClient(true)}>Invite Client</Button>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="space-y-2" data-sentry-mask>
            {clients.map((client, index) => (
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
                          {client.workouts_last_7_days || 0} workouts
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
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
