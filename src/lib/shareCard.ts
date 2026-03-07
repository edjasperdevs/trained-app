import { toPng } from 'html-to-image'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { isNative } from './platform'
import { useDPStore } from '@/stores/dpStore'

type ShareType = 'workout' | 'compliance' | 'rankup' | 'weekly'

interface ShareOptions {
  element: HTMLElement
  filename: string
  text: string
  shareType: ShareType
  rankName?: string // Required for rankup type
}

/**
 * Core utility: captures DOM element as PNG and opens native share sheet.
 * On web, triggers download instead of native share.
 * Awards DP after successful share based on shareType.
 */
export async function generateAndShare(options: ShareOptions): Promise<boolean> {
  const { element, filename, text, shareType, rankName } = options

  try {
    // Wait for fonts to be ready before capture
    await document.fonts.ready

    // Generate PNG from DOM element
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2, // Retina quality
      cacheBust: true, // Prevent stale cached images
    })

    if (!isNative()) {
      // Web fallback: trigger download
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = dataUrl
      link.click()

      // Award DP even on web download
      awardDPForShare(shareType, rankName)
      return true
    }

    // Native: write to cache and share
    const base64 = dataUrl.split(',')[1]

    const file = await Filesystem.writeFile({
      path: `share/${filename}.png`,
      data: base64,
      directory: Directory.Cache,
      recursive: true, // Create share/ subdirectory if needed
    })

    await Share.share({
      title: 'WellTrained',
      text,
      url: 'https://welltrained.app',
      files: [file.uri],
      dialogTitle: 'Share your protocol',
    })

    // Award DP after successful share
    awardDPForShare(shareType, rankName)
    return true
  } catch (error) {
    console.error('Share failed:', error)
    return false
  }
}

/**
 * Awards DP based on share type. Called after successful share.
 */
function awardDPForShare(shareType: ShareType, rankName?: string): void {
  const store = useDPStore.getState()

  switch (shareType) {
    case 'workout':
      store.awardShareWorkoutDP()
      break
    case 'compliance':
      store.awardShareComplianceDP()
      break
    case 'rankup':
      if (rankName) {
        store.awardShareRankUpDP(rankName)
      }
      break
    case 'weekly':
      // No DP award for weekly report share
      break
  }
}

// Convenience wrappers for each card type - to be used by card components in later phases
// These will receive component-rendered data and call generateAndShare

export async function shareRankUpCard(
  element: HTMLElement,
  rankName: string,
  totalDP: number,
  _streak: number // Reserved for future share text customization
): Promise<boolean> {
  const text = `Just achieved ${rankName} rank on WellTrained. ${totalDP.toLocaleString()} Discipline Points earned. Submit to the Gains. welltrained.app`

  return generateAndShare({
    element,
    filename: `welltrained-${rankName.toLowerCase()}-rank`,
    text,
    shareType: 'rankup',
    rankName,
  })
}

export async function shareWorkoutCard(
  element: HTMLElement,
  workoutName: string,
  setsCompleted: number,
  dpEarned: number,
  rankName: string
): Promise<boolean> {
  const text = `Protocol complete. ${workoutName} — ${setsCompleted} sets, +${dpEarned} DP earned. Rank: ${rankName}. welltrained.app`

  return generateAndShare({
    element,
    filename: `welltrained-workout-${Date.now()}`,
    text,
    shareType: 'workout',
  })
}

export async function shareComplianceCard(
  element: HTMLElement,
  streak: number,
  totalDP: number,
  rankName: string
): Promise<boolean> {
  const text = `Full compliance. Day ${streak} of the Protocol. ${totalDP.toLocaleString()} DP earned. Rank: ${rankName}. welltrained.app`

  return generateAndShare({
    element,
    filename: `welltrained-compliance-day${streak}`,
    text,
    shareType: 'compliance',
  })
}

export async function shareWeeklyReportCard(
  element: HTMLElement,
  dpEarned: number,
  streak: number,
  rankName: string
): Promise<boolean> {
  const text = `Weekly Protocol Report: +${dpEarned} DP earned, ${streak} day streak, ${rankName} rank. Submit to the Gains. welltrained.app`

  return generateAndShare({
    element,
    filename: `welltrained-weekly-report-${Date.now()}`,
    text,
    shareType: 'weekly',
  })
}
