import { Download } from "lucide-react"

import { ProposalForm } from "@/components/proposals/submission-forms"
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
  listProposals,
  proposalReviewActions,
  studentCanSubmitProposals,
} from "@/services/submissions"
import type { Viewer } from "@/services/milestones"

const PROPOSAL_STATUS_VARIANT: Record<string, "secondary" | "outline" | "warning" | "success" | "destructive"> = {
  submitted: "secondary",
  under_review: "warning",
  approved: "success",
  revision_required: "destructive",
  rejected: "destructive",
}

export async function ProposalsPanel({
  projectId,
  viewerId,
  isStudentOwner,
  role,
  projectStatus,
}: {
  projectId: string
  viewerId: string
  isStudentOwner: boolean
  role: UserRole
  projectStatus: string
}) {
  const viewer: Viewer = { id: viewerId, role }
  const proposals = await listProposals(projectId, viewer)
  const canSubmit = isStudentOwner && studentCanSubmitProposals(projectStatus)
  const canReview = role === "admin" || role === "supervisor"

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        {proposals.length === 0 ? (
          <Card className="glass shadow-none">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No proposal submitted yet.
            </CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id} className="glass shadow-none">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm">{proposal.title}</CardTitle>
                  <Badge variant="secondary">v{proposal.version}</Badge>
                  <Badge variant={PROPOSAL_STATUS_VARIANT[proposal.status] ?? "secondary"}>
                    {proposal.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardDescription>
                  by {proposal.submitter?.name ?? "student"} ·{" "}
                  {formatRelative(proposal.submittedAt)}
                  {proposal.reviewer ? ` · reviewed by ${proposal.reviewer.name}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {[
                  ["Abstract", proposal.abstract],
                  ["Objectives", proposal.objectives],
                  ["Methodology", proposal.methodology],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <p className="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
                        {label}
                      </p>
                      <p className="mt-1 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                        {value}
                      </p>
                    </div>
                  ) : null
                )}
                {proposal.reviewNotes ? (
                  <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Review note:</span>{" "}
                    {proposal.reviewNotes}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {proposal.file ? (
                    <Button size="sm" variant="ghost" render={<a href={`/api/files/${proposal.file.id}`} />}>
                      <Download data-icon="inline-start" />
                      {proposal.file.fileName}
                      <span className="text-xs text-muted-foreground">
                        ({Math.max(1, Math.round(proposal.file.sizeBytes / 1024))} KB)
                      </span>
                    </Button>
                  ) : null}
                  {canReview ? (
                    <SubmissionReviewButtons
                      projectId={projectId}
                      kind="proposal"
                      targetId={proposal.id}
                      decisions={proposalReviewActions(proposal.status)}
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
              <CardTitle className="text-sm">Submit a proposal</CardTitle>
              <CardDescription>
                Each submission becomes a new version. Reviewers see the latest
                first and every version stays on record.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <ProposalForm projectId={projectId} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
