import { Badge } from "@/components/ui/badge"
import { humanize } from "@/lib/format"
import { cn } from "@/lib/utils"

const STATUS_VARIANTS: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  topic_submitted: "outline",
  proposal_submitted: "outline",
  under_review: "warning",
  revision_required: "destructive",
  approved: "success",
  in_progress: "primary",
  final_submission: "warning",
  completed: "success",
  rejected: "destructive",
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge
      variant={STATUS_VARIANTS[status] ?? "secondary"}
      className={cn(className)}
    >
      {humanize(status)}
    </Badge>
  )
}
