import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Button } from '@/components/ui/button'
import { haptics } from '@/lib/haptics'

interface ShareBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onShare: (withPhoto: boolean, photoDataUrl?: string) => void
  isLoading?: boolean
}

/**
 * Captures a photo using the device camera.
 * Returns the photo as a base64 data URL, or undefined if cancelled/error.
 */
async function capturePhoto(): Promise<string | undefined> {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    })
    return photo.dataUrl
  } catch {
    // User cancelled or camera error
    return undefined
  }
}

/**
 * ShareBottomSheet - Modal for workout share options.
 * Offers "Share with Photo" and "Share without Photo" options.
 * Camera capture triggers before share when user selects photo option.
 */
export function ShareBottomSheet({
  isOpen,
  onClose,
  onShare,
  isLoading = false,
}: ShareBottomSheetProps) {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleShareWithPhoto = async () => {
    haptics.light()
    setIsCapturing(true)

    const photoDataUrl = await capturePhoto()
    setIsCapturing(false)

    if (photoDataUrl) {
      onShare(true, photoDataUrl)
    }
    // If user cancelled camera, stay open (don't call onShare)
  }

  const handleShareWithoutPhoto = () => {
    haptics.light()
    onShare(false)
  }

  const handleClose = () => {
    haptics.light()
    onClose()
  }

  const isProcessing = isLoading || isCapturing

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isProcessing ? handleClose : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
            }}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#0A0A0A',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '24px',
              paddingBottom: '48px', // Safe area padding
              zIndex: 51,
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: '#3F3F46',
                borderRadius: '2px',
                margin: '0 auto 24px',
              }}
            />

            {/* Title */}
            <h2
              style={{
                fontFamily: 'Oswald, system-ui, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#FFFFFF',
                textAlign: 'center',
                margin: 0,
                marginBottom: '24px',
              }}
            >
              Share Protocol
            </h2>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Share with Photo */}
              <Button
                variant="default"
                size="lg"
                onClick={handleShareWithPhoto}
                disabled={isProcessing}
                className="w-full h-12"
              >
                {isCapturing ? 'Opening Camera...' : 'Share with Photo'}
              </Button>

              {/* Share without Photo */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleShareWithoutPhoto}
                disabled={isProcessing}
                className="w-full h-12 border-zinc-700"
              >
                {isLoading ? 'Sharing...' : 'Share without Photo'}
              </Button>

              {/* Cancel */}
              <Button
                variant="ghost"
                size="lg"
                onClick={handleClose}
                disabled={isProcessing}
                className="w-full h-12 text-zinc-400"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
