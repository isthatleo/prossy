import { pgEnum } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "supervisor",
  "admin",
])

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "topic_submitted",
  "proposal_submitted",
  "under_review",
  "revision_required",
  "approved",
  "in_progress",
  "final_submission",
  "completed",
  "rejected",
])

export const submissionTypeEnum = pgEnum("submission_type", [
  "chapter_1",
  "chapter_2",
  "chapter_3",
  "chapter_4",
  "progress_report",
  "draft_report",
  "final_report",
  "other",
])

export const submissionStatusEnum = pgEnum("submission_status", [
  "submitted",
  "under_review",
  "approved",
  "revision_required",
])

export const proposalStatusEnum = pgEnum("proposal_status", [
  "submitted",
  "under_review",
  "approved",
  "revision_required",
  "rejected",
])

export const resourceCategoryEnum = pgEnum("resource_category", [
  "research",
  "reference",
  "meeting",
  "guideline",
  "project_document",
  "other",
])

export const resourceVisibilityEnum = pgEnum("resource_visibility", [
  "private",
  "project",
  "everyone",
])

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "completed",
  "cancelled",
])

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "pending",
  "in_progress",
  "completed",
])

export const notificationTypeEnum = pgEnum("notification_type", [
  "message",
  "proposal_reviewed",
  "document_reviewed",
  "feedback_added",
  "meeting_scheduled",
  "deadline_approaching",
  "milestone_overdue",
  "project_status_changed",
  "system",
])
