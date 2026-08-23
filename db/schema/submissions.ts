import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import {
  proposalStatusEnum,
  resourceCategoryEnum,
  resourceVisibilityEnum,
  submissionStatusEnum,
  submissionTypeEnum,
} from "./enums"
import { users } from "./auth"
import { projects } from "./academics"

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("files_uploaded_by_idx").on(table.uploadedBy)]
)

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    title: text("title").notNull(),
    abstract: text("abstract"),
    objectives: text("objectives"),
    methodology: text("methodology"),
    fileId: uuid("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    status: proposalStatusEnum("status").notNull().default("submitted"),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewedBy: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNotes: text("review_notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("proposals_project_version_idx").on(
      table.projectId,
      table.version
    ),
    index("proposals_status_idx").on(table.status),
  ]
)

export const documentSubmissions = pgTable(
  "document_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: submissionTypeEnum("type").notNull(),
    version: integer("version").notNull().default(1),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
    description: text("description"),
    status: submissionStatusEnum("status").notNull().default("submitted"),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewedBy: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNotes: text("review_notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("document_submissions_project_type_version_idx").on(
      table.projectId,
      table.type,
      table.version
    ),
    index("document_submissions_status_idx").on(table.status),
    index("document_submissions_project_idx").on(table.projectId),
  ]
)

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    category: resourceCategoryEnum("category").notNull().default("other"),
    visibility: resourceVisibilityEnum("visibility").notNull().default("project"),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("resources_project_idx").on(table.projectId),
    index("resources_category_idx").on(table.category),
  ]
)
