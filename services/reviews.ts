import { and, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import {
  documentSubmissions,
  proposals,
  projects,
  users,
} from "@/db/schema"
import type { UserRole } from "@/lib/rbac"

export interface ProposalReviewItem {
  kind: "proposal"
  id: string
  projectId: string
  projectTitle: string
  studentName: string | null
  version: number
  status: string
  submittedAt: Date
}

export interface DocumentReviewItem {
  kind: "document"
  id: string
  projectId: string
  projectTitle: string
  studentName: string | null
  type: string
  status: string
  submittedAt: Date
}

export interface ReviewQueue {
  proposals: ProposalReviewItem[]
  documents: DocumentReviewItem[]
}

const PROPOSAL_PENDING = ["submitted", "under_review"] as const

export async function listReviewQueue(
  viewerId: string,
  role: UserRole
): Promise<ReviewQueue> {
  const scope =
    role === "admin"
      ? undefined
      : eq(projects.supervisorId, viewerId)

  const proposalRows = await db
    .select({
      id: proposals.id,
      projectId: proposals.projectId,
      projectTitle: projects.title,
      studentName: users.name,
      version: proposals.version,
      status: proposals.status,
      submittedAt: proposals.submittedAt,
    })
    .from(proposals)
    .innerJoin(projects, eq(projects.id, proposals.projectId))
    .innerJoin(users, eq(users.id, projects.studentId))
    .where(
      scope
        ? and(scope, inArray(proposals.status, [...PROPOSAL_PENDING]))
        : inArray(proposals.status, [...PROPOSAL_PENDING])
    )
    .orderBy(desc(proposals.submittedAt))
    .limit(50)

  const documentRows = await db
    .select({
      id: documentSubmissions.id,
      projectId: documentSubmissions.projectId,
      projectTitle: projects.title,
      studentName: users.name,
      type: documentSubmissions.type,
      status: documentSubmissions.status,
      submittedAt: documentSubmissions.submittedAt,
    })
    .from(documentSubmissions)
    .innerJoin(projects, eq(projects.id, documentSubmissions.projectId))
    .innerJoin(users, eq(users.id, projects.studentId))
    .where(
      scope
        ? and(scope, eq(documentSubmissions.status, "submitted"))
        : eq(documentSubmissions.status, "submitted")
    )
    .orderBy(desc(documentSubmissions.submittedAt))
    .limit(50)

  return {
    proposals: proposalRows.map((row) => ({ ...row, kind: "proposal" as const })),
    documents: documentRows.map((row) => ({ ...row, kind: "document" as const })),
  }
}

/** Counts for the supervisor dashboard/reviews header. */
export async function reviewQueueCounts(
  viewerId: string,
  role: UserRole
): Promise<{ proposals: number; documents: number }> {
  const queue = await listReviewQueue(viewerId, role)
  return {
    proposals: queue.proposals.length,
    documents: queue.documents.length,
  }
}
