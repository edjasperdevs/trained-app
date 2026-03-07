import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen'
import { isNative } from '@/lib/platform'

interface AnimatedSplashScreenProps {
    onComplete: () => void
}

// Chain-link crown logo component matching v2.2 branding
function ChainLinkCrownLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            fill="none"
            className={className}
        >
            {/* Chain Link Circle */}
            <g stroke="#D4A853" strokeWidth="6" strokeLinecap="round" fill="none">
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(0 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(30 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(60 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(90 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(120 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(150 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(180 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(210 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(240 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(270 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(300 100 100)" />
                <ellipse cx="100" cy="20" rx="12" ry="8" transform="rotate(330 100 100)" />
            </g>

            {/* Crown */}
            <g fill="#D4A853" stroke="#D4A853" strokeWidth="2">
                {/* Crown base band */}
                <rect x="55" y="115" width="90" height="20" rx="3" />

                {/* Center prong (tallest) */}
                <path d="M100 50 L90 90 L100 80 L110 90 Z" />

                {/* Left prong */}
                <path d="M72 70 L62 100 L72 92 L82 100 Z" />

                {/* Right prong */}
                <path d="M128 70 L118 100 L128 92 L138 100 Z" />

                {/* Crown body connecting prongs to base */}
                <path d="M55 115 L62 100 L72 92 L82 100 L90 90 L100 80 L110 90 L118 100 L128 92 L138 100 L145 115 Z" />
            </g>
        </svg>
    )
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
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col items-center"
                    >
                        {/* Chain-Link Crown Logo */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-40 h-40 mb-8"
                        >
                            <ChainLinkCrownLogo className="w-full h-full" />
                        </motion.div>

                        {/* WELLTRAINED Wordmark */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                            className="text-5xl font-black text-[#D4A853] tracking-[0.05em] leading-none text-center"
                            style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                            WELLTRAINED
                        </motion.h1>

                        {/* FORGE YOUR LEGEND Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="text-[#8A8A8A] text-xs font-bold tracking-[0.3em] uppercase mt-4"
                        >
                            FORGE YOUR LEGEND
                        </motion.p>
                    </motion.div>

                    {/* Gold Loading Bar at bottom */}
                    <motion.div
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#3A3A3A] rounded-full overflow-hidden"
                    >
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3, duration: 1.8, ease: "easeInOut" }}
                            className="h-full bg-[#D4A853] rounded-full origin-left"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
