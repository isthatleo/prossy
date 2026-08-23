import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}) {
  return (
    <Card
      className={cn(
        "glass tile-hover border-dashed shadow-none",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        {Icon ? (
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        ) : null}
        <div>
          <p className="font-medium">{title}</p>
          {description ? (
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actionLabel && actionHref ? (
          <Button render={<a href={actionHref} />}>{actionLabel}</Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
