import Link from "next/link"
import { ArrowRight, CalendarDays, MapPin } from "lucide-react"

import {
  MeetingStatusButtons,
  ScheduleMeetingDialog,
} from "@/components/meetings/meeting-ui"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import {
  listMeetingsForUser,
  listSchedulableProjects,
  splitMeetings,
} from "@/services/meetings"

export const metadata = { title: "Meetings" }

const STATUS_VARIANT: Record<string, "secondary" | "success" | "warning" | "destructive"> = {
  scheduled: "secondary",
  completed: "success",
  cancelled: "destructive",
}

function formatRange(startAt: Date, endAt: Date | null) {
  const start = new Date(startAt)
  const end = endAt ? new Date(endAt) : null
  const date = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const time = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return end
    ? `${date}, ${time(start)}–${time(end)}`
    : `${date}, ${time(start)}`
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireUser()
  const role = session.user.role as UserRole
  const { q } = await searchParams
  const query = q?.trim().toLowerCase() ?? ""

  const [allMeetings, schedulable] = await Promise.all([
    listMeetingsForUser(session.user.id, role),
    listSchedulableProjects(session.user.id, role),
  ])
  const filterFn = (m: typeof allMeetings[number]) =>
    !query ||
    m.title.toLowerCase().includes(query) ||
    (m.projectTitle ?? "").toLowerCase().includes(query) ||
    (m.location ?? "").toLowerCase().includes(query)
  const { upcoming: allUpcoming, past: allPast } = splitMeetings(allMeetings)
  const upcoming = allUpcoming.filter(filterFn)
  const past = allPast.filter(filterFn)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Meetings"
        description="Supervision sessions for your projects — schedule, track and close them out."
      />

      <div className="mt-5 flex items-center gap-3">
        <SearchInput placeholder="Search meetings…" className="flex-1" />
        <ScheduleMeetingDialog projects={schedulable} />
      </div>

      {/* Upcoming */}
      <section className="mt-2">
        <h2 className="px-1 text-sm font-semibold tracking-wide text-muted-foreground">
          Upcoming
        </h2>
        <div className="mt-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming meetings"
              description="Schedule a session with your student or supervisor to keep the project moving."
            />
          ) : (
            upcoming.map((meeting) => (
              <Card key={meeting.id} className="glass mb-3 shadow-none">
                <CardHeader className="pb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm">{meeting.title}</CardTitle>
                    <Badge variant={STATUS_VARIANT[meeting.status] ?? "secondary"}>
                      {meeting.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatRange(meeting.startAt, meeting.endAt)} ·{" "}
                    {meeting.projectTitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {meeting.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> {meeting.location}
                      </span>
                    ) : null}
                    <span>Organised by {meeting.creatorName ?? "a member"}</span>
                  </div>
                  {meeting.agenda ? (
                    <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                      {meeting.agenda}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <MeetingStatusButtons meetingId={meeting.id} />
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Open room
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Past */}
      {past.length > 0 ? (
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold tracking-wide text-muted-foreground">
            Past
          </h2>
          <div className="mt-3">
            {past.map((meeting) => (
              <Card key={meeting.id} className="glass mb-3 opacity-80 shadow-none">
                <CardHeader className="pb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm">{meeting.title}</CardTitle>
                    <Badge variant={STATUS_VARIANT[meeting.status] ?? "secondary"}>
                      {meeting.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatRange(meeting.startAt, meeting.endAt)} ·{" "}
                    {meeting.projectTitle}
                  </CardDescription>
                </CardHeader>
                {meeting.notes || meeting.agenda ? (
                  <CardContent className="pt-0">
                    <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {meeting.notes ? "Notes" : "Agenda"}:
                      </span>{" "}
                      {meeting.notes ?? meeting.agenda}
                    </p>
                    <div className="mt-2 text-right">
                      <Link
                        href={`/meetings/${meeting.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Details <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
