"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarPlus, X } from "lucide-react"
import { toast } from "sonner"

import {
  meetingStatusAction,
  scheduleMeetingAction,
} from "@/app/(dashboard)/meetings/actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ScheduleMeetingDialog({
  projects,
}: {
  projects: Array<{ id: string; title: string }>
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? "")

  if (projects.length === 0) return null

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set("projectId", selectedProject)
    const result = await scheduleMeetingAction(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Meeting scheduled.")
    setOpen(false)
    formRef.current?.reset()
    startTransition(() => router.refresh())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <CalendarPlus data-icon="inline-start" /> Schedule meeting
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription>
            Everyone on the project is invited automatically and notified.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-project">Project *</Label>
            <Select value={selectedProject} onValueChange={(v) => v && setSelectedProject(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="projectId" value={selectedProject} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">Title *</Label>
            <Input
              id="meeting-title"
              name="title"
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Chapter 2 feedback session"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-start">Starts *</Label>
              <Input id="meeting-start" name="startAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-duration">Duration (min)</Label>
              <Input
                id="meeting-duration"
                name="durationMinutes"
                type="number"
                min={15}
                max={240}
                step={15}
                defaultValue={30}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-location">Location / link</Label>
            <Input
              id="meeting-location"
              name="location"
              maxLength={160}
              placeholder="Office B12 or a Google Meet link"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-agenda">Agenda</Label>
            <textarea
              id="meeting-agenda"
              name="agenda"
              rows={3}
              className="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              placeholder="What should be discussed?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MeetingStatusButtons({
  meetingId,
}: {
  meetingId: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<"complete" | "cancel" | null>(null)
  const [pending, startTransition] = useTransition()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState("")

  async function complete() {
    setBusy("complete")
    try {
      const result = await meetingStatusAction(meetingId, "complete")
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Meeting marked as completed.")
      startTransition(() => router.refresh())
    } finally {
      setBusy(null)
    }
  }

  async function cancel() {
    setBusy("cancel")
    try {
      const result = await meetingStatusAction(meetingId, "cancel", reason)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Meeting cancelled.")
      setCancelOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs"
          disabled={busy !== null || pending}
          onClick={() => void complete()}
        >
          Mark completed
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Cancel meeting"
          disabled={busy !== null || pending}
          onClick={() => setCancelOpen(true)}
        >
          <X className="size-3.5 text-muted-foreground" />
        </Button>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this meeting?</DialogTitle>
            <DialogDescription>
              Participants are notified. Add an optional reason below.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Conflicts with department seminar"
            maxLength={200}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep meeting
            </Button>
            <Button variant="destructive" disabled={busy !== null || pending} onClick={() => void cancel()}>
              Cancel meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
