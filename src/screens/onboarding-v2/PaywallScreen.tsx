import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Loader2, Sparkles, Zap, BarChart3, ChevronRight } from 'lucide-react'
import { useOnboardingStore, useSubscriptionStore, toast } from '@/stores'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { cn } from '@/lib/cn'

export function PaywallScreen() {
  const { nextStep } = useOnboardingStore()
  const isPremium = useSubscriptionStore((s) => s.isPremium)
  const offerings = useSubscriptionStore((s) => s.offerings)
  const purchase = useSubscriptionStore((s) => s.purchase)
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases)

  const [purchasing, setPurchasing] = useState<'monthly' | 'annual' | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)

  // Skip paywall if already premium (PAY-08)
  useEffect(() => {
    if (isPremium) {
      nextStep()
    }
  }, [isPremium, nextStep])

  // Timeout for loading offerings - if they don't load in 5s, show fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!offerings?.current?.monthly && !offerings?.current?.annual) {
        setLoadingTimedOut(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [offerings])

  const monthly = offerings?.current?.monthly
  const annual = offerings?.current?.annual

  const handlePurchase = async (pkg: PurchasesPackage, type: 'monthly' | 'annual') => {
    setPurchasing(type)
    const { success, error } = await purchase(pkg)
    setPurchasing(null)

    if (success) {
      toast.success('Welcome to Premium!')
      nextStep()
    } else if (error) {
      // Only show error if it's not a cancellation
      toast.error(error)
    }
    // User cancelled - do nothing (silent)
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

  // Skip paywall with reverse trial (PAY-05, PAY-06)
  const handleSkip = () => {
    // Reverse trial entitlement handled server-side by RevenueCat
    // Just proceed to final screen
    nextStep()
  }

  // Fallback button when offerings fail to load
  const handleContinueToApp = () => {
    nextStep()
  }

  const features = [
    { title: 'Premium Archetypes', desc: 'Unlock Himbo, Brute, and Pup disciplines', Icon: Sparkles },
    { title: 'Full Avatar Evolution', desc: 'All 16 ranks from Uninitiated to Master', Icon: Zap },
    { title: 'Advanced Macro Tracking', desc: 'Personalized nutrition protocols', Icon: BarChart3 },
  ]

  // Animation variants
  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
  }

  const headlineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col relative overflow-hidden">
      {/* Subtle radial gradient glow at bottom (gold tint) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(212,168,83,0.08) 0%, transparent 70%)',
        }}
      />

      {/* No header/back button - this is a decision point (PAY-07) */}

      <div className="flex-1 px-6 pb-12 flex flex-col z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
        {/* Hero section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={headlineVariants}
          className="mb-8 text-center"
        >
          <p className="text-[#D4A853] text-xs tracking-[0.2em] uppercase mb-3">
            UNLOCK YOUR POTENTIAL
          </p>
          <h1
            className="text-4xl font-black text-white uppercase tracking-tight mb-3 italic"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            YOUR PROTOCOL IS <span className="text-[#D4A853]">READY</span>
          </h1>
          <p className="text-[#A1A1AA] text-sm leading-relaxed max-w-[300px] mx-auto">
            Start your 7-day free trial to unlock the full evolution and specialized training.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-4 bg-[#26282B]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4A853]/10 flex items-center justify-center border border-[#D4A853]/20">
                <f.Icon size={18} className="text-[#D4A853]" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-[11px] uppercase tracking-wider italic">
                  {f.title}
                </h3>
                <p className="text-[9px] text-[#A1A1AA] uppercase tracking-widest font-medium">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subscription Options */}
        <div className="space-y-4 mb-6 relative">
          {/* Monthly Option - Gold border, MOST POPULAR (PAY-02) */}
          {monthly && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => handlePurchase(monthly, 'monthly')}
              disabled={purchasing !== null}
              className={cn(
                'w-full bg-[#1A1A1A] border-2 rounded-3xl p-6 text-left transition-all relative overflow-hidden',
                purchasing === 'monthly'
                  ? 'border-[#D4A853]'
                  : 'border-[#D4A853] shadow-[0_0_25px_rgba(212,168,83,0.2)]'
              )}
            >
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#D4A853] text-black text-[9px] font-black italic tracking-widest uppercase rounded-bl-xl z-20">
                MOST POPULAR
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4
                    className="text-white text-2xl font-black uppercase italic tracking-tight"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    7-DAY FREE TRIAL
                  </h4>
                  <p className="text-[#D4A853] font-mono text-xs mt-1 font-black opacity-90">
                    THEN {monthly.product.priceString} / MONTH
                  </p>
                </div>
                {purchasing === 'monthly' ? (
                  <Loader2 size={32} className="animate-spin text-[#D4A853]" />
                ) : (
                  <div className="w-12 h-12 bg-[#D4A853]/10 rounded-full flex items-center justify-center border border-[#D4A853]/20">
                    <ChevronRight className="text-[#D4A853]" />
                  </div>
                )}
              </div>
            </motion.button>
          )}

          {/* Annual Option - SAVE 50% (PAY-03) */}
          {annual && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => handlePurchase(annual, 'annual')}
              disabled={purchasing !== null}
              className={cn(
                'w-full bg-[#26282B]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-left transition-all',
                purchasing === 'annual' ? 'border-[#D4A853]' : 'hover:border-white/20'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-black text-sm uppercase tracking-wider italic">
                      Annual Plan
                    </h4>
                    <span className="px-2 py-0.5 bg-[#22C55E]/20 text-[#22C55E] text-[8px] font-black uppercase tracking-wider rounded">
                      SAVE 50%
                    </span>
                  </div>
                  <p className="text-[#A1A1AA] text-xs">
                    {annual.product.priceString} / year
                  </p>
                </div>
                {purchasing === 'annual' ? (
                  <Loader2 size={24} className="animate-spin text-[#D4A853]" />
                ) : (
                  <ChevronRight className="text-[#A1A1AA]" size={20} />
                )}
              </div>
            </motion.button>
          )}

          {/* No offerings available */}
          {!monthly && !annual && (
            <div className="bg-[#26282B]/60 border border-white/5 rounded-2xl p-8 text-center backdrop-blur-md">
              {loadingTimedOut ? (
                <>
                  <p className="text-white text-sm font-bold mb-2">
                    Subscription options unavailable
                  </p>
                  <p className="text-[#A1A1AA] text-[10px] uppercase tracking-widest font-bold mb-4">
                    Please check your connection and try again later
                  </p>
                  <button
                    onClick={handleContinueToApp}
                    className="text-[#D4A853] text-xs font-bold uppercase tracking-wider"
                  >
                    Continue to App
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-[#D4A853] mx-auto mb-3" />
                  <p className="text-[#A1A1AA] text-[10px] uppercase tracking-widest font-bold">
                    Loading subscription options...
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* START FREE TRIAL button (PAY-04) */}
        {(monthly || annual) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="mb-6"
          >
            <button
              onClick={() => monthly && handlePurchase(monthly, 'monthly')}
              disabled={purchasing !== null || !monthly}
              className={cn(
                'w-full py-4 bg-[#D4A853] text-[#0A0A0A] font-bold text-lg tracking-wider rounded-lg transition-opacity',
                (purchasing !== null || !monthly) && 'opacity-50 pointer-events-none'
              )}
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {purchasing ? (
                <Loader2 className="animate-spin mx-auto" size={24} />
              ) : (
                'START FREE TRIAL'
              )}
            </button>
          </motion.div>
        )}

        {/* Restore Purchases */}
        <motion.button
          onClick={handleRestore}
          disabled={restoring}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="mb-6 text-[#A1A1AA] hover:text-white transition-colors text-[9px] uppercase tracking-widest font-black italic text-center w-full opacity-60 hover:opacity-100 disabled:opacity-30"
        >
          {restoring ? 'Restoring...' : 'Restore Purchases'}
        </motion.button>

        <div className="flex-1" />

        {/* Continue with free access (PAY-05) */}
        <motion.button
          onClick={handleSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[10px] text-[#A1A1AA] font-black tracking-[0.2em] uppercase italic text-center w-full mb-6 opacity-40 hover:opacity-100 transition-opacity"
        >
          Continue with free access
        </motion.button>

        {/* Apple-required Legal Text */}
        <div className="space-y-3 text-[7px] text-[#A1A1AA] font-bold uppercase tracking-widest leading-relaxed opacity-30 text-center">
          <p>
            Charged at confirmation. Auto-renews unless disabled 24h prior to end of period.
            Manage in Account Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
