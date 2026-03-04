import { cn } from '@/lib/cn';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const SIZE_MAP = {
    sm: 32,
    md: 64,
    lg: 128,
    xl: 256,
};

export function Logo({ size = 'md', className }: LogoProps) {
    const dimension = SIZE_MAP[size];

    return (
        <div
            className={cn("relative flex items-center justify-center select-none", className)}
            style={{ width: dimension, height: dimension }}
        >
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-[0_0_15px_rgba(183,255,0,0.3)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2A2A2A" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#121212" stopOpacity="0.95" />
                    </linearGradient>

                    <linearGradient id="wtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#A0A0A0" stopOpacity="0.8" />
                    </linearGradient>

                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <clipPath id="hexagonClip">
                        <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
                    </clipPath>
                </defs>

                {/* Outer Neon Border */}
                <path
                    d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                    className="stroke-[#b7ff00]"
                    strokeWidth="1.5"
                    filter="url(#neonGlow)"
                />

                {/* Inner Subtle Border */}
                <path
                    d="M50 8 L87 29 L87 71 L50 92 L13 71 L13 29 Z"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                />

                {/* Glass Hexagon Base */}
                <path
                    d="M50 6.5 L88.5 28.25 L88.5 71.75 L50 93.5 L11.5 71.75 L11.5 28.25 Z"
                    fill="url(#glassGradient)"
                    className="backdrop-blur-md"
                />

                {/* WT Monogram - Interlocked Machined Look */}
                <g className="translate-x-[2px] translate-y-[-1px]">
                    {/* W - Left Part */}
                    <path
                        d="M25 35 L33 35 L38 65 L43 35 L51 35 L43 75 L33 75 Z"
                        fill="url(#wtGradient)"
                        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                    />
                    {/* T - Right Part (Interlocked) */}
                    <path
                        d="M48 35 L75 35 L75 43 L66 43 L66 75 L56 75 L56 43 L48 43 Z"
                        fill="url(#wtGradient)"
                        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                    />

                    {/* Specular Highlights for Machined Feel */}
                    <path d="M25.5 35.5 L32.5 35.5" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
                    <path d="M48.5 35.5 L74.5 35.5" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
                    <path d="M42.5 35.5 L50.5 35.5" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
                </g>
            </svg>
        </div>
    );
}
