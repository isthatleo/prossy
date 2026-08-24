import { and, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import {
  meetingParticipants,
  meetings,
  notifications,
  projects,
  users,
} from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import { logActivity } from "@/services/activity"
import type {
  MeetingAction,
  ScheduleMeetingInput,
} from "@/validations/meetings"
import type { Viewer } from "@/services/milestones"

export interface MeetingListItem {
  id: string
  title: string
  agenda: string | null
  notes: string | null
  location: string | null
  startAt: Date
  endAt: Date | null
  status: string
  projectId: string
  projectTitle: string
  creatorName: string | null
  createdBy: string
}

export async function listMeetingsForUser(
  userId: string,
  role: UserRole,
  limit = 100
): Promise<MeetingListItem[]> {
  const scope =
    role === "admin"
      ? undefined
      : role === "supervisor"
        ? eq(projects.supervisorId, userId)
        : eq(projects.studentId, userId)

  const rows = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      agenda: meetings.agenda,
      notes: meetings.notes,
      location: meetings.location,
      startAt: meetings.startAt,
      endAt: meetings.endAt,
      status: meetings.status,
      projectId: meetings.projectId,
      projectTitle: projects.title,
      creatorName: users.name,
      createdBy: meetings.createdBy,
    })
    .from(meetings)
    .innerJoin(projects, eq(meetings.projectId, projects.id))
    .innerJoin(users, eq(meetings.createdBy, users.id))
    .where(scope)
    .orderBy(desc(meetings.startAt))
    .limit(limit)
  return rows
}

/** Projects a user can schedule meetings on (active work only). */
export async function listSchedulableProjects(
  userId: string,
  role: UserRole
): Promise<Array<{ id: string; title: string }>> {
  const activeStatuses = ["approved", "in_progress", "final_submission"] as const

  if (role === "student") {
    return db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(and(eq(projects.studentId, userId), inArray(projects.status, [...activeStatuses])))
  }
  if (role === "supervisor") {
    return db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(
        and(eq(projects.supervisorId, userId), inArray(projects.status, [...activeStatuses]))
      )
  }
  return db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(inArray(projects.status, [...activeStatuses]))
}

export async function scheduleMeeting(
  viewer: Viewer,
  input: ScheduleMeetingInput
): Promise<{ meetingId: string }> {
  // Access check mirrors the submissions service.
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, input.projectId),
    columns: { id: true, title: true, studentId: true, supervisorId: true },
  })
  if (!project) throw new Error("Project not found.")

  const allowed =
    viewer.role === "admin" ||
    project.studentId === viewer.id ||
    (project.supervisorId !== null && project.supervisorId === viewer.id)
  if (!allowed) throw new Error("You do not have access to this project.")

  const startAt = new Date(input.startAt)
  const endAt = new Date(startAt.getTime() + input.durationMinutes * 60 * 1000)

  const [meeting] = await db
    .insert(meetings)
    .values({
      projectId: project.id,
      title: input.title,
      agenda: input.agenda || null,
      location: input.location || null,
      startAt,
      endAt,
      status: "scheduled",
      createdBy: viewer.id,
    })
    .returning({ id: meetings.id })

  const participantIds = [
    ...new Set([project.studentId, project.supervisorId, viewer.id].filter(
      (id): id is string => id !== null
    )),
  ]
  await db
    .insert(meetingParticipants)
    .values(participantIds.map((userId) => ({ meetingId: meeting.id, userId })))

  await logActivity({
    projectId: project.id,
    actorId: viewer.id,
    type: "meeting_scheduled",
    summary: `Meeting scheduled: "${input.title}" (${startAt.toLocaleString("en-GB")}).`,
  })

  const others = participantIds.filter((id) => id !== viewer.id)
  for (const userId of others) {
    await db.insert(notifications).values({
      userId,
      type: "meeting_scheduled",
      title: "Meeting scheduled",
      body: `"${input.title}" on ${startAt.toLocaleString("en-GB")} — set up by ${viewer.name ?? "a member"}.`,
      link: "/meetings",
    })
  }

  return { meetingId: meeting.id }
}

async function getMeetingForViewer(meetingId: string, viewer: Viewer) {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: { project: { columns: { studentId: true, supervisorId: true, title: true } } },
  })
  if (!meeting) throw new Error("Meeting not found.")

  const canManage =
    viewer.role === "admin" ||
    meeting.createdBy === viewer.id ||
    meeting.project.supervisorId === viewer.id
  if (!canManage) {
    throw new Error("Only the organiser, assigned supervisor or an admin can update this meeting.")
  }
  return meeting
}

export async function completeMeeting(
  meetingId: string,
  viewer: Viewer,
  notes?: string
): Promise<void> {
  const meeting = await getMeetingForViewer(meetingId, viewer)

  await db
    .update(meetings)
    .set({ status: "completed", notes: notes?.trim() || meeting.notes, updatedAt: new Date() })
    .where(eq(meetings.id, meetingId))

  await logActivity({
    projectId: meeting.projectId,
    actorId: viewer.id,
    type: "meeting_completed",
    summary: `Meeting completed: "${meeting.title}".`,
  })
}

export async function cancelMeeting(
  meetingId: string,
  viewer: Viewer,
  reason?: string
): Promise<void> {
  const meeting = await getMeetingForViewer(meetingId, viewer)

  await db
    .update(meetings)
    .set({ status: "cancelled", notes: reason?.trim() || meeting.notes, updatedAt: new Date() })
    .where(eq(meetings.id, meetingId))

  await logActivity({
    projectId: meeting.projectId,
    actorId: viewer.id,
    type: "meeting_cancelled",
    summary: `Meeting cancelled: "${meeting.title}".`,
  })

  // Let the other party know.
  const participants = await db
    .select({ userId: meetingParticipants.userId })
    .from(meetingParticipants)
    .where(eq(meetingParticipants.meetingId, meetingId))
  for (const p of participants.filter((p) => p.userId !== viewer.id)) {
    await db.insert(notifications).values({
      userId: p.userId,
      type: "meeting_scheduled",
      title: "Meeting cancelled",
      body: `"${meeting.title}" was cancelled${reason?.trim() ? ` — ${reason.trim()}` : "."}`,
      link: "/meetings",
    })
  }
}

export function meetingActionAllowed(
  meeting: { createdBy: string; status: string },
  projectSupervisorId: string | null,
  viewer: Viewer
): boolean {
  if (meeting.status !== "scheduled") return false
  return (
    viewer.role === "admin" ||
    meeting.createdBy === viewer.id ||
    projectSupervisorId === viewer.id
  )
}

/** Splits meetings into upcoming (scheduled, near-future) and everything else. */
export function splitMeetings<T extends { id: string; startAt: Date; status: string }>(
  meetingsList: T[]
): { upcoming: T[]; past: T[] } {
  const now = Date.now() - 30 * 60 * 1000 // grace window for running sessions
  const upcoming = meetingsList
    .filter((m) => m.status === "scheduled" && new Date(m.startAt).getTime() >= now)
    .reverse()
  const upcomingIds = new Set(upcoming.map((m) => m.id))
  return {
    upcoming,
    past: meetingsList.filter((m) => !upcomingIds.has(m.id)),
  }
}

export type { MeetingAction }
