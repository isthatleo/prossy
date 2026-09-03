import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDotDashed,
  ClipboardCheck,

  FileText,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  History,
  MessagesSquare,
  Send,
  Shield,
  Tags,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  getAdminDashboard,
  getStudentDashboard,
  getSupervisorDashboard,
  getSupervisorActivity,
  type ActivityItem,
  type LatestSubmissionInfo,
  type MilestoneInfo,
  type PendingReviewItem,
  type UpcomingMeetingInfo,
} from "@/services/dashboard"
import { getProjectActivity } from "@/services/projects"
import { requireUser } from "@/lib/auth/guards"
import {
  formatDateTime,
  formatRelative,
} from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { cn } from "@/lib/utils"

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function HealthBadge({ score }: { score: number }) {
  const tone =
    score >= 75 ? "success" : score >= 50 ? "warning" : "destructive"
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <HeartPulse className="size-3.5 text-muted-foreground" />
      <Badge variant={tone}>{score}</Badge>
    </span>
  )
}

function MeetingsCard({
  meetings,
  title = "Upcoming meetings",
  viewAllHref,
}: {
  meetings: UpcomingMeetingInfo[]
  title?: string
  viewAllHref?: string
}) {
  return (
    <Card className="glass shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            {title}
          </span>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowUpRight className="size-3" />
            </Link>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {meetings.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No scheduled meetings.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {meetings.map((meeting) => (
              <li key={meeting.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{meeting.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {meeting.projectTitle ?? "General"} ·{" "}
                    {formatRelative(meeting.startAt)}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(meeting.startAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function LatestSubmissionCard({
  submission,
  projectId,
}: {
  submission: LatestSubmissionInfo | null
  projectId: string | null
}) {
  const href = projectId
    ? `/projects/${projectId}?tab=${submission?.kind === "document" ? "documents" : "proposal"}`
    : "/projects"
  const Icon = submission?.kind === "proposal" ? FileText : ClipboardCheck

  return (
    <Card className="glass shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardCheck className="size-4 text-primary" />
          Latest submission
        </CardTitle>
        <CardDescription>Most recent item sent for review.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {submission ? (
          <Link
            href={href}
            className="group block rounded-lg border bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{submission.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {submission.kind === "proposal" ? "Proposal" : "Document"} · v
                    {submission.version} · {formatRelative(submission.submittedAt)}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div className="mt-2.5">
              <StatusBadge status={submission.status} />
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm font-medium">Nothing submitted yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {projectId
                ? "Submit your proposal from the project page to get reviewed."
                : "Create a project first, then submit your proposal."}
            </p>
            <Button render={<Link href={href} />} size="sm" variant="outline" className="mt-3">
              {projectId ? "Go to project" : "Create project"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------ Student ------------------------------ */

function MilestoneRow({ milestone }: { milestone: MilestoneInfo }) {
  const Icon =
    milestone.status === "completed"
      ? CheckCircle2
      : milestone.status === "in_progress"
        ? CircleDotDashed
        : Circle
  return (
    <li className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
      <Icon
        className={cn(
          "size-4 shrink-0",
          milestone.status === "completed" && "text-success",
          milestone.status === "in_progress" && "text-warning",
          milestone.status === "pending" && "text-muted-foreground/50"
        )}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          milestone.status === "completed" &&
            "text-muted-foreground line-through decoration-border"
        )}
      >
        {milestone.title}
      </span>
      {milestone.dueDate ? (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatRelative(milestone.dueDate)}
        </span>
      ) : null}
    </li>
  )
}

async function StudentDashboard({ userId, name }: { userId: string; name: string }) {
  const data = await getStudentDashboard(userId)
  const activity = await getProjectActivity(data.project?.id ?? "", 6, { id: userId, role: "student" })
  const doneMilestones = data.milestones.filter((m) => m.status === "completed").length
  const overdueMilestones = data.milestones.filter(
    (m) => m.status !== "completed" && m.dueDate && new Date(m.dueDate) < new Date()
  ).length

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(" ")[0]}`}
        description="Your project at a glance."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={TrendingUp}
          label="Project progress"
          value={`${data.project?.progressPercent ?? 0}%`}
          hint={data.project ? "Active project" : "No project"}
          tone={data.project ? "primary" : "default"}
          href={data.project ? `/projects/${data.project.id}` : "/projects"}
        />
        <StatCard
          icon={CircleDotDashed}
          label="Milestones done"
          value={`${doneMilestones}/${data.milestones.length}`}
          tone="default"
          href={
            data.project
              ? `/projects/${data.project.id}?tab=milestones`
              : "/projects"
          }
        />
        <StatCard
          icon={ClipboardCheck}
          label="Open feedback"
          value={data.unresolvedFeedback}
          tone={data.unresolvedFeedback > 0 ? "warning" : "success"}
          href={
            data.project
              ? `/projects/${data.project.id}?tab=feedback`
              : "/projects"
          }
        />
        <StatCard
          icon={MessagesSquare}
          label="Unread messages"
          value={data.unreadMessages}
          tone={data.unreadMessages > 0 ? "primary" : "default"}
          href="/messages"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming meetings"
          value={data.upcomingMeetings.length}
          tone="default"
          href="/meetings"
        />
        <StatCard
          icon={Tags}
          label="Notifications"
          value={data.unreadNotifications}
          tone={data.unreadNotifications > 0 ? "primary" : "default"}
          href="/notifications"
        />
      </div>

      {data.project ? (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Project overview */}
            <Card className="glass shadow-none lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardDescription>Active project</CardDescription>
                    <CardTitle className="mt-0.5 leading-snug">{data.project.title}</CardTitle>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={data.project.status} />
                    <Link
                      href={`/projects/${data.project.id}`}
                      className="inline-flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Open project
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {data.project.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Tags className="size-3.5" /> {data.project.category}
                    </span>
                  ) : null}
                  {data.project.supervisorName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="size-3.5" /> {data.project.supervisorName}
                    </span>
                  ) : null}
                  <HealthBadge score={data.project.healthScore} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums">{data.project.progressPercent}%</span>
                  </div>
                  <Progress value={data.project.progressPercent} />
                </div>

                {data.milestones.length > 0 ? (
                  <div>
                    <Separator className="mb-3" />
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Milestones · {doneMilestones}/{data.milestones.length} done
                      </p>
                    </div>
                    <ul className="max-h-44 overflow-y-auto pr-1">
                      {data.milestones.map((milestone) => (
                        <MilestoneRow key={milestone.id} milestone={milestone} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Side column */}
            <div className="flex flex-col gap-4">
              {/* Health detail card */}
              <Card className="glass shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <HeartPulse className="size-4 text-primary" />
                    Project health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="relative size-14">
                      <svg className="size-14 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-muted/50"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${data.project.healthScore}, 100`}
                          className={
                            data.project.healthScore >= 75
                              ? "text-success"
                              : data.project.healthScore >= 50
                                ? "text-warning"
                                : "text-destructive"
                          }
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
                        {data.project.healthScore}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {data.project.healthScore >= 75
                          ? "ON TRACK"
                          : data.project.healthScore >= 50
                            ? "NEEDS ATTENTION"
                            : "AT RISK"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doneMilestones}/{data.milestones.length} milestones
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border bg-muted/30 px-2.5 py-1.5">
                      <p className="text-muted-foreground">Pending reviews</p>
                      <p className="font-medium tabular-nums">{data.unresolvedFeedback}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-2.5 py-1.5">
                      <p className="text-muted-foreground">Overdue</p>
                      <p className={cn("font-medium tabular-nums", overdueMilestones > 0 && "text-destructive")}>
                        {overdueMilestones}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <LatestSubmissionCard
                submission={data.latestSubmission}
                projectId={data.project.id}
              />
              <MeetingsCard meetings={data.upcomingMeetings} viewAllHref="/meetings" />
            </div>
          </div>

          {/* Bottom row: Quick actions + Activity feed */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Quick actions */}
            <Card className="glass shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="size-4 text-primary" />
                  Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Link
                  href={`/projects/${data.project.id}?tab=documents`}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <Upload className="size-4 text-primary" />
                  Submit document
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <MessagesSquare className="size-4 text-primary" />
                  Message supervisor
                </Link>
                <Link
                  href="/resources"
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <FileText className="size-4 text-primary" />
                  Upload resource
                </Link>
                <Link
                  href={`/projects/${data.project.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <FolderKanban className="size-4 text-primary" />
                  View project
                </Link>
              </CardContent>
            </Card>

            {/* Activity feed */}
            <Card className="glass shadow-none lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    Recent activity
                  </span>
                  {data.project ? (
                    <Link
                      href={`/projects/${data.project.id}?tab=overview`}
                      className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground"
                    >
                      View all
                      <ArrowUpRight className="size-3" />
                    </Link>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {activity.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No activity yet — start by submitting your proposal.
                  </p>
                ) : (
                  <ActivityFeed items={activity} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <EmptyState
            icon={FolderKanban}
            title="No active project yet"
            description="Create your project to start submitting proposals and tracking progress."
            actionLabel="Create project"
            actionHref="/projects"
            className="md:col-span-2 xl:col-span-1"
          />
          <LatestSubmissionCard submission={null} projectId={null} />
          <MeetingsCard meetings={[]} title="Meetings" viewAllHref="/meetings" />
        </div>
      )}
    </>
  )
}

/* ----------------------------- Supervisor ----------------------------- */

function PendingReviewRow({ item }: { item: PendingReviewItem }) {
  const href = `/projects/${item.projectId}?tab=${item.kind === "proposal" ? "proposal" : "documents"}`
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <Link href={href} className="group flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
          <ClipboardCheck className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {item.label} · <span className="font-normal text-muted-foreground">{item.projectTitle}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">by {item.studentName}</p>
        </div>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(item.submittedAt)}</span>
      </Link>
    </li>
  )
}

async function SupervisorDashboard({ userId, name }: { userId: string; name: string }) {
  const [data, activity] = await Promise.all([
    getSupervisorDashboard(userId),
    getSupervisorActivity(userId, 8),
  ])

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(" ")[0]}`}
        description="Everything happening across your students."
      >
        <Button size="sm" render={<Link href="/meetings" />}>
          <CalendarDays className="size-4" />
          Schedule meeting
        </Button>
      </PageHeader>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={GraduationCap}
          label="Assigned students"
          value={data.assignedStudents}
          hint={`avg progress ${data.avgProgress}%`}
          tone="primary"
          href="/students"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending reviews"
          value={data.pendingReviewCount}
          tone={data.pendingReviewCount > 0 ? "warning" : "success"}
          href="/reviews"
        />
        <StatCard
          icon={MessagesSquare}
          label="Unread messages"
          value={data.unreadMessages}
          tone={data.unreadMessages > 0 ? "primary" : "default"}
          href="/messages"
        />
        <StatCard
          icon={Bell}
          label="Notifications"
          value={data.unreadNotifications}
          tone={data.unreadNotifications > 0 ? "primary" : "default"}
          href="/notifications"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming meetings"
          value={data.upcomingMeetings.length}
          tone="default"
          href="/meetings"
        />
        <StatCard
          icon={AlertTriangle}
          label="At-risk projects"
          value={data.atRiskProjects.length}
          tone={data.atRiskProjects.length > 0 ? "destructive" : "success"}
          href="/projects"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass shadow-none lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="size-4 text-primary" />
              Awaiting your review
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={data.pendingReviewCount > 0 ? "warning" : "secondary"}>
                {data.pendingReviewCount}
              </Badge>
              <Link
                href="/reviews"
                className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground"
              >
                Queue
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.pendingReviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                All caught up — nothing waiting for review.
              </p>
            ) : (
              <ScrollArea className="max-h-72 pr-2">
                <ul className="divide-y divide-border/60">
                  {data.pendingReviews.map((item) => (
                    <PendingReviewRow key={`${item.kind}-${item.id}`} item={item} />
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <MeetingsCard meetings={data.upcomingMeetings} viewAllHref="/meetings" />
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="size-4 text-primary" />
                Cohort averages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Avg progress</span>
                  <span className="tabular-nums">{data.avgProgress}%</span>
                </div>
                <Progress value={data.avgProgress} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Avg health</span>
                  <span className="tabular-nums">{data.avgHealth}</span>
                </div>
                <Progress value={data.avgHealth} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Send className="size-4 text-primary" />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/reviews" />}>
              <ClipboardCheck className="size-4" />
              Review submissions
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/students" />}>
              <GraduationCap className="size-4" />
              View students
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/projects" />}>
              <FolderKanban className="size-4" />
              Browse projects
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/messages" />}>
              <MessagesSquare className="size-4" />
              Send a message
            </Button>
          </CardContent>
        </Card>

        <Card className="glass shadow-none lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="size-4 text-primary" />
              Recent activity
            </CardTitle>
            <Link
              href="/projects"
              className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              All projects
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No activity recorded yet across your students.
              </p>
            ) : (
              <ActivityFeed items={activity} />
            )}
          </CardContent>
        </Card>
      </div>

      {data.atRiskProjects.length > 0 ? (
        <Card className="glass mt-4 border-destructive/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              Needs attention
            </CardTitle>
            <CardDescription>Projects with a health score below 60.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.atRiskProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 transition-colors hover:border-destructive/40"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-destructive/15 text-[0.625rem] font-semibold text-destructive">
                        {project.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {project.studentName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{project.title}</p>
                    </div>
                    <HealthBadge score={project.healthScore} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}

/* -------------------------------- Admin -------------------------------- */

async function AdminDashboard({ userId, name }: { userId: string; name: string }) {
  const data = await getAdminDashboard(userId)

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(" ")[0]}`}
        description="Institution-wide snapshot."
      >
        <Button size="sm" render={<Link href="/admin/departments" />}>
          <Building2 className="size-4" />
          Manage departments
        </Button>
      </PageHeader>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Total users" value={data.totalUsers} hint={`${data.usersByRole.student ?? 0} students`} tone="primary" href="/students" />
        <StatCard icon={FolderKanban} label="Projects" value={data.totalProjects} hint={`avg health ${data.avgHealth}`} href="/projects" />
        <StatCard icon={ClipboardCheck} label="Pending reviews" value={data.pendingReviewCount} tone={data.pendingReviewCount > 0 ? "warning" : "success"} href="/reviews" />
        <StatCard icon={MessagesSquare} label="Unread messages" value={data.unreadMessages} tone={data.unreadMessages > 0 ? "primary" : "default"} href="/messages" />
        <StatCard icon={Building2} label="Departments" value={data.departments} href="/admin/departments" />
        <StatCard icon={Tags} label="Categories" value={data.categories} href="/admin/categories" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="size-4 text-primary" />
              People
            </CardTitle>
            <CardDescription>Registered accounts by role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-3">
            <Link href="/students" className="group rounded-xl border bg-card/50 p-4 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
              <p className="text-2xl font-semibold tabular-nums group-hover:text-primary">{data.usersByRole.student ?? 0}</p>
              <Badge variant="secondary" className="mt-1">Students</Badge>
            </Link>
            <Link href="/supervisors" className="group rounded-xl border bg-card/50 p-4 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
              <p className="text-2xl font-semibold tabular-nums group-hover:text-primary">{data.usersByRole.supervisor ?? 0}</p>
              <Badge variant="secondary" className="mt-1">Supervisors</Badge>
            </Link>
            <div className="rounded-xl border bg-card/50 p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">{data.usersByRole.admin ?? 0}</p>
              <Badge variant="secondary" className="mt-1">Admins</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="size-4 text-primary" />
              Projects by status
            </CardTitle>
            <CardDescription>{data.totalProjects} total across the institution.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {data.totalProjects === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {Object.entries(data.projectsByStatus)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([status, count]) => (
                    <li key={status} className="flex items-center gap-3">
                      <StatusBadge status={status} />
                      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((count / data.totalProjects) * 100)}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="size-4 text-primary" />
                Quick actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/students" />}>
                <GraduationCap className="size-4" />
                Manage students
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/supervisors" />}>
                <Shield className="size-4" />
                Manage supervisors
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/admin/categories" />}>
                <Tags className="size-4" />
                Manage categories
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" render={<Link href="/reviews" />}>
                <ClipboardCheck className="size-4" />
                Review submissions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass mt-4 shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="size-4 text-primary" />
            Recent activity
          </CardTitle>
          <CardDescription>The latest events across all projects.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {data.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <ActivityFeed items={data.recentActivity} />
          )}
        </CardContent>
      </Card>
    </>
  )
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-[0.625rem] font-semibold text-primary">
              {(item.actorName ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <p className="min-w-0 flex-1 truncate text-sm">
            {item.summary}
            {item.actorName ? (
              <span className="text-muted-foreground"> · {item.actorName}</span>
            ) : null}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelative(item.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default async function DashboardPage() {
  const session = await requireUser()
  const role = session.user.role as UserRole

  if (role === "admin") return <AdminDashboard userId={session.user.id} name={session.user.name} />
  if (role === "supervisor")
    return <SupervisorDashboard userId={session.user.id} name={session.user.name} />
  return <StudentDashboard userId={session.user.id} name={session.user.name} />
}
