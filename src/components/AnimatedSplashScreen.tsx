import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen'
import { isNative } from '@/lib/platform'
import heroWelcomeImg from '@/assets/hero-welcome.png'

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
                        {/* Signature Hero Image Logo */}
                        <div className="w-48 h-48 mb-6 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-75" />
                            <img
                                src={heroWelcomeImg}
                                alt="WellTrained Archetypes"
                                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(200,255,0,0.4)]"
                            />
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
