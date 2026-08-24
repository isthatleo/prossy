"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setUserActiveAction } from "@/app/(dashboard)/admin/taxonomy-actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function UserActiveToggle({
  userId,
  userName,
  isActive,
}: {
  userId: string
  userName: string
  isActive: boolean
}) {
  const router = useRouter()
  const [checked, setChecked] = useState(isActive)
  const [busy, setBusy] = useState(false)
  const [pending, startTransition] = useTransition()

  async function toggle(next: boolean) {
    if (
      !next &&
      !window.confirm(`Deactivate ${userName}? They will be locked out immediately.`)
    ) {
      setChecked(isActive)
      return
    }
    setBusy(true)
    const result = await setUserActiveAction(userId, next)
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      setChecked(isActive)
      return
    }
    toast.success(`${userName} ${next ? "activated" : "deactivated"}.`)
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-1.5">
      <Switch
        id={`active-${userId}`}
        checked={checked}
        disabled={busy || pending}
        onCheckedChange={(value) => {
          setChecked(value)
          void toggle(value)
        }}
      />
      <Label htmlFor={`active-${userId}`} className="sr-only">
        Active
      </Label>
    </div>
  )
}
