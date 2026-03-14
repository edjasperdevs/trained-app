import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen'
import { isNative } from '@/lib/platform'

interface AnimatedSplashScreenProps {
    onComplete: () => void
}

// Animated Beveled WT Logo component with lock animation
function WTLogo({ className, isGold }: { className?: string; isGold: boolean }) {
    const [animationState, setAnimationState] = useState<"unlocked" | "locked" | "jiggle">("unlocked")

    // Shackle (top lock part) animation - slides down, jiggles, then turns gold
    const shackleVariants = {
        unlocked: {
            y: -80,
        },
        locked: {
            y: 0,
            transition: {
                y: {
                    duration: 0.5,
                    ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
                },
            }
        },
        jiggle: {
            y: [0, -8, 0, -4, 0, -2, 0],
            rotate: [0, -1, 1, -0.5, 0.5, 0],
            transition: {
                duration: 0.5,
                ease: "easeOut" as const,
            }
        },
    }

    // Color definitions
    const grayColors = {
        main: "#A0A0A2",
        cls1: "#78797b",
        cls2: "#616163",
    }

    const goldColors = {
        main: "#D4A853",
        cls1: "#B8943F",
        cls2: "#8B6F2F",
    }

    const colors = isGold ? goldColors : grayColors

    useEffect(() => {
        // Start lock animation after a brief delay
        const lockTimer = setTimeout(() => {
            setAnimationState("locked")
        }, 300)

        // Trigger jiggle after lock completes
        const jiggleTimer = setTimeout(() => {
            setAnimationState("jiggle")
        }, 850)

        return () => {
            clearTimeout(lockTimer)
            clearTimeout(jiggleTimer)
        }
    }, [])

    const colorTransition = { duration: 1.2, ease: "easeInOut" as const }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 786 1017.92"
            className={className}
        >
            {/* Body (bottom lock part) - with color transition */}
            <g>
                <motion.path
                    animate={{ fill: colors.main }}
                    transition={colorTransition}
                    d="M610.71,528.11v211.41l-135.06,110.71v-278.99l230.15-151.36H80.2s230.15,151.36,230.15,151.36v278.99l-135.06-110.71v-211.41L10,418.93v320.59s9.65,54.23,82.65,131.2c13.87,14.63,69.8,60.91,109.15,83.5,60.67,34.81,108.55,45.2,108.55,45.2,0,0,39.93,8.5,82.65,8.5,50.55,0,82.65-8.5,82.65-8.5,0,0,47.88-10.39,108.55-45.2,39.35-22.58,95.28-68.87,109.15-83.5,73-76.98,82.65-131.2,82.65-131.2v-320.59l-165.3,109.18Z"
                />
                {/* Body bevel highlights */}
                <motion.polygon animate={{ fill: colors.cls1 }} transition={colorTransition} points="10 418.93 0 400.34 185.3 522.74 175.3 528.11 10 418.93"/>
                <motion.polyline animate={{ fill: colors.cls2 }} transition={colorTransition} points=".37 404.42 0 740.4 10 739.52 10 418.93 0 400.34"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="175.3 739.52 185.3 734.79 185.3 522.74 175.3 528.11 175.3 739.52"/>
                <motion.polygon animate={{ fill: colors.cls1 }} transition={colorTransition} points="310.35 850.23 175.3 739.52 185.3 734.79 300.35 829.1 310.35 850.23"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="310.35 571.24 300.35 576.63 300.35 829.1 310.35 850.23 310.35 571.24"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="46.8 409.88 82.65 421.49 310.35 571.24 300.35 576.63 46.8 409.88"/>
                <motion.polygon animate={{ fill: colors.cls1 }} transition={colorTransition} points="705.8 419.88 739.2 409.88 46.8 409.88 82.65 421.49 705.8 419.88"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="475.65 571.24 485.65 576.64 739.2 409.88 705.8 419.88 475.65 571.24"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="475.65 850.23 485.65 829.1 485.65 576.64 475.65 571.24 475.65 850.23"/>
                <motion.polygon animate={{ fill: colors.cls1 }} transition={colorTransition} points="610.71 739.52 600.71 734.79 485.65 829.1 475.65 850.23 610.71 739.52"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="600.71 522.74 610.71 528.11 610.71 739.52 600.71 734.79 600.71 522.74"/>
                <motion.polygon animate={{ fill: colors.cls1 }} transition={colorTransition} points="776 418.93 786 400.34 600.71 522.74 610.71 528.11 776 418.93"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="776 739.52 786 740.4 786 400.34 776 418.93 776 739.52"/>
                <g>
                    <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="310.35 571.24 82.65 421.49 82.65 421.49 310.35 571.24"/>
                    <motion.path animate={{ fill: colors.cls2 }} transition={colorTransition} d="M693.35,870.72c-13.87,14.63-69.8,60.91-109.15,83.5-60.67,34.81-108.55,45.2-108.55,45.2,0,0-32.1,8.5-82.65,8.5-42.72,0-82.65-8.5-82.65-8.5,0,0-47.88-10.39-108.55-45.2-39.35-22.58-95.28-68.87-109.15-83.5C19.65,793.75,10,739.52,10,739.52l-10,.88.15.87c.42,2.33,11.03,58.08,85.24,136.33,13.57,14.31,69.73,61.36,111.43,85.29,61.3,35.17,109.39,45.87,111.44,46.31,1.67.36,41.45,8.72,84.73,8.72,49.63,0,81.75-7.94,84.98-8.78,4.04-.9,51.31-11.9,111.19-46.26,41.7-23.93,97.87-70.98,111.43-85.29,74.21-78.25,84.82-134,85.24-136.33l.15-.87-10-.88s-9.65,54.23-82.65,131.2Z"/>
                    <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="0 400.34 0 740.4 .37 404.42 0 400.34"/>
                </g>
            </g>

            {/* Shackle (top lock part) - animated position and color */}
            <motion.g
                variants={shackleVariants}
                initial="unlocked"
                animate={animationState}
                style={{ originX: 0.5, originY: 1 }}
            >
                {/* Main shackle shape */}
                <motion.path animate={{ fill: colors.main }} transition={colorTransition} d="M393,10c-100.12,0-215.84,19.41-300.35,37.69v330.36h156.14v-204.01c45.13-9.53,89.62-10.72,138.34-10.72s92.55-1.94,150.08,10.72v204.01h156.14V47.69c-99.36-22.84-200.24-37.69-300.35-37.69Z"/>
                {/* Shackle bevel highlights */}
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="92.65 378.05 82.65 388.05 258.79 388.05 248.79 378.05 92.65 378.05"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="82.65 39.62 92.65 47.69 92.65 378.05 82.65 388.05 82.65 39.62"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="258.79 388.05 248.79 378.05 248.79 174.04 258.79 182.24 258.79 388.05"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="527.21 182.15 537.21 174.04 537.21 378.05 527.21 388.05 527.21 182.15"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="703.35 388.05 693.35 378.05 537.21 378.05 527.21 388.05 703.35 388.05"/>
                <motion.polygon animate={{ fill: colors.cls2 }} transition={colorTransition} points="703.35 39.73 693.35 47.69 693.35 378.05 703.35 388.05 703.35 39.73"/>
                <motion.path animate={{ fill: colors.cls1 }} transition={colorTransition} d="M393,10c100.12,0,201,14.85,300.35,37.69l10-7.96-7.76-1.78C584.54,12.41,485.56,0,393,0c-110.6,0-236.98,23.75-302.47,37.91l-7.89,1.71,10,8.07C177.16,29.41,292.88,10,393,10Z"/>
                <motion.path animate={{ fill: colors.cls2 }} transition={colorTransition} d="M537.21,174.04c-57.53-12.66-99.83-10.72-150.08-10.72s-93.21,1.19-138.34,10.72l10,8.2c43.34-8.2,87.09-8.92,128.34-8.92,5.98,0,11.85-.03,17.65-.05,5.62-.03,11.18-.05,16.7-.05,32.43,0,65,.72,105.74,8.94l10-8.11Z"/>
            </motion.g>
        </svg>
    )
}

