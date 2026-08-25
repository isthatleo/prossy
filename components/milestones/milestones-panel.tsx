import { ListChecks } from "lucide-react"

import { MilestoneAddForm, MilestoneRow } from "@/components/milestones/milestone-ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { UserRole } from "@/lib/rbac"
import { listMilestones } from "@/services/milestones"
import type { Viewer } from "@/services/milestones"

export async function MilestonesPanel({
  projectId,
  role,
  viewerId,
  supervisorId,
}: {
  projectId: string
  role: UserRole
  viewerId: string
  supervisorId: string | null
}) {
  const viewer: Viewer = { id: viewerId, role }
  const milestones = await listMilestones(projectId, viewer)
  const canManage =
    role === "admin" || (supervisorId !== null && supervisorId === viewerId)
  const completed = milestones.filter((m) => m.status === "completed").length

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass shadow-none lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="size-4 text-primary" />
            Project plan
          </CardTitle>
          <CardDescription>
            {milestones.length === 0
              ? "No milestones yet."
              : `${completed} of ${milestones.length} complete — progress updates automatically.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {milestones.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {canManage
                ? "Add the first milestone to build the project plan."
                : "Your supervisor hasn't planned any milestones yet."}
            </p>
          ) : (
            <ul>
              {milestones.map((milestone) => (
                <MilestoneRow
                  key={milestone.id}
                  projectId={projectId}
                  milestoneId={milestone.id}
                  title={milestone.title}
                  description={milestone.description}
                  status={milestone.status}
                  dueDate={milestone.dueDate ? milestone.dueDate.toISOString() : null}
                  completedAt={
                    milestone.completedAt ? milestone.completedAt.toISOString() : null
                  }
                  canManage={canManage}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        {canManage ? (
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Add a milestone</CardTitle>
              <CardDescription>
                Break the work into checkable stages. Completing them moves the
                project&apos;s progress bar.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <MilestoneAddForm projectId={projectId} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
