import { MessageSquareQuote } from "lucide-react"

import {
  FeedbackComposer,
  ResolveFeedbackButton,
} from "@/components/feedback/feedback-ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatRelative } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { listProjectFeedback } from "@/services/feedback"
import type { Viewer } from "@/services/milestones"

export async function FeedbackPanel({
  projectId,
  viewerId,
  viewerRole,
  studentId,
  supervisorId,
}: {
  projectId: string
  viewerId: string
  viewerRole: UserRole
  studentId: string
  supervisorId: string | null
}) {
  const viewer: Viewer = { id: viewerId, role: viewerRole }
  const items = await listProjectFeedback(projectId, viewer)

  // Who can the viewer send feedback to? The counterpart(s) on this project.
  const recipients: Array<{ id: string; name: string; role: string }> = []
  if (viewerId !== studentId) {
    // Non-students give feedback to the student.
    recipients.push({ id: studentId, name: "Student", role: "student" })
  }
  if (supervisorId && viewerId !== supervisorId) {
    recipients.push({ id: supervisorId, name: "Supervisor", role: "supervisor" })
  }

  const unresolved = items.filter((item) => !item.isResolved).length

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass shadow-none lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquareQuote className="size-4 text-primary" />
            Feedback thread
          </CardTitle>
          <CardDescription>
            {items.length === 0
              ? "No feedback yet."
              : `${unresolved} open · ${items.length - unresolved} resolved`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Feedback exchanged between you and your counterpart appears here.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-lg border px-4 py-3 ${
                    item.isResolved
                      ? "border-border/50 opacity-70"
                      : item.recipientId === viewerId
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="font-medium">{item.authorName ?? "Member"}</span>
                    <span className="text-muted-foreground">→ {item.recipientName ?? "Member"}</span>
                    <span className="text-muted-foreground/60">
                      · {formatRelative(item.createdAt)}
                    </span>
                    {item.isResolved ? (
                      <Badge variant="success">Resolved</Badge>
                    ) : item.recipientId === viewerId ? (
                      <Badge variant="warning">Needs your attention</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-6 whitespace-pre-line">
                    {item.content}
                  </p>
                  {!item.isResolved && item.recipientId === viewerId ? (
                    <div className="mt-2.5">
                      <ResolveFeedbackButton projectId={projectId} feedbackId={item.id} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        {recipients.length > 0 ? (
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Give feedback</CardTitle>
              <CardDescription>
                Structured notes tied to this project — the recipient is asked to
                resolve them.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <FeedbackComposer projectId={projectId} recipients={recipients} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
