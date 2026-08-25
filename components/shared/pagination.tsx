import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Pagination({
  page,
  totalPages,
  baseUrl,
  params = {},
}: {
  page: number
  totalPages: number
  baseUrl: string
  params?: Record<string, string>
}) {
  if (totalPages <= 1) return null

  function href(p: number) {
    const sp = new URLSearchParams(params)
    if (p > 1) {
      sp.set("page", String(p))
    } else {
      sp.delete("page")
    }
    const qs = sp.toString()
    return qs ? `${baseUrl}?${qs}` : baseUrl
  }

  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon-sm"
        render={<Link href={href(page - 1)} aria-label="Previous page" />}
        disabled={page <= 1}
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="flex size-8 items-center justify-center text-xs text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon-sm"
            render={<Link href={href(p)} aria-label={`Page ${p}`} />}
            className={cn(p === page && "pointer-events-none")}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="icon-sm"
        render={<Link href={href(page + 1)} aria-label="Next page" />}
        disabled={page >= totalPages}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length
  const totalPages = Math.ceil(total / perPage)
  const safePage = Math.max(1, Math.min(page, totalPages || 1))
  const start = (safePage - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    totalPages,
    total,
  }
}
