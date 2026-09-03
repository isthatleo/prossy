"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupervisorAction } from "@/app/(dashboard)/supervisors/actions"
import type { ActionResult } from "@/app/(dashboard)/supervisors/actions"

export function AddSupervisorDialog() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await createSupervisorAction(formData)
      if (result.ok) {
        toast.success("Supervisor created")
        router.refresh()
      }
      return result
    },
    { ok: false }
  )

  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="sm" />}
      >
        <UserPlus className="size-3.5" />
        Add supervisor
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add supervisor</DialogTitle>
          <DialogDescription>
            Create a new supervisor account. They can sign in immediately.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          {state.error ? (
            <p className="text-xs text-destructive">{state.error}</p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="sup-name">Full name</Label>
            <Input
              id="sup-name"
              name="name"
              required
              minLength={2}
              placeholder="Dr. Ada Lovelace"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-email">Email</Label>
            <Input
              id="sup-email"
              name="email"
              type="email"
              required
              placeholder="ada@university.edu"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-password">Password</Label>
            <Input
              id="sup-password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-staffNumber">Staff number</Label>
            <Input
              id="sup-staffNumber"
              name="staffNumber"
              required
              placeholder="STF-001"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-title">Title (optional)</Label>
            <Input
              id="sup-title"
              name="title"
              placeholder="Prof., Dr., etc."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-specialization">Specialisation (optional)</Label>
            <Input
              id="sup-specialization"
              name="specialization"
              placeholder="Machine Learning"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-officeLocation">Office (optional)</Label>
            <Input
              id="sup-officeLocation"
              name="officeLocation"
              placeholder="Block A, Room 204"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-departmentId">Department ID (optional)</Label>
            <Input
              id="sup-departmentId"
              name="departmentId"
              placeholder="UUID"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create supervisor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
