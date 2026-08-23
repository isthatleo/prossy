import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  tone?: "default" | "primary" | "success" | "warning" | "destructive"
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: StatCardProps) {
  return (
    <Card className="glass tile-hover shadow-none">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            TONES[tone]
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight tracking-tight tabular-nums">
            {value}
          </p>
          {hint ? (
            <Badge variant="secondary" className="mt-1 px-1.5 py-0 text-[0.625rem] font-normal">
              {hint}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
