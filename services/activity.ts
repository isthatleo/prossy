import { db } from "@/db"
import { activityLogs } from "@/db/schema"

interface LogActivityInput {
  projectId: string | null
  actorId: string | null
  type: string
  summary: string
  metadata?: Record<string, unknown>
}

/** Fire-and-forget activity log write — failures must not break mutations. */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      projectId: input.projectId,
      actorId: input.actorId,
      type: input.type,
      summary: input.summary,
      metadata: input.metadata ?? null,
    })
  } catch (error) {
    console.error("[activity-log] failed:", error)
  }
}
