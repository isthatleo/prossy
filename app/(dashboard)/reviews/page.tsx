import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, ScrollText } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
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

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireUser()
  const role = session.user.role as UserRole
  if (role === "student") redirect("/dashboard")

  const { q = "" } = await searchParams
  const queue = await listReviewQueue(session.user.id, role)

  const query = q.toLowerCase()
  const proposals = query
    ? queue.proposals.filter(
        (p) =>
          p.projectTitle.toLowerCase().includes(query) ||
          (p.studentName ?? "").toLowerCase().includes(query)
      )
    : queue.proposals
  const documents = query
    ? queue.documents.filter(
        (d) =>
          d.projectTitle.toLowerCase().includes(query) ||
          (d.studentName ?? "").toLowerCase().includes(query)
      )
    : queue.documents

  const total = proposals.length + documents.length

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Review queue"
        description={
          total === 0 && !q
            ? "Nothing waiting on you right now."
            : `${total} item${total === 1 ? "" : "s"} waiting for your review.`
        }
      >
        <SearchInput placeholder="Search by project or student…" />
      </PageHeader>

      {/* Proposals */}
      <section className="mt-6">
        <h2 className="flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-muted-foreground">
          <ScrollText className="size-3.5" /> Proposals ({proposals.length})
        </h2>
        <div className="mt-3">
          {proposals.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No proposals to review"
              description={q ? "Try a different search term." : "New student proposals will land here."}
            />
          ) : (
            proposals.map((item) => (
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
          <FileText className="size-3.5" /> Documents ({documents.length})
        </h2>
        <div className="mt-3">
          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents to review"
              description={q ? "Try a different search term." : "Chapter and report submissions will appear here."}
            />
          ) : (
            documents.map((item) => (
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
