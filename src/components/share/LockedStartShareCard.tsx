interface LockedStartShareCardProps {
  callsign: string
  rankName: string
  goalDays: number
  startDate: string // formatted date string like "MAR 7"
}

/**
 * Locked Protocol Initiated share card component for PNG capture.
 * Rendered off-screen by ShareCardWrapper, captured by html-to-image.
 * Uses inline styles for reliable capture (no Tailwind JIT classes).
 */
export function LockedStartShareCard({
  callsign,
  rankName,
  goalDays,
  startDate,
}: LockedStartShareCardProps) {
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

      {/* Large geometric padlock icon centered */}
      <div style={{ marginBottom: '40px' }}>
        <svg
          width="120"
          height="150"
          viewBox="0 0 64 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lock shackle */}
          <path
            d="M16 28V20C16 11.16 23.16 4 32 4C40.84 4 48 11.16 48 20V28"
            stroke="#C9A84C"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Lock body with geometric pattern */}
          <rect
            x="8"
            y="28"
            width="48"
            height="44"
            rx="6"
            fill="#C9A84C"
          />
          {/* Geometric pattern on lock body */}
          <path
            d="M20 36L32 48L44 36"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M20 56L32 44L44 56"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="12" y1="46" x2="52" y2="46" stroke="#0A0A0A" strokeWidth="1" />
          {/* Keyhole */}
          <circle cx="32" cy="52" r="5" fill="#0A0A0A" />
          <rect x="30" y="52" width="4" height="10" rx="1" fill="#0A0A0A" />
        </svg>
      </div>

      {/* Bold serif headline */}
      <h1
        style={{
          fontFamily: 'Oswald, system-ui, sans-serif',
          fontSize: '32px',
          fontWeight: 700,
          textTransform: 'uppercase',
          textAlign: 'center',
          letterSpacing: '0.1em',
          color: '#C9A84C',
          margin: 0,
          marginBottom: '32px',
          lineHeight: 1.2,
        }}
      >
        LOCKED PROTOCOL<br />INITIATED.
      </h1>

      {/* Gold divider rule */}
      <div
        style={{
          width: '280px',
          height: '1px',
          backgroundColor: '#C9A84C',
          marginBottom: '32px',
        }}
      />

      {/* Data lines */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '48px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: '#A1A1AA',
            }}
          >
            KEYHOLDER:{' '}
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>WELLTRAINED</span>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: '#A1A1AA',
            }}
          >
            GOAL:{' '}
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{goalDays} DAYS</span>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: '#A1A1AA',
            }}
          >
            STARTED:{' '}
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{startDate}</span>
          </span>
        </div>
      </div>

      {/* User callsign + rank badge row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
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
        {/* Small wings/laurel around rank badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {/* Left wing */}
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <path
              d="M10 8C10 8 8 4 2 2C2 2 6 6 6 8C6 10 2 14 2 14C8 12 10 8 10 8Z"
              fill="#C9A84C"
            />
          </svg>
          <span
            style={{
              fontFamily: 'Oswald, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: '#C9A84C',
              textTransform: 'uppercase',
            }}
          >
            {rankName}
          </span>
          {/* Right wing */}
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <path
              d="M10 8C10 8 12 4 18 2C18 2 14 6 14 8C14 10 18 14 18 14C12 12 10 8 10 8Z"
              fill="#C9A84C"
            />
          </svg>
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
