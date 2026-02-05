const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const haptics = {
  /** Light tap - set completion, toggles */
  light: () => canVibrate && navigator.vibrate(10),

  /** Medium tap - action confirmed */
  medium: () => canVibrate && navigator.vibrate(25),

  /** Success pattern - workout complete, check-in, achievement unlock */
  success: () => canVibrate && navigator.vibrate([15, 50, 30]),

  /** Heavy tap - important milestone like XP claim */
  heavy: () => canVibrate && navigator.vibrate(50),

  /** Error buzz - something went wrong */
  error: () => canVibrate && navigator.vibrate([50, 30, 50]),
}
