import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-xl border border-border/50 p-5 shadow-none", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-xl border border-border/50 p-5 shadow-none">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass rounded-xl border border-border/50 p-5 shadow-none">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full" />
      </div>
    </div>
  )
}

export function MessageCardSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

export function MeetingCardSkeleton() {
  return (
    <div className="glass rounded-xl border border-border/50 p-5 shadow-none">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-3 w-48" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-2.5 border-b border-border/50 px-3 py-2.5">
      <Skeleton className="mt-0.5 size-4" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  )
}
