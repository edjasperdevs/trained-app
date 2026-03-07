import React from 'react'

interface ShareCardWrapperProps {
  children: React.ReactNode
  cardRef: React.RefObject<HTMLDivElement>
}

/**
 * Renders children off-screen for html-to-image capture.
 * Position outside viewport so toPng() can capture without UI flicker.
 */
export function ShareCardWrapper({ children, cardRef }: ShareCardWrapperProps) {
  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '390px',
        height: '844px',
        overflow: 'hidden',
        // Ensure fonts render correctly for capture
        fontSmooth: 'always',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {children}
    </div>
  )
}
