import { Download, FileText } from "lucide-react"

import { DocumentForm } from "@/components/proposals/submission-forms"
import { SubmissionReviewButtons } from "@/components/proposals/submission-review"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatRelative } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import {
  listSubmissions,
  studentCanSubmitDocuments,
  submissionReviewActions,
} from "@/services/submissions"

const SUBMISSION_STATUS_VARIANT: Record<string, "secondary" | "outline" | "warning" | "success" | "destructive"> = {
  submitted: "secondary",
  under_review: "warning",
  approved: "success",
  revision_required: "destructive",
}

export async function DocumentsPanel({
  projectId,
  viewerId,
  role,
  projectStatus,
}: {
  projectId: string
  viewerId: string
  role: UserRole
  projectStatus: string
}) {
  const submissions = await listSubmissions(projectId)
  const isOwner = role === "student" // caller already verified ownership context
  void viewerId
  const canSubmit = isOwner && studentCanSubmitDocuments(projectStatus)
  const canReview = role === "admin" || role === "supervisor"

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        {submissions.length === 0 ? (
          <Card className="glass shadow-none">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No documents submitted yet. Chapters, progress reports and the
              final report will appear here.
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="glass shadow-none">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm capitalize">
                    {submission.type.replace(/_/g, " ")}
                  </CardTitle>
                  <Badge variant="secondary">v{submission.version}</Badge>
                  <Badge variant={SUBMISSION_STATUS_VARIANT[submission.status] ?? "secondary"}>
                    {submission.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardDescription>
                  by {submission.submitter?.name ?? "student"} ·{" "}
                  {formatRelative(submission.submittedAt)}
                  {submission.reviewer
                    ? ` · reviewed by ${submission.reviewer.name}`
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {submission.description ? (
                  <p className="text-sm text-muted-foreground">{submission.description}</p>
                ) : null}
                {submission.reviewNotes ? (
                  <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Review note:</span>{" "}
                    {submission.reviewNotes}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {submission.file ? (
                    <Button size="sm" variant="ghost" render={<a href={`/api/files/${submission.file.id}`} />}>
                      <Download data-icon="inline-start" />
                      {submission.file.fileName}
                      <span className="text-xs text-muted-foreground">
                        ({Math.max(1, Math.round(submission.file.sizeBytes / 1024))} KB)
                      </span>
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="size-4" /> attachment missing
                    </span>
                  )}
                  {canReview ? (
                    <SubmissionReviewButtons
                      projectId={projectId}
                      kind="submission"
                      targetId={submission.id}
                      decisions={submissionReviewActions(submission.status)}
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div>
        {canSubmit ? (
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Submit a document</CardTitle>
              <CardDescription>
                Chapters, progress reports, draft or final report. Submitting the
                final report moves your project into its final phase.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <DocumentForm projectId={projectId} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
