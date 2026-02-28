import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscriptionStore, toast } from '@/stores'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { cn } from '@/lib/cn'

export function Paywall() {
  const navigate = useNavigate()
  const isPremium = useSubscriptionStore((s) => s.isPremium)
  const offerings = useSubscriptionStore((s) => s.offerings)
  const purchase = useSubscriptionStore((s) => s.purchase)
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases)

  const [purchasing, setPurchasing] = useState<'monthly' | 'annual' | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Redirect to home if already premium
  useEffect(() => {
    if (isPremium) navigate('/')
  }, [isPremium, navigate])

  const monthly = offerings?.current?.monthly
  const annual = offerings?.current?.annual

  const handlePurchase = async (pkg: PurchasesPackage, type: 'monthly' | 'annual') => {
    setPurchasing(type)
    const { success, error } = await purchase(pkg)
    setPurchasing(null)

    if (success) {
      toast.success('Welcome to Premium!')
      navigate('/')
    } else if (error) {
      // Only show error if it's not a cancellation (cancellation returns success: false without error)
      toast.error(error)
    }
    // User cancelled - do nothing (no toast)
  }

  const handleRestore = async () => {
    setRestoring(true)
    const { success, error } = await restorePurchases()
    setRestoring(false)

    if (success) {
      toast.success('Purchases restored')
    } else if (error) {
      toast.error(error)
    }
  }

  const features = [
    'Specialized archetypes with DP modifiers',
    'Weekly Protocol Orders',
    'Avatar evolution stages 3-5',
    'Premium training programs',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 px-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unlock Premium</h1>
        <button
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="w-10 h-10 bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col">
        {/* Feature Highlights */}
        <div className="mb-8">
          <p className="text-muted-foreground text-sm mb-4">
            Take your training to the next level with Premium features:
          </p>
          <div className="space-y-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                  <Check size={14} className="text-primary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Options */}
        <div className="space-y-3 mb-6">
          {/* Annual Option */}
          {annual && (
            <button
              onClick={() => handlePurchase(annual, 'annual')}
              disabled={purchasing !== null}
              className={cn(
                'w-full bg-card border-2 rounded-xl p-4 text-left transition-all relative',
                purchasing === 'annual' ? 'border-primary' : 'border-primary/50 hover:border-primary'
              )}
            >
              <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                Best Value
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Annual</p>
                  <p className="text-muted-foreground text-sm">
                    {annual.product.priceString}/year
                  </p>
                </div>
                {purchasing === 'annual' ? (
                  <Loader2 size={24} className="animate-spin text-primary" />
                ) : (
                  <div className="text-primary font-semibold">Subscribe</div>
                )}
              </div>
            </button>
          )}

          {/* Monthly Option */}
          {monthly && (
            <button
              onClick={() => handlePurchase(monthly, 'monthly')}
              disabled={purchasing !== null}
              className={cn(
                'w-full bg-card border border-border rounded-xl p-4 text-left transition-all',
                purchasing === 'monthly' ? 'border-primary' : 'hover:border-primary/50'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Monthly</p>
                  <p className="text-muted-foreground text-sm">
                    {monthly.product.priceString}/month
                  </p>
                </div>
                {purchasing === 'monthly' ? (
                  <Loader2 size={24} className="animate-spin text-primary" />
                ) : (
                  <div className="text-muted-foreground font-semibold">Subscribe</div>
                )}
              </div>
            </button>
          )}

          {/* No offerings available */}
          {!monthly && !annual && (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                Subscription options are loading...
              </p>
            </div>
          )}
        </div>

        {/* Restore Purchases */}
        <Button
          variant="ghost"
          onClick={handleRestore}
          disabled={restoring}
          className="mb-6"
        >
          {restoring ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Restoring...
            </>
          ) : (
            'Already subscribed? Restore Purchases'
          )}
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Apple-required Legal Text */}
        <div className="space-y-3 text-xs text-muted-foreground">
          <p>
            Payment will be charged to your iTunes Account at confirmation of purchase.
          </p>
          <p>
            Subscription automatically renews unless auto-renew is turned off at least
            24-hours before the end of the current period.
          </p>
          <p>
            Account will be charged for renewal within 24-hours prior to the end of
            the current period.
          </p>
          <p>
            Subscriptions may be managed and auto-renewal may be turned off by going
            to your Account Settings after purchase.
          </p>

          {/* Policy Links */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => navigate('/privacy')}
              className="text-primary underline"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="text-primary underline"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
