import { getAvatarImage } from '@/assets/avatars'
import type { Archetype } from '@/design/constants'

interface WeeklyReportShareCardProps {
  dpEarned: number
  compliancePercentage: number
  streak: number
  workoutsCompleted: number
  rankName: string
  progress: number // 0-1 for rank progress bar
  callsign: string // User's username/callsign for personalization
  avatarStage: 1 | 2 | 3 | 4 | 5
  archetype: Archetype
}

/**
 * Weekly report share card component for PNG capture.
 * Rendered off-screen by ShareCardWrapper, captured by html-to-image.
 * Uses inline styles for reliable capture (no Tailwind JIT classes).
 */
export function WeeklyReportShareCard({
  dpEarned,
  compliancePercentage,
  streak,
  workoutsCompleted,
  rankName,
  progress,
  callsign,
  avatarStage,
  archetype,
}: WeeklyReportShareCardProps) {
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
        padding: '48px 24px',
      }}
    >
      {/* Header - Chain-link crown SVG mark */}
      <div style={{ marginBottom: '16px' }}>
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

      {/* "WEEKLY PROTOCOL REPORT" headline */}
      <p
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '32px',
        }}
      >
        WEEKLY PROTOCOL REPORT
      </p>

      {/* Week Stats Grid - 2x2 gold-bordered cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: '100%',
          maxWidth: '342px',
          marginBottom: '32px',
        }}
      >
        {/* Top-left: DP earned */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '36px',
              fontWeight: 700,
              color: '#C9A84C',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            +{dpEarned}
          </p>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#71717A',
              margin: 0,
            }}
          >
            DP EARNED
          </p>
        </div>

        {/* Top-right: Compliance */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '36px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            {Math.round(compliancePercentage)}%
          </p>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#71717A',
              margin: 0,
            }}
          >
            COMPLIANCE
          </p>
        </div>

        {/* Bottom-left: Streak */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '36px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            {streak}
          </p>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#71717A',
              margin: 0,
            }}
          >
            DAY STREAK
          </p>
        </div>

        {/* Bottom-right: Workouts */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A84C',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '36px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            {workoutsCompleted}
          </p>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#71717A',
              margin: 0,
            }}
          >
            WORKOUTS
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <div
        style={{
          position: 'relative',
          width: '150px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
        }}
      >
        {/* Radial gold glow behind avatar */}
        <div
          style={{
            position: 'absolute',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201, 168, 76, 0.3) 0%, rgba(201, 168, 76, 0.1) 50%, transparent 70%)',
            zIndex: 0,
          }}
        />
        {/* Avatar image */}
        <img
          src={avatarSrc}
          alt={`${archetype} avatar`}
          style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            objectFit: 'contain',
            zIndex: 1,
          }}
        />
      </div>

      {/* Callsign below avatar */}
      <p
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '32px',
        }}
      >
        {callsign}
      </p>

      {/* Rank Progress Section */}
      <div
        style={{
          width: '100%',
          maxWidth: '342px',
          marginBottom: '40px',
        }}
      >
        {/* Current rank name */}
        <p
          style={{
            fontFamily: 'Oswald, system-ui, sans-serif',
            fontSize: '32px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#C9A84C',
            margin: 0,
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {rankName}
        </p>

        {/* Thin gold progress bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#1A1A1A',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(to right, #C9A84C, #D4A853)',
            }}
          />
        </div>

        {/* Progress percentage text */}
        <p
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            color: '#71717A',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {Math.round(progress * 100)}% to next rank
        </p>
      </div>

      {/* Branding Footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginTop: 'auto',
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
