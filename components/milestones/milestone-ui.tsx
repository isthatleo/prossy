"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, Check, Loader2, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createMilestoneAction,
  deleteMilestoneAction,
  setMilestoneStatusAction,
} from "@/app/(dashboard)/projects/[id]/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const NEXT_STATUS: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
}

export function MilestoneAddForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = await createMilestoneAction(projectId, formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Milestone added.")
    formRef.current?.reset()
    startTransition(() => router.refresh())
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="milestone-title">Milestone *</Label>
        <Input
          id="milestone-title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          placeholder="e.g. Literature review complete"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="milestone-due">Due date</Label>
          <Input id="milestone-due" name="dueDate" type="date" />
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={pending}>
            Add milestone
          </Button>
        </div>
      </div>
    </form>
  )
}

export function MilestoneRow({
  projectId,
  milestoneId,
  title,
  description,
  status,
  dueDate,
  completedAt,
  canManage,
}: {
  projectId: string
  milestoneId: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  completedAt: string | null
  canManage: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label)
    try {
      await fn()
      startTransition(() => router.refresh())
    } finally {
      setBusy(null)
    }
  }

  function advance() {
    void run("advance", async () => {
      const next = NEXT_STATUS[status]
      if (!next) return
      const result = await setMilestoneStatusAction(projectId, milestoneId, next)
      if (!result.ok) toast.error(result.error)
    })
  }

  function reset() {
    void run("reset", async () => {
      const result = await setMilestoneStatusAction(projectId, milestoneId, "pending")
      if (!result.ok) toast.error(result.error)
    })
  }

  function remove() {
    if (!window.confirm(`Delete "${title}"?`)) return
    void run("delete", async () => {
      const result = await deleteMilestoneAction(projectId, milestoneId)
      if (!result.ok) toast.error(result.error)
    })
  }

  const overdue =
    status !== "completed" && dueDate !== null && new Date(dueDate) < new Date()

  return (
    <li className="group flex items-start gap-3 border-b border-border/50 px-1 py-3 last:border-b-0">
      <Button
        size="icon-sm"
        variant={status === "completed" ? "default" : "outline"}
        aria-label={
          status === "completed"
            ? "Mark as pending"
            : `Move to ${NEXT_STATUS[status] ?? "done"}`
        }
        disabled={busy !== null || pending}
        onClick={() => (status === "completed" ? reset() : advance())}
        className="mt-0.5 shrink-0 rounded-full"
      >
        {busy !== null ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : status === "completed" ? (
          <Check className="size-3.5" />
        ) : status === "in_progress" ? (
          <Play className="size-3.5" />
        ) : (
          <ArrowLeftRight className="size-3.5" />
        )}
      </Button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-6 ${status === "completed" ? "text-muted-foreground line-through" : ""}`}
        >
          {title}
        </p>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground/70">
          {overdue
            ? `Overdue — was due ${new Date(dueDate).toLocaleDateString("en-GB")}`
            : dueDate
              ? `Due ${new Date(dueDate).toLocaleDateString("en-GB")}`
              : "No due date"}
          {completedAt
            ? ` · completed ${new Date(completedAt).toLocaleDateString("en-GB")}`
            : ""}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
        {canManage ? (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Delete milestone"
            disabled={busy !== null || pending}
            onClick={remove}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}
