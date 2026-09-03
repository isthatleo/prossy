import { asc, eq, and, inArray, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  departments,
  projects,
  studentProfiles,
  supervisorProfiles,
  users,
} from "@/db/schema"

export interface StudentDirectoryRow {
  id: string
  name: string
  email: string
  isActive: boolean
  registrationNumber: string | null
  departmentName: string | null
  yearOfStudy: number | null
  activeProjectTitle: string | null
  activeProjectStatus: string | null
}

export interface SupervisorDirectoryRow {
  id: string
  name: string
  email: string
  isActive: boolean
  title: string | null
  staffNumber: string | null
  departmentName: string | null
  specialization: string | null
  officeLocation: string | null
  maxStudents: number
  currentLoad: number
}

const ACTIVE_STATUSES = ["approved", "in_progress", "final_submission"] as const

export async function listStudentDirectory(supervisorId?: string): Promise<StudentDirectoryRow[]> {
  const [rows, activeProjects] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.is_active,
        registrationNumber: studentProfiles.registrationNumber,
        yearOfStudy: studentProfiles.yearOfStudy,
        departmentName: departments.name,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(departments, eq(departments.id, studentProfiles.departmentId))
      // Include deactivated accounts so admins can re-activate them.
      .where(
        supervisorId
          ? and(
              eq(users.role, "student"),
              eq(projects.supervisorId, supervisorId),
              inArray(projects.status, [...ACTIVE_STATUSES])
            )
          : eq(users.role, "student")
      )
      .orderBy(asc(users.name)),
    db
      .select({
        studentId: projects.studentId,
        title: projects.title,
        status: projects.status,
      })
      .from(projects)
      .where(inArray(projects.status, [...ACTIVE_STATUSES])),
  ])

  const byStudent = new Map(activeProjects.map((p) => [p.studentId, p]))

  return rows.map((row) => ({
    ...row,
    activeProjectTitle: byStudent.get(row.id)?.title ?? null,
    activeProjectStatus: byStudent.get(row.id)?.status ?? null,
  }))
}

export async function listSupervisorDirectory(): Promise<SupervisorDirectoryRow[]> {
  const [rows, grouped] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.is_active,
        title: supervisorProfiles.title,
        staffNumber: supervisorProfiles.staffNumber,
        specialization: supervisorProfiles.specialization,
        officeLocation: supervisorProfiles.officeLocation,
        maxStudents: supervisorProfiles.maxStudents,
        departmentName: departments.name,
      })
      .from(users)
      .innerJoin(
        supervisorProfiles,
        eq(supervisorProfiles.userId, users.id)
      )
      .leftJoin(departments, eq(departments.id, supervisorProfiles.departmentId))
      // Include deactivated accounts so admins can re-activate them.
      .where(eq(users.role, "supervisor"))
      .orderBy(asc(users.name)),
    db
      .select({
        supervisorId: projects.supervisorId,
        total: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(inArray(projects.status, [...ACTIVE_STATUSES]))
      .groupBy(projects.supervisorId),
  ])

  const loadById = new Map(
    grouped.filter((g) => g.supervisorId !== null).map((g) => [g.supervisorId as string, g.total])
  )

  return rows.map((row) => ({
    ...row,
    currentLoad: loadById.get(row.id) ?? 0,
  }))
}
