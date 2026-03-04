// Simple sound effects using Web Audio API

let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioContext
}

const playTone = (frequency: number, duration: number, startTime: number, volume = 0.3) => {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.value = frequency
  oscillator.type = 'sine'

  // Envelope: quick attack, gradual decay
  const now = ctx.currentTime + startTime
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

export const sounds = {
  /** Pleasant two-tone chime for timer completion */
  chime: () => {
    const ctx = getAudioContext()
    if (!ctx) return

    // Resume context if suspended (required after user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Two-tone chime: E5 then G5
    playTone(659.25, 0.15, 0, 0.25)  // E5
    playTone(783.99, 0.3, 0.12, 0.25) // G5
  },

  /** Success sound - ascending tones */
  success: () => {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // C5 -> E5 -> G5
    playTone(523.25, 0.1, 0, 0.2)
    playTone(659.25, 0.1, 0.08, 0.2)
    playTone(783.99, 0.2, 0.16, 0.2)
  },
}
