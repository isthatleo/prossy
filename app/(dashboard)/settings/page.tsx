import { Settings } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Settings" }

export default function settingsPage() {
  return (
    <ModuleScaffold
      title="Settings"
      description="Your account preferences."
      icon={Settings}
      moduleName="Settings"
    />
  )
}
