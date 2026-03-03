import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen'
import { isNative } from '@/lib/platform'

interface AnimatedSplashScreenProps {
    onComplete: () => void
}

export function AnimatedSplashScreen({ onComplete }: AnimatedSplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        // Hide native splash screen immediately so React splash takes over smoothly
        if (isNative()) {
            CapSplashScreen.hide().catch(console.error)
        }

        const timer = setTimeout(() => {
            setIsVisible(false)
        }, 2200) // Minimum display time for branding

        return () => clearTimeout(timer)
    }, [])

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center pointer-events-none"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 15,
                            delay: 0.1
                        }}
                        className="flex flex-col items-center"
                    >
                        {/* Signature Avatar Logo */}
                        <div className="w-28 h-28 mb-8">
                            <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(200,255,0,0.35)]">
                                <ellipse cx="100" cy="296" rx="52" ry="9" fill="#C8FF00" fillOpacity="0.25" />
                                <path d="M78 220 L68 295 L80 295 L92 245 L92 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="1" />
                                <path d="M122 220 L132 295 L120 295 L108 245 L108 220Z" fill="#26282B" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="1" />
                                <rect x="66" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.8" />
                                <rect x="118" y="292" width="16" height="5" rx="2" fill="#C8FF00" fillOpacity="0.8" />
                                <path d="M72 140 L68 220 L132 220 L128 140 L120 130 L80 130Z" fill="#26282B" stroke="#1A1A1A" strokeWidth="3" />
                                <path d="M72 140 L48 195 L58 200 L80 155 L80 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="1" />
                                <path d="M128 140 L152 195 L142 200 L120 155 L120 135Z" fill="#26282B" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="1" />
                                <rect x="91" y="108" width="18" height="24" rx="4" fill="#26282B" />
                                <ellipse cx="100" cy="96" rx="22" ry="26" fill="#26282B" stroke="#C8FF00" strokeWidth="2.5" strokeOpacity="1" />
                                <path d="M82 84 Q100 68 118 84" stroke="#C8FF00" strokeWidth="3" strokeOpacity="0.9" />
                            </svg>
                        </div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                            className="text-5xl font-black text-[#FAFAFA] tracking-[0.05em] leading-none text-center"
                            style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                            WELLTRAINED
                        </motion.h1>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.7, duration: 0.8, ease: "circOut" }}
                            className="h-1 bg-[#C8FF00] mt-6 mx-auto rounded-full w-40 shadow-[0_0_10px_rgba(200,255,0,0.5)]"
                        />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="text-[#A1A1AA] text-xs font-bold tracking-[0.3em] uppercase mt-6"
                        >
                            Enter The Protocol
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
