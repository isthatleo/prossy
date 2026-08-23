"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Play, RefreshCw, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { projectTransitionAction } from "@/app/(dashboard)/projects/actions"

type ActionKind = "submit" | "start_review" | "approve" | "request_revision" | "reject" | "start_work"

const ACTION_META: Record<ActionKind, { label: string; icon: typeof Send }> = {
  submit: { label: "Submit for approval", icon: Send },
  start_review: { label: "Start review", icon: RefreshCw },
  approve: { label: "Approve", icon: Check },
  request_revision: { label: "Request revision", icon: RefreshCw },
  reject: { label: "Reject", icon: X },
  start_work: { label: "Start project work", icon: Play },
}

export function ProjectActions({
  projectId,
  actions,
}: {
  projectId: string
  actions: ActionKind[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notesOpen, setNotesOpen] = useState<ActionKind | null>(null)
  const [notes, setNotes] = useState("")

  if (actions.length === 0) return null

  async function run(action: ActionKind, withNotes?: string) {
    const result = await projectTransitionAction(projectId, action, withNotes)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(ACTION_META[action].label + " — done.")
    setNotesOpen(null)
    setNotes("")
    startTransition(() => router.refresh())
  }

  const needsNotes: ActionKind[] = ["request_revision", "reject"]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const meta = ACTION_META[action]
        const Icon = meta.icon
        return (
          <Button
            key={action}
            size="sm"
            variant={
              action === "approve"
                ? "default"
                : action === "reject"
                  ? "destructive"
                  : "outline"
            }
            disabled={pending}
            onClick={() => (needsNotes.includes(action) ? setNotesOpen(action) : void run(action))}
          >
            <Icon className="size-3.5" />
            {meta.label}
          </Button>
        )
      })}

      <Dialog open={notesOpen !== null} onOpenChange={(open) => !open && setNotesOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {notesOpen ? ACTION_META[notesOpen].label : ""}
            </DialogTitle>
            <DialogDescription>
              Add a short note explaining what needs to change. It will be
              attached to the notification and activity log.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Methodology section is too thin — add data collection details."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNotesOpen(null)}>
              Cancel
            </Button>
            <Button
              disabled={pending || notes.trim().length < 5}
              onClick={() => notesOpen && void run(notesOpen, notes)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