// Metallic gold gradient style
const metallicGoldStyle = {
    background: 'linear-gradient(180deg, #F5D998 0%, #D4A853 25%, #B8943F 50%, #D4A853 75%, #F5D998 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
}

export function AnimatedSplashScreen({ onComplete }: AnimatedSplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true)
    const [isGold, setIsGold] = useState(false)

    useEffect(() => {
        // Hide native splash screen immediately so React splash takes over smoothly
        if (isNative()) {
            CapSplashScreen.hide().catch(console.error)
        }

        // Transition to gold after jiggle completes
        const goldTimer = setTimeout(() => {
            setIsGold(true)
        }, 1400)

        const timer = setTimeout(() => {
            setIsVisible(false)
        }, 3200) // Display time for branding (extra time for gradual gold transition)

        return () => {
            clearTimeout(goldTimer)
            clearTimeout(timer)
        }
    }, [])

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center pointer-events-none"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center"
                    >
                        {/* WT Logo */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="w-32 h-auto mb-6"
                        >
                            <WTLogo className="w-full h-full drop-shadow-2xl" isGold={isGold} />
                        </motion.div>

                        {/* WELLTRAINED Wordmark - with metallic gold effect */}
                        <motion.h1
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="text-4xl font-black tracking-[0.15em] leading-none text-center transition-all duration-1000 ease-in-out"
                            style={{
                                fontFamily: "'Oswald', sans-serif",
                                ...(isGold ? metallicGoldStyle : { color: 'white' }),
                            }}
                        >
                            WELLTRAINED
                        </motion.h1>

                        {/* SUBMIT TO THE GAINS Tagline - with metallic gold effect */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-[10px] font-semibold tracking-[0.35em] uppercase mt-3 transition-all duration-1000 ease-in-out"
                            style={isGold ? metallicGoldStyle : { color: '#6A6A6A' }}
                        >
                            SUBMIT TO THE GAINS
                        </motion.p>
                    </motion.div>

                    {/* Loading indicator at bottom - turns gold */}
                    <motion.div
                        className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-[#2A2A2A] rounded-full overflow-hidden"
                    >
                        <motion.div
                            initial={{ scaleX: 0, backgroundColor: "#6A6A6A" }}
                            animate={{ scaleX: 1, backgroundColor: "#D4A853" }}
                            transition={{
                                scaleX: { delay: 0.4, duration: 2.0, ease: "easeInOut" },
                                backgroundColor: { delay: 1.4, duration: 1.2, ease: "easeInOut" }
                            }}
                            className="h-full rounded-full origin-left"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
