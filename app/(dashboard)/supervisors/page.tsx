import { redirect } from "next/navigation"
import { Building2, Mail, MapPin, Users } from "lucide-react"

import { UserActiveToggle } from "@/components/admin/user-active-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { listSupervisorDirectory } from "@/services/directory"

export const metadata = { title: "Supervisors" }

export default async function SupervisorsPage() {
  const session = await requireUser()
  const role = session.user.role as UserRole
  if (role !== "admin") redirect("/dashboard")

  const supervisors = await listSupervisorDirectory()

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Supervisors"
        description={`${supervisors.length} supervisor${supervisors.length === 1 ? "" : "s"} and their current supervision load.`}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {supervisors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No supervisors yet"
            description="Supervisor accounts appear here once created."
          />
        ) : (
          supervisors.map((supervisor) => {
            const atCapacity = supervisor.currentLoad >= supervisor.maxStudents
            const loadPct = Math.min(
              100,
              Math.round((supervisor.currentLoad / supervisor.maxStudents) * 100)
            )
            return (
              <Card
                key={supervisor.id}
                className={`glass shadow-none ${supervisor.isActive ? "" : "opacity-60"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">
                        {supervisor.title ? `${supervisor.title} ` : ""}
                        {supervisor.name}
                      </CardTitle>
                      <CardDescription className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" /> {supervisor.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3" /> {supervisor.departmentName ?? "—"}
                        </span>
                        {supervisor.officeLocation ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" /> {supervisor.officeLocation}
                          </span>
                        ) : null}
                      </CardDescription>
                    </div>
                    <Badge variant={atCapacity ? "destructive" : "success"}>
                      {supervisor.currentLoad}/{supervisor.maxStudents}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account active</span>
                    <UserActiveToggle
                      userId={supervisor.id}
                      userName={supervisor.name}
                      isActive={supervisor.isActive}
                    />
                  </div>
                  {supervisor.specialization ? (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Specialisation:</span>{" "}
                      {supervisor.specialization}
                    </p>
                  ) : null}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Supervision load</span>
                      <span>{loadPct}%</span>
                    </div>
                    <Progress value={loadPct} />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
