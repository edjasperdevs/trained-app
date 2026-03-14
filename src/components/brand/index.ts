export { WTLogo } from './WTLogo'

// Metallic gold gradient style for text
// Use with style={metallicGoldStyle} on text elements
export const metallicGoldStyle = {
  background: 'linear-gradient(180deg, #F5D998 0%, #D4A853 25%, #B8943F 50%, #D4A853 75%, #F5D998 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as const
