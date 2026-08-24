import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, ScrollText } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { requireUser } from "@/lib/auth/guards"
import { formatRelative } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { listReviewQueue } from "@/services/reviews"

export const metadata = { title: "Reviews" }

const PROPOSAL_BADGE: Record<string, "secondary" | "warning"> = {
  submitted: "secondary",
  under_review: "warning",
}

export default async function ReviewsPage() {
  const session = await requireUser()
  const role = session.user.role as UserRole
  if (role === "student") redirect("/dashboard")

  const queue = await listReviewQueue(session.user.id, role)
  const total = queue.proposals.length + queue.documents.length

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Review queue"
        description={
          total === 0
            ? "Nothing waiting on you right now."
            : `${total} item${total === 1 ? "" : "s"} waiting for your review.`
        }
      />

      {/* Proposals */}
      <section className="mt-6">
        <h2 className="flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-muted-foreground">
          <ScrollText className="size-3.5" /> Proposals ({queue.proposals.length})
        </h2>
        <div className="mt-3">
          {queue.proposals.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No proposals to review"
              description="New student proposals will land here."
            />
          ) : (
            queue.proposals.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.projectId}?tab=proposal`}
                className="glass mb-2 block rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{item.projectTitle}</span>
                  <Badge variant="outline">v{item.version}</Badge>
                  <Badge variant={PROPOSAL_BADGE[item.status] ?? "secondary"}>
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.studentName} · submitted {formatRelative(item.submittedAt)}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Documents */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-muted-foreground">
          <FileText className="size-3.5" /> Documents ({queue.documents.length})
        </h2>
        <div className="mt-3">
          {queue.documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents to review"
              description="Chapter and report submissions will appear here."
            />
          ) : (
            queue.documents.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.projectId}?tab=documents`}
                className="glass mb-2 block rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{item.projectTitle}</span>
                  <Badge variant="secondary">{item.type.replace(/_/g, " ")}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.studentName} · submitted {formatRelative(item.submittedAt)}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
