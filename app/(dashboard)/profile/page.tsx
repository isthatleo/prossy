import { and, eq } from "drizzle-orm"
import {
  BookOpen,
  FileStack,
  ScrollText,
} from "lucide-react"

import { db } from "@/db"
import {
  documentSubmissions,
  projects,
  proposals,
  studentProfiles,
  supervisorProfiles,
} from "@/db/schema"
import { AvatarUpload } from "@/components/settings/avatar-upload"
import { ProfileNameForm } from "@/components/settings/profile-forms"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireUser } from "@/lib/auth/guards"
import { formatDate } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"

export const metadata = { title: "Profile" }

async function getRoleProfile(userId: string, role: UserRole) {
  if (role === "student") {
    return db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, userId),
      with: { department: { columns: { name: true } } },
    })
  }
  if (role === "supervisor") {
    return db.query.supervisorProfiles.findFirst({
      where: eq(supervisorProfiles.userId, userId),
      with: { department: { columns: { name: true } } },
    })
  }
  return null
}

export default async function ProfilePage() {
  const session = await requireUser()
  const user = session.user
  const role = user.role as UserRole

  const [roleProfile, projectCount, proposalCount, submissionCount] =
    await Promise.all([
      getRoleProfile(user.id, role),
      role === "admin"
        ? Promise.resolve(null)
        : db
            .select({ id: projects.id })
            .from(projects)
            .where(
              role === "student"
                ? eq(projects.studentId, user.id)
                : and(eq(projects.supervisorId, user.id))
            ),
      db
        .select({ id: proposals.id })
        .from(proposals)
        .where(eq(proposals.submittedBy, user.id)),
      db
        .select({ id: documentSubmissions.id })
        .from(documentSubmissions)
        .where(eq(documentSubmissions.submittedBy, user.id)),
    ])

  const details: Array<[string, string]> = [
    ["Email", user.email],
    ["Role", role],
    ["Member since", formatDate(user.createdAt ?? null)],
  ]
  if (roleProfile && "registrationNumber" in roleProfile) {
    details.push(
      ["Registration number", roleProfile.registrationNumber],
      ["Year of study", roleProfile.yearOfStudy?.toString() ?? "—"],
      ["Department", roleProfile.department?.name ?? "—"],
      ["Phone", roleProfile.phone ?? "—"]
    )
  }
  if (roleProfile && "staffNumber" in roleProfile) {
    details.push(
      ["Staff number", roleProfile.staffNumber],
      ["Title", roleProfile.title ?? "—"],
      ["Specialization", roleProfile.specialization ?? "—"],
      ["Department", roleProfile.department?.name ?? "—"],
      ["Office", roleProfile.officeLocation ?? "—"]
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Your profile"
        description="How you appear across Prossy."
      />

      <Card className="glass mt-6 shadow-none">
        <CardContent className="flex flex-col items-start gap-5 pt-6 sm:flex-row sm:items-center">
          <AvatarUpload name={user.name} image={user.image ?? null} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
            <p className="text-sm capitalize text-muted-foreground">{role}</p>
            {roleProfile && "specialization" in roleProfile && roleProfile.specialization ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {roleProfile.specialization}
              </p>
            ) : null}
          </div>
          {projectCount ? (
            <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
              <StatCard
                label="Projects"
                value={projectCount.length}
                icon={BookOpen}
              />
              <StatCard
                label="Proposals"
                value={proposalCount.length}
                icon={ScrollText}
              />
              <StatCard
                label="Documents"
                value={submissionCount.length}
                icon={FileStack}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass mt-4 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Details</CardTitle>
          <CardDescription>Basic information about your account.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 border-b border-border/40 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="glass mt-4 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Display name</CardTitle>
          <CardDescription>
            Shown in the sidebar, reviews, messages and notifications.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <ProfileNameForm currentName={user.name} />
        </CardContent>
      </Card>
    </div>
  )
}
