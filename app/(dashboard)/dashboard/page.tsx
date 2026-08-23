import Link from "next/link"
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  FolderKanban,
  GraduationCap,
  MessagesSquare,
  Tags,
  Users,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { cn } from "@/lib/utils"

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function TileLink({
  href,
  icon: Icon,
  title,
  description,
  className,
}: {
  href: string
  icon: typeof FolderKanban
  title: string
  description: string
  className?: string
}) {
  return (
    <Link href={href} className={cn("group", className)}>
      <Card className="glass tile-hover h-full shadow-none">
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <Icon className="size-4" />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

function StudentDashboard({ name }: { name: string }) {
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(" ")[0]}`}
        description="Your project at a glance."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <EmptyState
          icon={FolderKanban}
          title="No project yet"
          description="Create your project to start submitting proposals and tracking progress."
          actionLabel="Create project"
          actionHref="/projects"
        />
        <TileLink
          href="/messages"
          icon={MessagesSquare}
          title="Messages"
          description="Chat with your supervisor and classmates."
        />
        <TileLink
          href="/meetings"
          icon={CalendarDays}
          title="Meetings"
          description="Upcoming supervision sessions."
        />
        <TileLink
          href="/resources"
          icon={BookOpen}
          title="Resources"
          description="Notes, references and project files."
        />
        <TileLink
          href="/notifications"
          icon={Tags}
          title="Notifications"
          description="Feedback, deadlines and approvals."
        />
      </div>
    </>
  )
}

function SupervisorDashboard({ name }: { name: string }) {
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(" ")[0]}`}
        description="Supervision overview."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TileLink
          href="/students"
          icon={GraduationCap}
          title="My Students"
          description="Assigned students and their progress."
        />
        <TileLink
          href="/reviews"
          icon={Tags}
          title="Pending Reviews"
          description="Proposals and documents awaiting your review."
        />
        <TileLink
          href="/meetings"
          icon={CalendarDays}
          title="Meetings"
          description="Schedule and manage supervision sessions."
        />
        <TileLink
          href="/messages"
          icon={MessagesSquare}
          title="Messages"
          description="Conversations with students and staff."
        />
        <TileLink
          href="/resources"
          icon={BookOpen}
          title="Resources"
          description="Share references and guidelines."
        />
        <TileLink
          href="/reports"
          icon={BarChart3}
          title="Reports"
          description="Supervision workload and outcomes."
        />
      </div>
    </>
  )
}

function AdminDashboard({ name }: { name: string }) {
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(" ")[0]}`}
        description="System administration overview."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TileLink
          href="/students"
          icon={GraduationCap}
          title="Students"
          description="Manage student records."
        />
        <TileLink
          href="/supervisors"
          icon={Users}
          title="Supervisors"
          description="Manage supervisors and assignments."
        />
        <TileLink
          href="/projects"
          icon={FolderKanban}
          title="Projects"
          description="All projects across the institution."
        />
        <TileLink
          href="/admin/departments"
          icon={Building2}
          title="Departments"
          description="Departments and academic units."
        />
        <TileLink
          href="/admin/categories"
          icon={Tags}
          title="Categories"
          description="Project category taxonomy."
        />
        <TileLink
          href="/reports"
          icon={BarChart3}
          title="Analytics"
          description="Institution-wide insights."
        />
      </div>
    </>
  )
}

export default async function DashboardPage() {
  const session = await requireUser()
  const role = session.user.role as UserRole

  if (role === "admin") return <AdminDashboard name={session.user.name} />
  if (role === "supervisor")
    return <SupervisorDashboard name={session.user.name} />
  return <StudentDashboard name={session.user.name} />
}
