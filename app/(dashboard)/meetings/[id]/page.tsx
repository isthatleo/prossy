import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react"
import Link from "next/link"

import {
  MeetingCallPanel,
  MeetingNotesEditor,
  ProjectLinkCard,
} from "@/components/meetings/meeting-room"
import { MeetingStatusButtons } from "@/components/meetings/meeting-ui"
import { PageHeader } from "@/components/shared/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import { formatDateTime } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { getMeetingDetail } from "@/services/meetings"
import { initials } from "@/lib/utils"

export const metadata = { title: "Meeting" }

const STATUS_VARIANT: Record<string, "secondary" | "success" | "warning" | "destructive"> = {
  scheduled: "secondary",
  completed: "success",
  cancelled: "destructive",
}

function formatRange(startAt: Date, endAt: Date | null) {
  const start = new Date(startAt)
  const end = endAt ? new Date(endAt) : null
  const date = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const time = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return end ? `${date}, ${time(start)} – ${time(end)}` : `${date}, ${time(start)}`
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session] = await Promise.all([params, requireUser()])
  const viewer = {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role as UserRole,
  }

  let meeting
  try {
    meeting = await getMeetingDetail(id, viewer)
  } catch {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="glass mt-10 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium">Meeting not available</p>
            <p className="text-sm text-muted-foreground">
              It may have been removed, or you are not a participant.
            </p>
            <Button render={<Link href="/meetings" />} size="sm" variant="outline" className="mt-2">
              Back to meetings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> All meetings
      </Link>

      <PageHeader
        title={meeting.title}
        description={formatRange(meeting.startAt, meeting.endAt)}
      >
        <Badge variant={STATUS_VARIANT[meeting.status] ?? "secondary"}>
          {meeting.status}
        </Badge>
      </PageHeader>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Call + notes */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                Session room
                {meeting.status === "scheduled" ? (
                  <Badge variant="secondary">Live room ready</Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Audio and video for this meeting — everyone invited joins here.
              </CardDescription>
            </CardHeader>
            <MeetingCallPanel meetingId={meeting.id} status={meeting.status} />
          </Card>

          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Shared notes</CardTitle>
              <CardDescription>
                Minutes and action items — editable by any participant.
              </CardDescription>
            </CardHeader>
            <MeetingNotesEditor
              meetingId={meeting.id}
              initialNotes={meeting.notes ?? ""}
            />
          </Card>

          {meeting.agenda ? (
            <Card className="glass shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Agenda</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
                  {meeting.agenda}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-4">
          <ProjectLinkCard
            projectId={meeting.projectId}
            projectTitle={meeting.projectTitle}
          />

          <Card className="glass shadow-none">
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-primary" />
                Participants · {meeting.participants.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5">
                {meeting.participants.map((participant) => (
                  <li key={participant.id} className="flex items-center gap-2.5">
                    <Avatar className="size-7 shrink-0">
                      {participant.image ? (
                        <AvatarImage src={participant.image} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-primary/15 text-[0.625rem] font-semibold text-primary">
                        {initials(participant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {participant.name}
                      {participant.id === meeting.createdBy ? (
                        <span className="text-muted-foreground"> · organiser</span>
                      ) : null}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {participant.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass shadow-none">
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 text-primary" />
                When & where
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm">
              <p>{formatRange(meeting.startAt, meeting.endAt)}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {meeting.location ?? "Online — use the session room"}
              </p>
            </CardContent>
          </Card>

          {meeting.canManage ? (
            <Card className="glass shadow-none">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm">Actions</CardTitle>
                <CardDescription>Close the session out.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <MeetingStatusButtons meetingId={meeting.id} />
              </CardContent>
            </Card>
          ) : null}

          <p className="px-1 text-xs text-muted-foreground/60">
            Created {formatDateTime(meeting.createdAt)}.
          </p>
        </div>
      </div>
    </div>
  )
}
