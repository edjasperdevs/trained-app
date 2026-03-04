import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Loader2, Sparkles, Zap, BarChart3, ChevronRight } from 'lucide-react'
import { useSubscriptionStore, toast } from '@/stores'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { cn } from '@/lib/cn'
import { motion } from 'framer-motion'

export function Paywall() {
  const navigate = useNavigate()
  const isPremium = useSubscriptionStore((s) => s.isPremium)
  const offerings = useSubscriptionStore((s) => s.offerings)
  const purchase = useSubscriptionStore((s) => s.purchase)
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases)

  const [purchasing, setPurchasing] = useState<'monthly' | 'annual' | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)

  // Timeout for loading offerings - if they don't load in 5s, show skip option
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!offerings?.current?.monthly && !offerings?.current?.annual) {
        setLoadingTimedOut(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [offerings])

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
    { title: 'AI Protocol', desc: 'Advanced data-driven tracking', Icon: Sparkles },
    { title: 'Evolution Stages 3-5', desc: 'Unlock full geometric growth', Icon: Zap },
    { title: 'Performance Analytics', desc: 'Precision metrics and charts', Icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#b7ff00 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(183,255,0,0.1) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="pt-8 pb-4 px-6 flex items-center justify-between z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase mb-1 italic">Protocol Locked</span>
          <h1 className="text-2xl font-black text-white italic tracking-tighter" style={{ fontFamily: "'Oswald', sans-serif" }}>ELITE ACCESS</h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 bg-[#26282B]/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-white transition-all rounded-full border border-white/5"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col z-10">
        {/* Endowed Progress Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-3 italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
            YOUR PROTOCOL IS <span className="text-primary">READY</span>
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest font-bold opacity-80">
            Start your 7-Day Free Trial to unlock the full evolution and specialized training.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="flex items-center gap-4 bg-[#26282B]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 group hover:border-primary/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(183,255,0,0.1)]">
                <f.Icon size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-[11px] uppercase tracking-wider italic">{f.title}</h3>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subscription Options */}
        <div className="space-y-4 mb-6 relative">
          {/* Annual Option (Trial Highlight) */}
          {annual && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => handlePurchase(annual, 'annual')}
              disabled={purchasing !== null}
              className={cn(
                'w-full bg-[#1A1A1A] border-2 rounded-3xl p-6 text-left transition-all relative overflow-hidden group',
                purchasing === 'annual' ? 'border-primary' : 'border-primary shadow-[0_0_25px_rgba(183,255,0,0.2)]'
              )}
            >
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary text-black text-[9px] font-black italic tracking-widest uppercase rounded-bl-xl z-20">
                #1 Best Value
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-white text-2xl font-black uppercase italic tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    7-DAY FREE TRIAL
                  </h4>
                  <p className="text-primary font-mono text-xs mt-1 font-black opacity-90">
                    THEN {annual.product.priceString} / YEAR
                  </p>
                  <p className="text-muted-foreground text-[8px] uppercase tracking-widest font-black mt-2 opacity-60">
                    (Approx. {(annual.product.price / 12).toFixed(2)} {annual.product.currencyCode}/mo billed yearly)
                  </p>
                </div>
                {purchasing === 'annual' ? (
                  <Loader2 size={32} className="animate-spin text-primary" />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <ChevronRight className="text-primary" />
                  </div>
                )}
              </div>
            </motion.button>
          )}

          {/* Monthly Option */}
          {monthly && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => handlePurchase(monthly, 'monthly')}
              disabled={purchasing !== null}
              className={cn(
                'w-full bg-[#26282B]/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center transition-all',
                purchasing === 'monthly' ? 'border-primary' : 'hover:border-white/20'
              )}
            >
              {purchasing === 'monthly' ? (
                <Loader2 size={20} className="animate-spin text-primary mx-auto" />
              ) : (
                <span className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em] italic">
                  Monthly - {monthly.product.priceString} / MO
                </span>
              )}
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
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-4">
                    Please check your connection and try again later
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="text-primary text-xs font-bold uppercase tracking-wider"
                  >
                    Continue to App
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                    Loading subscription options...
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Restore Purchases */}
        <button
          onClick={handleRestore}
          disabled={restoring}
          className="mb-8 text-muted-foreground hover:text-white transition-colors text-[9px] uppercase tracking-widest font-black italic text-center w-full opacity-60 hover:opacity-100 disabled:opacity-30"
        >
          {restoring ? 'Restoring Secure Connection...' : 'Restore Access'}
        </button>

        <div className="flex-1" />

        {/* Action Link */}
        <button
          onClick={() => navigate('/')}
          className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase italic text-center w-full mb-6 opacity-40 hover:opacity-100 transition-opacity"
        >
          Skip for now
        </button>

        {/* Apple-required Legal Text */}
        <div className="space-y-3 text-[7px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed opacity-30 text-center">
          <p>Charged at confirmation. Auto-renews unless disabled 24h prior to end of period. Manage in Account Settings.</p>

          {/* Policy Links */}
          <div className="flex justify-center gap-6 pt-1">
            <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Terms of Use</button>
          </div>
        </div>
      </div>
    </div>
  )
}
