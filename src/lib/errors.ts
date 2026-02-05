export function friendlyError(context: string, error?: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '')

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('NetworkError') || message.includes('Failed to fetch')) {
    return `Couldn't ${context}. Check your internet connection and try again.`
  }

  // Storage errors
  if (message.includes('storage') || message.includes('quota') || message.includes('QuotaExceededError')) {
    return `Couldn't ${context}. Your device storage may be full. Try clearing some browser data.`
  }

  // JSON parse errors
  if (message.includes('JSON') || message.includes('Unexpected token') || message.includes('parse')) {
    return `Couldn't ${context}. The data format wasn't recognized. Make sure you're using a valid backup file.`
  }

  // Permission errors
  if (message.includes('permission') || message.includes('denied') || message.includes('403')) {
    return `Couldn't ${context}. You may not have permission for this action.`
  }

  // Generic fallback
  return `Something went wrong while trying to ${context}. Please try again.`
}
