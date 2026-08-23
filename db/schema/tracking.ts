import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import {
  milestoneStatusEnum,
  notificationTypeEnum,
} from "./enums"
import { users } from "./auth"
import { projects } from "./academics"
import { documentSubmissions, proposals } from "./submissions"
import { meetings } from "./collaboration"

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    orderIndex: integer("order_index").notNull().default(0),
    status: milestoneStatusEnum("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("milestones_project_idx").on(table.projectId),
    index("milestones_due_date_idx").on(table.dueDate),
  ]
)

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    proposalId: uuid("proposal_id").references(() => proposals.id, {
      onDelete: "set null",
    }),
    submissionId: uuid("submission_id").references(
      () => documentSubmissions.id,
      { onDelete: "set null" }
    ),
    meetingId: uuid("meeting_id").references(() => meetings.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isResolved: boolean("is_resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("feedback_recipient_resolved_idx").on(
      table.recipientId,
      table.isResolved
    ),
    index("feedback_project_idx").on(table.projectId),
  ]
)

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Unread badge + notification center queries
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    index("notifications_created_at_idx").on(table.createdAt),
  ]
)

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_logs_project_created_idx").on(
      table.projectId,
      table.createdAt
    ),
    index("activity_logs_actor_idx").on(table.actorId),
  ]
)
