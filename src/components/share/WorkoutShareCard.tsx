import { getAvatarImage } from '@/assets/avatars'
import type { Archetype } from '@/design/constants'

interface WorkoutShareCardProps {
  workoutName: string
  setsCompleted: number
  topLift: string
  dpEarned: number
  rankName: string
  avatarStage: 1 | 2 | 3 | 4 | 5
  archetype: Archetype
  callsign: string
  userPhoto?: string // base64 data URL, optional
}

/**
 * Workout share card component for PNG capture.
 * Rendered off-screen by ShareCardWrapper, captured by html-to-image.
 * Uses inline styles for reliable capture (no Tailwind JIT classes).
 *
 * Full-bleed photo layout: user photo fills entire card with gradient overlays.
 * Falls back to dark background with centered avatar when no photo provided.
 */
export function WorkoutShareCard({
  workoutName: _workoutName,
  setsCompleted,
  topLift,
  dpEarned,
  rankName: _rankName,
  avatarStage,
  archetype,
  callsign,
  userPhoto,
}: WorkoutShareCardProps) {
  // workoutName and rankName are included in the interface for API consistency
  // They are used in the share text, not displayed on the card itself
  void _workoutName
  void _rankName

  const avatarSrc = getAvatarImage(archetype, avatarStage)

  return (
    <div
      style={{
        width: '390px',
        height: '844px',
        backgroundColor: '#0A0A0A',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#FFFFFF',
        overflow: 'hidden',
        borderRadius: '24px',
      }}
    >
      {/* Background layer: full-bleed photo or avatar fallback */}
      {userPhoto ? (
        <img
          src={userPhoto}
          alt="User photo"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      ) : (
        /* Avatar fallback when no photo */
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
        >
          <img
            src={avatarSrc}
            alt={`${archetype} avatar stage ${avatarStage}`}
            style={{
              width: '300px',
              height: '300px',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* Top gradient overlay for stats readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          zIndex: 1,
        }}
      />

      {/* Bottom gradient overlay for branding readability */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.80), transparent)',
          zIndex: 1,
        }}
      />

      {/* Stats row - positioned at top */}
      <div
        style={{
          position: 'absolute',
          top: '48px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0 24px',
          zIndex: 2,
        }}
      >
        {/* SETS */}
        <div style={{ textAlign: 'left' }}>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#C9A84C',
              margin: 0,
              marginBottom: '4px',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            SETS
          </p>
          <p
            style={{
              fontFamily: 'Oswald, system-ui, sans-serif',
              fontSize: '36px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {setsCompleted}
          </p>
        </div>

        {/* TOP LIFT */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#C9A84C',
              margin: 0,
              marginBottom: '4px',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            TOP LIFT
          </p>
          <p
            style={{
              fontFamily: 'Oswald, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {topLift}
          </p>
        </div>

        {/* DP EARNED */}
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#C9A84C',
              margin: 0,
              marginBottom: '4px',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            DP EARNED
          </p>
          <p
            style={{
              fontFamily: 'Oswald, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#C9A84C',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            +{dpEarned} DP
          </p>
        </div>
      </div>

      {/* Bottom left branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2,
        }}
      >
        {/* Chain crown SVG mark */}
        <svg
          width="32"
          height="24"
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
        {/* WELLTRAINED wordmark */}
        <p
          style={{
            fontFamily: 'Oswald, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#FFFFFF',
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          WELLTRAINED
        </p>
      </div>

      {/* Bottom right callsign area */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2,
        }}
      >
        {/* Avatar badge with gold glow ring */}
        <div
          style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Gold glow ring */}
          <div
            style={{
              position: 'absolute',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201, 168, 76, 0.6) 0%, rgba(201, 168, 76, 0.2) 50%, transparent 70%)',
              zIndex: 0,
            }}
          />
          {/* Dark circular background */}
          <div
            style={{
              position: 'absolute',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#0A0A0A',
              border: '2px solid #C9A84C',
              zIndex: 1,
            }}
          />
          {/* Avatar image */}
          <img
            src={avatarSrc}
            alt={`${archetype} avatar stage ${avatarStage}`}
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              objectFit: 'contain',
              zIndex: 2,
            }}
          />
        </div>
        {/* Callsign */}
        <p
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#FFFFFF',
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          @{callsign}
        </p>
      </div>

      {/* Bottom center URL */}
      <p
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '10px',
          color: '#71717A',
          margin: 0,
          zIndex: 2,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        welltrained.app
      </p>
    </div>
  )
}
