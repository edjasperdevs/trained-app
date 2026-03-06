/**
 * Avatar utility functions.
 * Extracted to avoid circular imports between AvatarScreen and EvolvingAvatar.
 */

/** Map rank to avatar stage: ranks 1-3 -> stage 1, 4-7 -> stage 2, 8-11 -> stage 3, 12-14 -> stage 4, 15 -> stage 5 */
export function getAvatarStage(rank: number): number {
  if (rank >= 15) return 5
  if (rank >= 12) return 4
  if (rank >= 8) return 3
  if (rank >= 4) return 2
  return 1
}
