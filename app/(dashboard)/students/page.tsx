import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"

import { UserActiveToggle } from "@/components/admin/user-active-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/guards"
import type { UserRole } from "@/lib/rbac"
import { listStudentDirectory } from "@/services/directory"

export const metadata = { title: "Students" }

export default async function StudentsPage() {
  const session = await requireUser()
  const role = session.user.role as UserRole
  if (role === "student") redirect("/dashboard")

  const students = await listStudentDirectory()

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Students"
        description={`${students.length} active student${students.length === 1 ? "" : "s"} in the system.`}
      />

      <div className="mt-6">
        {students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            description="Student accounts appear here once created."
          />
        ) : (
          <Card className="glass py-0 shadow-none">
            <CardContent className="px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Reg. number</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Department</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Year</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    {role === "admin" ? (
                      <th className="px-4 py-3 text-right font-medium">Active</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className={`border-b border-border/50 transition-colors last:border-b-0 hover:bg-muted/30 ${student.isActive ? "" : "opacity-50"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs tabular-nums md:table-cell">
                        {student.registrationNumber ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {student.departmentName ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                        {student.yearOfStudy ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {student.activeProjectTitle ? (
                          <div className="space-y-1">
                            <p className="max-w-56 truncate">{student.activeProjectTitle}</p>
                            <StatusBadge status={student.activeProjectStatus!} />
                          </div>
                        ) : (
                          <Badge variant="secondary">No active project</Badge>
                        )}
                      </td>
                      {role === "admin" ? (
                        <td className={`px-4 py-3 text-right ${student.isActive ? "" : "opacity-60"}`}>
                          <UserActiveToggle
                            userId={student.id}
                            userName={student.name}
                            isActive={student.isActive}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
