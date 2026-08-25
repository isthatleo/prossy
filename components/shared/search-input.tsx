"use client"

import { useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SearchInput({
  param = "q",
  placeholder = "Search…",
  className,
}: {
  param?: string
  placeholder?: string
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const current = searchParams.get(param) ?? ""

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(param, value)
      } else {
        params.delete(param)
      }
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams, param, startTransition]
  )

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent pl-8 pr-8 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
      />
      {current ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={() => handleChange("")}
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}
