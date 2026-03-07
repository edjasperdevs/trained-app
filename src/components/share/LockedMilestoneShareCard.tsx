interface LockedMilestoneShareCardProps {
  daysLocked: number
  milestoneTitle: string // e.g., "LOCKED BY PROTOCOL." at day 30
  dpEarned: number
  callsign: string
  rankName: string
}

// Map milestone days to titles
export const MILESTONE_TITLES: Record<number, string> = {
  7: 'RESTRAINED.',
  14: 'CONTROLLED.',
  21: 'THE DISCIPLINED.',
  30: 'LOCKED BY PROTOCOL.',
  60: 'LOCKED AND BOUND.',
  90: 'LOCKED. ABSOLUTE.',
}

/**
 * Locked Protocol Milestone share card component for PNG capture.
 * Rendered off-screen by ShareCardWrapper, captured by html-to-image.
 * Uses inline styles for reliable capture (no Tailwind JIT classes).
 */
export function LockedMilestoneShareCard({
  daysLocked,
  milestoneTitle,
  dpEarned,
  callsign,
  rankName,
}: LockedMilestoneShareCardProps) {
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
        padding: '40px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header: chain crown logo left, WELLTRAINED wordmark right */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '48px',
        }}
      >
        {/* Chain-link crown SVG mark */}
        <svg
          width="40"
          height="32"
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
            letterSpacing: '0.2em',
            color: '#C9A84C',
            margin: 0,
          }}
        >
          WELLTRAINED
        </p>
      </div>

      {/* Massive serif display number */}
      <p
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '180px',
          fontWeight: 700,
          color: '#C9A84C',
          textAlign: 'center',
          margin: 0,
          lineHeight: 0.85,
          marginBottom: '8px',
        }}
      >
        {daysLocked}
      </p>

      {/* Gold label: DAYS LOCKED */}
      <p
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#C9A84C',
          textAlign: 'center',
          letterSpacing: '0.3em',
          margin: 0,
          marginBottom: '32px',
        }}
      >
        DAYS LOCKED
      </p>

      {/* Gold divider rule */}
      <div
        style={{
          width: '280px',
          height: '1px',
          backgroundColor: '#C9A84C',
          marginBottom: '32px',
        }}
      />

      {/* Milestone title in gold */}
      <h1
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '28px',
          fontWeight: 700,
          textTransform: 'uppercase',
          textAlign: 'center',
          letterSpacing: '0.1em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '12px',
        }}
      >
        {milestoneTitle}
      </h1>

      {/* Keyholder subtext */}
      <p
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: '#A1A1AA',
          textAlign: 'center',
          margin: 0,
          marginBottom: '48px',
        }}
      >
        Keyholder: WellTrained
      </p>

      {/* Bottom row: DP earned + callsign with rank */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        {/* DP earned with DP icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '16px',
              fontWeight: 600,
              color: '#C9A84C',
            }}
          >
            {dpEarned} DP EARNED
          </span>
          {/* DP icon - small circle with DP text */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid #C9A84C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '8px',
                fontWeight: 700,
                color: '#C9A84C',
              }}
            >
              DP
            </span>
          </div>
        </div>

        {/* Callsign + rank */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'Oswald, system-ui, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#FFFFFF',
              textTransform: 'uppercase',
            }}
          >
            {callsign}
          </span>
          {/* Small wings/laurel around rank */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {/* Left wing */}
            <svg width="14" height="12" viewBox="0 0 20 16" fill="none">
              <path
                d="M10 8C10 8 8 4 2 2C2 2 6 6 6 8C6 10 2 14 2 14C8 12 10 8 10 8Z"
                fill="#C9A84C"
              />
            </svg>
            <span
              style={{
                fontFamily: 'Oswald, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                color: '#C9A84C',
                textTransform: 'uppercase',
              }}
            >
              {rankName}
            </span>
            {/* Right wing */}
            <svg width="14" height="12" viewBox="0 0 20 16" fill="none">
              <path
                d="M10 8C10 8 12 4 18 2C18 2 14 6 14 8C14 10 18 14 18 14C12 12 10 8 10 8Z"
                fill="#C9A84C"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '12px',
          color: '#71717A',
          margin: 0,
          marginTop: 'auto',
        }}
      >
        welltrained.app
      </p>
    </div>
  )
}
