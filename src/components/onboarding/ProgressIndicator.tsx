interface ProgressIndicatorProps {
  totalSteps: number // Total dots to show (5 for onboarding screens 2-6)
  currentStep: number // Current step index (0-based, maps to dots 0-4)
  className?: string
}

export function ProgressIndicator({
  totalSteps,
  currentStep,
  className = '',
}: ProgressIndicatorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              isCurrent
                ? 'bg-[#D4A853] scale-110'
                : isCompleted
                  ? 'bg-[#D4A853]'
                  : 'bg-[#3F3F46]'
            }`}
          />
        )
      })}
    </div>
  )
}
