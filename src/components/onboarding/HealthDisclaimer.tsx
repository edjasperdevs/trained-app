import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

interface HealthDisclaimerProps {
  onAcknowledge: (acknowledged: boolean) => void
}

export function HealthDisclaimer({ onAcknowledge }: HealthDisclaimerProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  const handleCheckChange = (checked: boolean) => {
    setAcknowledged(checked)
    onAcknowledge(checked)
  }

  return (
    <div className="space-y-6">
      {/* Icon and title */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[rgba(212,168,83,0.1)] border border-[#D4A853]">
          <ShieldAlert className="w-8 h-8 text-[#D4A853]" />
        </div>
        <h2
          className="text-2xl font-bold text-[#FAFAFA]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Health & Safety Notice
        </h2>
      </div>

      {/* Card with disclaimer text */}
      <Card className="bg-[#26282B] border-[#3F3F46]">
        <CardContent className="space-y-4 text-[#D4D4D8] text-sm leading-relaxed pt-6">
          <p>
            WellTrained is a fitness tracking and discipline app designed to help you build consistent training habits.
          </p>
          <p>
            This app is <strong className="text-[#FAFAFA]">NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before starting any new fitness program, especially if you have any pre-existing medical conditions, injuries, or health concerns.
          </p>
          <p>
            The information and guidance provided in this app are for general educational purposes only and should not be considered medical advice.
          </p>
        </CardContent>
      </Card>

      {/* Checkbox for acknowledgment */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => handleCheckChange(e.target.checked)}
            className="peer sr-only"
          />
          <div className={cn(
            "w-5 h-5 rounded border-2 transition-all duration-200",
            acknowledged
              ? "bg-[#D4A853] border-[#D4A853]"
              : "bg-transparent border-[#52525B] group-hover:border-[#71717A]"
          )}>
            {acknowledged && (
              <svg
                className="w-full h-full text-[#0A0A0A]"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 10L8 14L16 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-[#D4D4D8] text-sm select-none">
          I understand and acknowledge this is not medical advice
        </span>
      </label>
    </div>
  )
}
