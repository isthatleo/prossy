"use client"

import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

const emptySubscribe = () => () => undefined

export function ThemeSetting() {
  const { theme, setTheme } = useTheme()
  // Hydration-safe mount check (no setState-in-effect).
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-colors",
              active
                ? "border-primary/60 bg-primary/10 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            <Label className="cursor-pointer text-xs font-medium">{label}</Label>
          </button>
        )
      })}
    </div>
  )
}
