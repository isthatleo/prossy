import { sql } from "drizzle-orm"
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { projectStatusEnum } from "./enums"
import { users } from "./auth"

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    registrationNumber: text("registration_number").notNull().unique(),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    yearOfStudy: integer("year_of_study"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("student_profiles_department_idx").on(table.departmentId)]
)

export const supervisorProfiles = pgTable(
  "supervisor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    staffNumber: text("staff_number").notNull().unique(),
    title: text("title"),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    specialization: text("specialization"),
    officeLocation: text("office_location"),
    maxStudents: integer("max_students").notNull().default(8),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("supervisor_profiles_department_idx").on(table.departmentId),
  ]
)

export const projectCategories = pgTable("project_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    problemStatement: text("problem_statement"),
    objectives: text("objectives"),
    methodology: text("methodology"),
    categoryId: uuid("category_id").references(() => projectCategories.id, {
      onDelete: "set null",
    }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    supervisorId: text("supervisor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: projectStatusEnum("status").notNull().default("draft"),
    startDate: date("start_date"),
    expectedEndDate: date("expected_end_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    progressPercent: integer("progress_percent").notNull().default(0),
    healthScore: integer("health_score").notNull().default(100),
    academicYear: text("academic_year"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("projects_status_idx").on(table.status),
    index("projects_student_idx").on(table.studentId),
    index("projects_supervisor_idx").on(table.supervisorId),
    index("projects_category_idx").on(table.categoryId),
    index("projects_created_at_idx").on(table.createdAt),
    index("projects_updated_at_idx").on(table.updatedAt),
    index("projects_title_idx").on(table.title),
    // One active (non-rejected/completed) project per student at a time
    uniqueIndex("projects_active_per_student_idx")
      .on(table.studentId)
      .where(sql`status not in ('rejected', 'completed')`),
  ]
)
