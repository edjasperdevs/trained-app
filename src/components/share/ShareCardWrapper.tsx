import React from 'react'

interface ShareCardWrapperProps {
  children: React.ReactNode
  cardRef: React.RefObject<HTMLDivElement>
}

/**
 * Renders children off-screen for html-to-image capture.
 * Positioned off the right edge of viewport but still in render context.
 * This ensures html-to-image can capture the fully rendered content.
 */
export function ShareCardWrapper({ children, cardRef }: ShareCardWrapperProps) {
  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '100vw', // Off right edge, still rendered
        top: '0',
        width: '390px',
        height: '844px',
        overflow: 'hidden',
        pointerEvents: 'none',
        // Ensure fonts render correctly for capture
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {children}
    </div>
  )
}
