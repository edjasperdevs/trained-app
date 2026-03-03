/**
 * Shared animation constants and variants for Framer Motion.
 * "Dopamine Noir V2" — premium, restrained, tactile animations.
 */

// ── Spring configs ─────────────────────────────────────────────
export const springs = {
    /** Snappy interactions (buttons, toggles) */
    snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
    /** Default UI movement */
    default: { type: 'spring' as const, stiffness: 300, damping: 25 },
    /** Smooth, confident movement (page transitions) */
    smooth: { type: 'spring' as const, stiffness: 200, damping: 25 },
    /** Gentle settle (modals, overlays) */
    gentle: { type: 'spring' as const, stiffness: 150, damping: 20 },
    /** Bouncy celebration (rank ups, badges) */
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
}

// ── Durations ──────────────────────────────────────────────────
export const durations = {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    celebration: 0.8,
}

// ── Stagger delays ─────────────────────────────────────────────
export const stagger = {
    fast: 0.03,
    default: 0.05,
    slow: 0.08,
}

// ── Page transition variants ───────────────────────────────────
export const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
}

export const pageTransition = {
    ...springs.smooth,
    duration: durations.normal,
}

// ── Fade-up variants (cards, sections) ─────────────────────────
export const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
}

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
}

// ── Staggered container ────────────────────────────────────────
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: stagger.default,
        },
    },
}

export const staggerContainerFast = {
    animate: {
        transition: {
            staggerChildren: stagger.fast,
        },
    },
}

// ── Scale variants (buttons, badges) ───────────────────────────
export const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
}

export const celebrationScale = {
    initial: { opacity: 0, scale: 0.5 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: springs.bouncy,
    },
}

// ── Modal / overlay variants ───────────────────────────────────
export const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: durations.normal } },
    exit: { opacity: 0, transition: { duration: durations.fast } },
}

export const modalVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springs.gentle,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: { duration: durations.fast },
    },
}

// ── Floating DP toast ──────────────────────────────────────────
export const dpToastVariants = {
    initial: { opacity: 0, y: 10, scale: 0.8 },
    animate: {
        opacity: 1,
        y: -20,
        scale: 1,
        transition: springs.snappy,
    },
    exit: {
        opacity: 0,
        y: -40,
        transition: { duration: 0.4 },
    },
}

// ── Number count-up helper ─────────────────────────────────────
export const countUpTransition = {
    duration: 1,
    ease: [0.16, 1, 0.3, 1] as const, // custom ease-out curve
}

// ── Progress bar fill ──────────────────────────────────────────
export const progressFill = {
    initial: { scaleX: 0 },
    animate: (progress: number) => ({
        scaleX: Math.min(progress / 100, 1),
        transition: { ...springs.default, duration: 0.8 },
    }),
}

// ── Tab indicator slide ────────────────────────────────────────
export const tabIndicator = {
    layout: true,
    transition: springs.snappy,
}

// ── Confetti particle ──────────────────────────────────────────
export const confettiParticle = (index: number) => ({
    initial: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0,
    },
    animate: {
        opacity: 0,
        scale: 0,
        x: (Math.random() - 0.5) * 300,
        y: -(Math.random() * 200 + 100),
        rotate: Math.random() * 720 - 360,
        transition: {
            duration: 1 + Math.random() * 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: index * 0.02,
        },
    },
})
