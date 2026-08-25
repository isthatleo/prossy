"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, Save, Video } from "lucide-react"
import { toast } from "sonner"

import { updateMeetingNotesAction } from "@/app/(dashboard)/meetings/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/**
 * Embedded video call for the meeting. Uses a Jitsi room derived from the
 * meeting id so every participant joins the same call without any setup.
 */
export function MeetingCallPanel({
  meetingId,
  status,
}: {
  meetingId: string
  status: string
}) {
  const [joined, setJoined] = useState(false)
  const room = `prossy-meeting-${meetingId}`

  if (status === "cancelled") {
    return (
      <CardContent className="pt-0">
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          This meeting was cancelled — no call room available.
        </p>
      </CardContent>
    )
  }

  if (!joined) {
    return (
      <CardContent className="flex flex-col items-center gap-3 pt-0">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Video className="size-5" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Hold this session right here — audio and video run in an embedded
          room that all invited participants share.
        </p>
        <Button onClick={() => setJoined(true)}>
          <Video className="size-4" />
          Join call
        </Button>
      </CardContent>
    )
  }

  return (
    <CardContent className="pt-0">
      <div className="overflow-hidden rounded-xl border bg-black">
        <iframe
          key={room}
          src={`https://meet.jit.si/${room}#config.prejoinPageEnabled=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="h-[560px] w-full"
          title="Meeting call"
        />
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        Trouble with the embedded room?
        <a
          href={`https://meet.jit.si/${room}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
        >
          Open in a new tab
          <ExternalLink className="size-3" />
        </a>
      </p>
    </CardContent>
  )
}

/** Shared minutes — every participant can save notes. */
export function MeetingNotesEditor({
  meetingId,
  initialNotes,
  readOnly = false,
}: {
  meetingId: string
  initialNotes: string
  readOnly?: boolean
}) {
  const [value, setValue] = useState(initialNotes)
  const [saved, setSaved] = useState(initialNotes)
  const [busy, setBusy] = useState(false)
  const [pending, startTransition] = useTransition()
  const dirty = value !== saved

  function save() {
    setBusy(true)
    startTransition(async () => {
      const result = await updateMeetingNotesAction(meetingId, value)
      setBusy(false)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSaved(value)
      toast.success("Notes saved.")
    })
  }

  if (readOnly) {
    return (
      <CardContent className="pt-0">
        {saved ? (
          <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
            {saved}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/70">No notes yet.</p>
        )}
      </CardContent>
    )
  }

  return (
    <CardContent className="space-y-3 pt-0">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={6}
        placeholder="Discussion points, decisions, action items…"
        aria-label="Meeting notes"
      />
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-xs",
            dirty ? "text-warning" : "text-muted-foreground/60"
          )}
        >
          {dirty ? "Unsaved changes" : "Shared with all participants"}
        </p>
        <Button size="sm" disabled={!dirty || busy || pending} onClick={save}>
          {busy || pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Save notes
        </Button>
      </div>
    </CardContent>
  )
}

/** Small helper card linking back to the project. */
export function ProjectLinkCard({
  projectId,
  projectTitle,
}: {
  projectId: string
  projectTitle: string
}) {
  return (
    <Card className="glass shadow-none">
      <CardHeader className="pb-1.5">
        <CardDescription>Project</CardDescription>
        <CardTitle className="text-sm leading-snug">{projectTitle}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open project
          <ExternalLink className="size-3" />
        </Link>
      </CardContent>
    </Card>
  )
}
