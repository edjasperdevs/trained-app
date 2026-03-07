import { getAvatarImage } from '@/assets/avatars'
import type { Archetype } from '@/design/constants'

interface RankUpShareCardProps {
  rankName: string
  totalDP: number
  streak: number
  avatarStage: 1 | 2 | 3 | 4 | 5
  archetype: Archetype
}

/**
 * Rank-up share card component for PNG capture.
 * Rendered off-screen by ShareCardWrapper, captured by html-to-image.
 * Uses inline styles for reliable capture (no Tailwind JIT classes).
 */
export function RankUpShareCard({
  rankName,
  totalDP,
  streak,
  avatarStage,
  archetype,
}: RankUpShareCardProps) {
  const avatarSrc = getAvatarImage(archetype, avatarStage)

  return (
    <div
      style={{
        width: '390px',
        height: '844px',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Chain-link crown SVG mark */}
      <div style={{ marginTop: '48px', marginBottom: '16px' }}>
        <svg
          width="64"
          height="48"
          viewBox="0 0 64 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Crown with chain-link motif */}
          <path
            d="M32 4L38 16L50 12L46 28H18L14 12L26 16L32 4Z"
            fill="#C9A84C"
            stroke="#C9A84C"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Base of crown */}
          <rect x="16" y="28" width="32" height="6" fill="#C9A84C" rx="1" />
          {/* Chain links below crown */}
          <ellipse cx="24" cy="40" rx="4" ry="3" stroke="#C9A84C" strokeWidth="2" fill="none" />
          <ellipse cx="32" cy="40" rx="4" ry="3" stroke="#C9A84C" strokeWidth="2" fill="none" />
          <ellipse cx="40" cy="40" rx="4" ry="3" stroke="#C9A84C" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* "RANK ACHIEVED" headline */}
      <p
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '8px',
        }}
      >
        RANK ACHIEVED
      </p>

      {/* Rank name - massive display */}
      <h1
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '72px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '24px',
          textShadow: '0 0 40px rgba(201, 168, 76, 0.5), 0 0 80px rgba(201, 168, 76, 0.3)',
        }}
      >
        {rankName}
      </h1>

      {/* Avatar with radial gold glow behind */}
      <div
        style={{
          position: 'relative',
          width: '280px',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
        }}
      >
        {/* Radial gold glow */}
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201, 168, 76, 0.4) 0%, rgba(201, 168, 76, 0.1) 50%, transparent 70%)',
            zIndex: 0,
          }}
        />
        {/* Avatar image */}
        <img
          src={avatarSrc}
          alt={`${archetype} avatar stage ${avatarStage}`}
          style={{
            position: 'relative',
            width: '280px',
            height: '280px',
            objectFit: 'contain',
            zIndex: 1,
          }}
        />
      </div>

      {/* Stats row - two pill-shaped badges */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Total DP pill */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#C9A84C',
            }}
          >
            TOTAL DP: {totalDP.toLocaleString()}
          </span>
        </div>

        {/* Streak pill */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#C9A84C',
            }}
          >
            STREAK: {streak} DAYS
          </span>
        </div>
      </div>

      {/* Thin horizontal gold divider */}
      <div
        style={{
          width: '200px',
          height: '1px',
          backgroundColor: '#C9A84C',
          marginBottom: '32px',
        }}
      />

      {/* Bottom section - branding */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* WELLTRAINED wordmark */}
        <p
          style={{
            fontFamily: 'Oswald, system-ui, sans-serif',
            fontSize: '20px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          WELLTRAINED
        </p>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontStyle: 'italic',
            color: '#A1A1AA',
            margin: 0,
          }}
        >
          Submit to the Gains.
        </p>

        {/* URL */}
        <p
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            color: '#71717A',
            margin: 0,
            marginTop: '4px',
          }}
        >
          welltrained.app
        </p>
      </div>
    </div>
  )
}
