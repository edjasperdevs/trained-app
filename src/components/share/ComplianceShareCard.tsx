import { getAvatarImage } from '@/assets/avatars'
import type { Archetype } from '@/design/constants'

interface ComplianceShareCardProps {
  streak: number
  totalDP: number
  rankName: string
  avatarStage: 1 | 2 | 3 | 4 | 5
  archetype: Archetype
  milestone?: string // 'FIRST WEEK COMPLETE' | '30-DAY PROTOCOL' | '100 DAYS OF DISCIPLINE'
}

/**
 * Compliance share card component for PNG capture.
 * Rendered off-screen by ShareCardWrapper, captured by html-to-image.
 * Uses inline styles for reliable capture (no Tailwind JIT classes).
 */
export function ComplianceShareCard({
  streak,
  totalDP: _totalDP,
  rankName: _rankName,
  avatarStage,
  archetype,
  milestone,
}: ComplianceShareCardProps) {
  // totalDP and rankName are included in the interface for API consistency with other share cards
  // They are used in the share text, not displayed on the card itself
  void _totalDP
  void _rankName
  const avatarSrc = getAvatarImage(archetype, avatarStage)

  const complianceItems = [
    'Training',
    'Protein Goal',
    'Meal Compliance',
    'Steps Goal',
    'Sleep Goal',
  ]

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
      <div style={{ marginTop: '40px', marginBottom: '12px' }}>
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

      {/* "FULL COMPLIANCE" headline */}
      <h1
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '38px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '8px',
        }}
      >
        FULL COMPLIANCE
      </h1>

      {/* Subheading: Day X of the Protocol */}
      <p
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '18px',
          color: '#FFFFFF',
          margin: 0,
          marginBottom: '12px',
        }}
      >
        Day <span style={{ fontWeight: 700 }}>{streak}</span> of the Protocol
      </p>

      {/* Optional milestone banner */}
      {milestone && (
        <div
          style={{
            backgroundColor: '#C9A84C',
            borderRadius: '20px',
            padding: '8px 20px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontFamily: 'Oswald, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#0A0A0A',
            }}
          >
            {milestone}
          </span>
        </div>
      )}

      {/* Avatar with radial gold glow */}
      <div
        style={{
          position: 'relative',
          width: '240px',
          height: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Radial amber glow */}
        <div
          style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201, 168, 76, 0.35) 0%, rgba(201, 168, 76, 0.1) 50%, transparent 70%)',
            zIndex: 0,
          }}
        />
        {/* Avatar image */}
        <img
          src={avatarSrc}
          alt={`${archetype} avatar stage ${avatarStage}`}
          style={{
            position: 'relative',
            width: '220px',
            height: '220px',
            objectFit: 'contain',
            zIndex: 1,
          }}
        />
      </div>

      {/* Five compliance rows */}
      <div
        style={{
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {complianceItems.map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1A1A1A',
              borderRadius: '10px',
              padding: '12px 16px',
              borderLeft: '3px solid #C9A84C',
            }}
          >
            {/* Gold checkmark icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: '12px', flexShrink: 0 }}
            >
              <circle cx="10" cy="10" r="9" fill="#C9A84C" />
              <path
                d="M6 10L9 13L14 7"
                stroke="#0A0A0A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Label text */}
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Streak display */}
      <p
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '16px',
        }}
      >
        OBEDIENCE STREAK: {streak} DAYS
      </p>

      {/* Thin horizontal gold divider */}
      <div
        style={{
          width: '200px',
          height: '1px',
          backgroundColor: '#C9A84C',
          marginBottom: '20px',
        }}
      />

      {/* Bottom section - branding */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
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
