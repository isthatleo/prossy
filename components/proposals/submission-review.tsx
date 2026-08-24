"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Eye, RefreshCw, X } from "lucide-react"
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
import {
  reviewProposalAction,
  reviewSubmissionAction,
} from "@/app/(dashboard)/projects/[id]/actions"

type Decision =
  | "start_review"
  | "approve"
  | "request_revision"
  | "reject"

const META: Record<Decision, { label: string; icon: typeof Check }> = {
  start_review: { label: "Start review", icon: Eye },
  approve: { label: "Approve", icon: Check },
  request_revision: { label: "Request revision", icon: RefreshCw },
  reject: { label: "Reject", icon: X },
}

export function SubmissionReviewButtons({
  projectId,
  kind,
  targetId,
  decisions,
}: {
  projectId: string
  kind: "proposal" | "submission"
  targetId: string
  decisions: Decision[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notesOpen, setNotesOpen] = useState<Decision | null>(null)
  const [notes, setNotes] = useState("")

  if (decisions.length === 0) return null

  async function run(decision: Decision, withNotes?: string) {
    const result =
      kind === "proposal"
        ? await reviewProposalAction(projectId, targetId, decision, withNotes)
        : await reviewSubmissionAction(
            projectId,
            targetId,
            decision === "reject" ? "request_revision" : decision,
            withNotes
          )
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(META[decision].label + " — done.")
    setNotesOpen(null)
    setNotes("")
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {decisions.map((decision) => {
          const meta = META[decision]
          const Icon = meta.icon
          return (
            <Button
              key={decision}
              size="sm"
              variant={
                decision === "approve"
                  ? "default"
                  : decision === "reject" || decision === "request_revision"
                    ? "outline"
                    : "ghost"
              }
              className="h-7 px-2.5 text-xs"
              disabled={pending}
              onClick={() =>
                decision === "request_revision" || decision === "reject"
                  ? setNotesOpen(decision)
                  : void run(decision)
              }
            >
              <Icon className="size-3" />
              {meta.label}
            </Button>
          )
        })}
      </div>

      <Dialog open={notesOpen !== null} onOpenChange={(open) => !open && setNotesOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{notesOpen ? META[notesOpen].label : ""}</DialogTitle>
            <DialogDescription>
              Explain what needs to change. The note is sent to the student and
              kept with the submission.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Chapter 2 lacks citations for the literature claims."
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
    </>
  )
}
