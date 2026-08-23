import { GraduationCap } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Students" }

export default function studentsPage() {
  return (
    <ModuleScaffold
      title="Students"
      description="Student records and supervision status."
      icon={GraduationCap}
      moduleName="Student management"
    />
  )
}
