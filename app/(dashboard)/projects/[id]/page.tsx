import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  FileStack,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  MessageSquareQuote,
  Pencil,
  ScrollText,
  Target,
} from "lucide-react"

import { DocumentsPanel } from "@/components/proposals/documents-panel"
import { ProposalsPanel } from "@/components/proposals/proposals-panel"
import { MilestonesPanel } from "@/components/milestones/milestones-panel"
import { FeedbackPanel } from "@/components/feedback/feedback-panel"
import { ProjectActions } from "@/components/projects/project-actions"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { requireUser } from "@/lib/auth/guards"
import { formatDate, formatRelative } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { cn } from "@/lib/utils"
import {
  allowedActions,
  getProjectActivity,
  getProjectDetail,
} from "@/services/projects"

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "milestones", label: "Milestones", icon: ListChecks },
  { key: "proposal", label: "Proposal", icon: ScrollText },
  { key: "documents", label: "Documents", icon: FileStack },
  { key: "feedback", label: "Feedback", icon: MessageSquareQuote },
] as const

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams])
  const activeTab = TABS.some((t) => t.key === tab) ? tab! : "overview"
  const session = await requireUser()
  const role = session.user.role as UserRole

  const project = await getProjectDetail(id, { id: session.user.id, role })
  if (!project) notFound()

  const isStudentOwner =
    role === "student" && project.student.id === session.user.id
  const activity =
    activeTab === "overview" ? await getProjectActivity(project.id) : []
  const actions = allowedActions(
    {
      status: project.status,
      studentId: project.student.id,
      supervisorId: project.supervisor?.id ?? null,
    },
    { id: session.user.id, role }
  )

  const canEdit =
    role === "admin" ||
    (project.student.id === session.user.id &&
      ["draft", "revision_required"].includes(project.status))

  function initials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      <div className="mt-3">
        <PageHeader
          title={project.title}
          description={`Created ${formatRelative(project.createdAt)} · updated ${formatRelative(project.updatedAt)}`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
        {project.categoryName ? <Badge variant="outline">{project.categoryName}</Badge> : null}
        <Badge variant={project.healthScore >= 75 ? "success" : project.healthScore >= 50 ? "warning" : "destructive"}>
          <HeartPulse data-icon="inline-start" />
          Health {project.healthScore}
        </Badge>
        {actions.length > 0 || canEdit ? <Separator orientation="vertical" className="h-5!" /> : null}
        {canEdit ? (
          <Badge variant="secondary" render={<Link href={`/projects/${project.id}/edit`} />}>
            <Pencil data-icon="inline-start" />
            Edit details
          </Badge>
        ) : null}
        <ProjectActions projectId={project.id} actions={actions} />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 rounded-lg border border-border/70 bg-muted/30 p-1 backdrop-blur-sm">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = key === activeTab
          return (
            <Link
              key={key}
              href={`/projects/${project.id}?tab=${key}`}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="mt-4">
        {activeTab === "proposal" ? (
          <ProposalsPanel
            projectId={project.id}
            isStudentOwner={isStudentOwner}
            role={role}
            projectStatus={project.status}
          />
        ) : activeTab === "documents" ? (
          <DocumentsPanel
            projectId={project.id}
            viewerId={session.user.id}
            role={role}
            projectStatus={project.status}
          />
        ) : activeTab === "milestones" ? (
          <MilestonesPanel
            projectId={project.id}
            role={role}
            viewerId={session.user.id}
            supervisorId={project.supervisor?.id ?? null}
          />
        ) : activeTab === "feedback" ? (
          <FeedbackPanel
            projectId={project.id}
            role={role}
            viewerId={session.user.id}
            studentId={project.student.id}
            supervisorId={project.supervisor?.id ?? null}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {[
            ["Description", project.description],
            ["Problem statement", project.problemStatement],
            ["Objectives", project.objectives],
            ["Methodology", project.methodology],
          ].map(([label, value]) =>
            value ? (
              <Card key={label} className="glass shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="size-4 text-primary" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
                    {value}
                  </p>
                </CardContent>
              </Card>
            ) : null
          )}

          {/* Activity timeline */}
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activity</CardTitle>
              <CardDescription>Everything that happened on this project.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ol className="relative flex flex-col gap-0 border-l border-border/60 pl-5">
                  {activity.map((entry) => (
                    <li key={entry.id} className="relative py-2.5">
                      <span className="absolute -left-[1.5625rem] top-4 size-2 rounded-full bg-primary/70 ring-4 ring-primary/10" />
                      <p className="text-sm leading-6">
                        {entry.summary}
                        {entry.actorName ? (
                          <span className="text-muted-foreground"> · {entry.actorName}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatRelative(entry.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-4">
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">People</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <PersonRow
                icon={<GraduationCap className="size-3.5" />}
                role="Student"
                name={project.student.name}
                email={project.student.email}
                initials={initials(project.student.name)}
              />
              <Separator />
              {project.supervisor ? (
                <PersonRow
                  icon={<GraduationCap className="size-3.5" />}
                  role="Supervisor"
                  name={project.supervisor.name}
                  email={project.supervisor.email}
                  initials={initials(project.supervisor.name)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No supervisor assigned yet — one will be assigned when your
                  topic is approved.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completion</span>
                  <span className="tabular-nums">{project.progressPercent}%</span>
                </div>
                <Progress value={project.progressPercent} />
              </div>
              <Separator />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Start
                </dt>
                <dd>{formatDate(project.startDate)}</dd>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Target end
                </dt>
                <dd>{formatDate(project.expectedEndDate)}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
          </div>
        )}
      </div>
    </>
  )
}

function PersonRow({
  icon,
  role,
  name,
  email,
  initials,
}: {
  icon: React.ReactNode
  role: string
  name: string
  email: string
  initials: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <Badge variant="secondary" className="gap-1 capitalize">
        {icon}
        {role}
      </Badge>
    </div>
  )
}
