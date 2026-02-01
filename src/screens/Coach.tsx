import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, WeightChart, ClientMacroAdherence, ClientActivityFeed } from '@/components'
import { useAuthStore, toast } from '@/stores'
import { getSupabaseClient } from '@/lib/supabase'
import { useClientDetails } from '@/hooks/useClientDetails'

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

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      setError(null)
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

  const handleInviteClient = async () => {
    if (!inviteEmail.trim()) return

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setInviteStatus('error')
      setInviteMessage('Please enter a valid email address.')
      return
    }

    setInviteStatus('loading')
    setInviteMessage('')

    try {
      const client = getSupabaseClient()

      // Find user by email
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.toLowerCase())
        .single()

      if (profileError || !profileData) {
        setInviteStatus('error')
        setInviteMessage('User not found. They need to create an account first.')
        return
      }

      // Check if already a client
      const existing = clients.find(c => c.client_id === profileData.id)
      if (existing) {
        setInviteStatus('error')
        setInviteMessage('This user is already your client.')
        return
      }

      // Add as client
      if (!user?.id) {
        setInviteStatus('error')
        setInviteMessage('You must be logged in to add clients.')
        return
      }

      const { error: insertError } = await client
        .from('coach_clients')
        .insert({
          coach_id: user.id,
          client_id: profileData.id,
          status: 'active' as const
        })

      if (insertError) throw insertError

      setInviteStatus('success')
      setInviteMessage('Client added successfully!')
      toast.success('Client added!')
      setInviteEmail('')
      fetchClients()

      setTimeout(() => {
        setShowAddClient(false)
        setInviteStatus('idle')
        setInviteMessage('')
      }, 1500)

    } catch (err) {
      console.error('Error inviting client:', err)
      setInviteStatus('error')
      if (err instanceof Error && err.message.includes('network')) {
        setInviteMessage('Network error - check your connection.')
      } else {
        setInviteMessage('Failed to add client. Please try again.')
      }
    }
  }

  const handleRemoveClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to remove this client?')) return
    if (!user?.id) return

    try {
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
    if (!client.onboarding_complete) return 'text-gray-500'

    const daysSinceCheckIn = client.last_check_in_date
      ? Math.floor((Date.now() - new Date(client.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceCheckIn <= 1) return 'text-accent-success'
    if (daysSinceCheckIn <= 3) return 'text-accent-warning'
    return 'text-accent-danger'
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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4 animate-pulse">📋</span>
          <p className="text-gray-400">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <Card className="text-center">
          <span className="text-4xl block mb-4">⚠️</span>
          <p className="text-accent-danger mb-4">{error}</p>
          <Button onClick={fetchClients}>Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-bg-secondary pt-8 pb-6 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Coach Dashboard</h1>
            <p className="text-gray-400">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowAddClient(true)}>
            + Add Client
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold font-digital text-accent-success">
              {clients.filter(c => {
                const days = c.last_check_in_date
                  ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                return days <= 1
              }).length}
            </p>
            <p className="text-xs text-gray-500">Active Today</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold font-digital text-accent-warning">
              {clients.filter(c => {
                const days = c.last_check_in_date
                  ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                return days > 1 && days <= 3
              }).length}
            </p>
            <p className="text-xs text-gray-500">Need Check-in</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold font-digital text-accent-danger">
              {clients.filter(c => {
                const days = c.last_check_in_date
                  ? Math.floor((Date.now() - new Date(c.last_check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                return days > 3
              }).length}
            </p>
            <p className="text-xs text-gray-500">Falling Off</p>
          </Card>
        </div>

        {/* Client List */}
        {clients.length === 0 ? (
          <Card className="text-center py-8">
            <span className="text-4xl block mb-4">👥</span>
            <p className="text-gray-400 mb-2">No clients yet</p>
            <p className="text-sm text-gray-500 mb-4">Add your first client to get started</p>
            <Button onClick={() => setShowAddClient(true)}>Add Client</Button>
          </Card>
        ) : (
          <div className="space-y-2">
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
              .map((client) => (
                <motion.div
                  key={client.client_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    padding="sm"
                    className="cursor-pointer hover:bg-bg-card/80 transition-colors"
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getStatusEmoji(client)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {client.username || client.email?.split('@')[0] || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-digital ${getStatusColor(client)}`}>
                          Lvl {client.current_level || 1}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.current_streak || 0} day streak
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-bg-secondary rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-bg-secondary z-10">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedClient.username || selectedClient.email?.split('@')[0] || 'Unknown'}
                      </h2>
                      <p className="text-sm text-gray-400">{selectedClient.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Tab Navigation */}
                {selectedClient.onboarding_complete && (
                  <div className="flex border-b border-gray-800">
                    {(['overview', 'progress', 'activity'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? 'text-accent-primary border-b-2 border-accent-primary'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {!selectedClient.onboarding_complete ? (
                  <Card className="text-center py-6">
                    <span className="text-3xl block mb-2">⏳</span>
                    <p className="text-gray-400">Hasn't completed onboarding yet</p>
                  </Card>
                ) : (
                  <>
                    {/* Loading/Error state for client details */}
                    {isClientDetailsLoading && (
                      <div className="text-center py-4">
                        <span className="text-2xl animate-pulse">...</span>
                        <p className="text-sm text-gray-500 mt-1">Loading details...</p>
                      </div>
                    )}

                    {clientDetailsError && (
                      <Card className="text-center py-4">
                        <p className="text-sm text-accent-danger mb-2">{clientDetailsError}</p>
                        <Button size="sm" onClick={refreshClientDetails}>Retry</Button>
                      </Card>
                    )}

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <>
                        {/* Status */}
                        <div className="grid grid-cols-2 gap-3">
                          <Card padding="sm">
                            <p className="text-xs text-gray-500 mb-1">Level</p>
                            <p className="text-2xl font-bold font-digital text-accent-primary">
                              {selectedClient.current_level || 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedClient.total_xp?.toLocaleString() || 0} XP
                            </p>
                          </Card>
                          <Card padding="sm">
                            <p className="text-xs text-gray-500 mb-1">Streak</p>
                            <p className="text-2xl font-bold font-digital text-accent-secondary">
                              {selectedClient.current_streak || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              Best: {selectedClient.longest_streak || 0}
                            </p>
                          </Card>
                        </div>

                        {/* Activity Summary */}
                        <Card>
                          <h3 className="text-sm font-semibold text-gray-400 mb-3">ACTIVITY</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Last Check-in</span>
                              <span className={getStatusColor(selectedClient)}>
                                {selectedClient.last_check_in_date
                                  ? new Date(selectedClient.last_check_in_date).toLocaleDateString()
                                  : 'Never'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Workouts (7 days)</span>
                              <span>{selectedClient.workouts_last_7_days || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Goal</span>
                              <span className="capitalize">{selectedClient.goal || 'Not set'}</span>
                            </div>
                          </div>
                        </Card>

                        {/* Mini Weight Chart */}
                        {clientWeightData.length > 0 && (
                          <Card>
                            <h3 className="text-sm font-semibold text-gray-400 mb-3">WEIGHT TREND</h3>
                            <WeightChart data={clientWeightData} height={100} />
                            {clientWeightData.length >= 2 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Change: {' '}
                                <span className={
                                  clientWeightData[clientWeightData.length - 1].weight < clientWeightData[0].weight
                                    ? 'text-accent-success'
                                    : clientWeightData[clientWeightData.length - 1].weight > clientWeightData[0].weight
                                    ? 'text-accent-danger'
                                    : 'text-gray-400'
                                }>
                                  {(clientWeightData[clientWeightData.length - 1].weight - clientWeightData[0].weight).toFixed(1)} lbs
                                </span>
                              </p>
                            )}
                          </Card>
                        )}
                      </>
                    )}

                    {/* Progress Tab */}
                    {activeTab === 'progress' && (
                      <>
                        {/* Full Weight Chart */}
                        <Card>
                          <h3 className="text-sm font-semibold text-gray-400 mb-3">WEIGHT TREND (30 DAYS)</h3>
                          <WeightChart data={clientWeightData} height={150} />
                          {clientWeightData.length >= 2 && (
                            <p className="text-sm text-gray-400 mt-3">
                              Change: {' '}
                              <span className={`font-digital ${
                                clientWeightData[clientWeightData.length - 1].weight < clientWeightData[0].weight
                                  ? 'text-accent-success'
                                  : clientWeightData[clientWeightData.length - 1].weight > clientWeightData[0].weight
                                  ? 'text-accent-danger'
                                  : 'text-gray-400'
                              }`}>
                                {(clientWeightData[clientWeightData.length - 1].weight - clientWeightData[0].weight).toFixed(1)} lbs
                              </span>
                            </p>
                          )}
                        </Card>

                        {/* Macro Adherence */}
                        <Card>
                          <h3 className="text-sm font-semibold text-gray-400 mb-3">MACRO ADHERENCE (14 DAYS)</h3>
                          <ClientMacroAdherence data={clientMacroData} />
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
                <div className="pt-4 border-t border-gray-800">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => selectedClient.client_id && handleRemoveClient(selectedClient.client_id)}
                  >
                    Remove Client
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddClient(false)
              setInviteEmail('')
              setInviteStatus('idle')
              setInviteMessage('')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-secondary rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">Add Client</h2>
              <p className="text-sm text-gray-400 mb-4">
                Enter your client's email address. They must have an account already.
              </p>

              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 mb-4"
                autoFocus
              />

              {inviteMessage && (
                <p className={`text-sm mb-4 ${
                  inviteStatus === 'success' ? 'text-accent-success' : 'text-accent-danger'
                }`}>
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
                  fullWidth
                  onClick={handleInviteClient}
                  disabled={!inviteEmail.trim() || inviteStatus === 'loading'}
                >
                  {inviteStatus === 'loading' ? 'Adding...' : 'Add Client'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
