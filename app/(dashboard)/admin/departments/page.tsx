import { PageHeader } from "@/components/shared/page-header"
import { TaxonomyManager } from "@/components/admin/taxonomy-manager"
import { requireRole } from "@/lib/auth/guards"
import { listDepartmentsWithCounts } from "@/services/admin"

export const metadata = { title: "Departments" }

export default async function DepartmentsPage() {
  await requireRole("admin")
  const departments = await listDepartmentsWithCounts()

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Departments"
        description="Academic departments across the institution. Deleting a department unlinks profiles and projects."
      />
      <div className="mt-6">
        <TaxonomyManager
          kind="department"
          noun="Department"
          items={departments.map((department) => ({
            id: department.id,
            label: `${department.name} (${department.code})`,
            sublabel: `${department.students} student${department.students === 1 ? "" : "s"} · ${department.supervisors} supervisor${department.supervisors === 1 ? "" : "s"}`,
            count: department.projectCount,
          }))}
        />
      </div>
    </div>
  )
}
