import { MessagesSquare } from "lucide-react"

import { ModuleScaffold } from "@/components/shared/module-scaffold"

export const metadata = { title: "Messages" }

export default function messagesPage() {
  return (
    <ModuleScaffold
      title="Messages"
      description="Direct conversations across the institution."
      icon={MessagesSquare}
      moduleName="Messaging"
    />
  )
}
