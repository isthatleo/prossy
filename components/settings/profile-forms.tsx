"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  changePasswordAction,
  updateProfileAction,
} from "@/app/(dashboard)/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileNameForm({ currentName }: { currentName: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = await updateProfileAction(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Profile updated.")
    startTransition(() => router.refresh())
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="profile-name">Full name</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={currentName}
          required
          minLength={2}
          maxLength={80}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        Save changes
      </Button>
    </form>
  )
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const newPassword = String(data.get("newPassword") ?? "")
    const confirm = String(data.get("confirmPassword") ?? "")
    if (newPassword !== confirm) {
      toast.error("New passwords do not match.")
      return
    }

    const result = await changePasswordAction(
      String(data.get("currentPassword") ?? ""),
      newPassword
    )
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Password changed.")
    formRef.current?.reset()
    startTransition(() => undefined)
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Change password
      </Button>
    </form>
  )
}
