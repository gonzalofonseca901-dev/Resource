import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeTone = "default" | "muted" | "success" | "warning" | "danger"

const TONE_CLASSES: Record<BadgeTone, string> = {
  default: "bg-accent text-accent-foreground border-transparent",
  muted: "bg-secondary text-secondary-foreground border-transparent",
  success: "bg-status-confirmed/10 text-status-confirmed border-status-confirmed/25",
  warning: "bg-status-pending/10 text-status-pending border-status-pending/25",
  danger: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/25",
}

interface BadgeProps extends React.ComponentProps<"span"> {
  tone?: BadgeTone
}

function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
