import type { SubmissionStatus } from '../../types/dashboard'

interface StatusBadgeProps {
  status: SubmissionStatus
}

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: 'bg-red-100 text-red-800',
  reviewed: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
