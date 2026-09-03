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
  if (others.length > 0) {
    await db.insert(notifications).values(
      others.map((userId) => ({
        userId,
        type: "meeting_scheduled" as const,
        title: "Meeting scheduled",
        body: `"${input.title}" on ${startAt.toLocaleString("en-GB")} — set up by ${viewer.name ?? "a member"}.`,
        link: `/meetings/${meeting.id}`,
      }))
    )
  }

  return { meetingId: meeting.id }
}

export async function getMeetingDetail(meetingId: string, viewer: Viewer) {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: {
      project: { columns: { id: true, title: true, studentId: true, supervisorId: true } },
    },
  })
  if (!meeting) throw new Error("Meeting not found.")

  const isMember =
    meeting.project.studentId === viewer.id ||
    (meeting.project.supervisorId !== null &&
      meeting.project.supervisorId === viewer.id)
  if (viewer.role !== "admin" && !isMember) {
    throw new Error("You do not have access to this meeting.")
  }

  const participants = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      image: users.image,
    })
    .from(meetingParticipants)
    .innerJoin(users, eq(users.id, meetingParticipants.userId))
    .where(eq(meetingParticipants.meetingId, meetingId))

  return {
    id: meeting.id,
    title: meeting.title,
    agenda: meeting.agenda,
    notes: meeting.notes,
    location: meeting.location,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
    status: meeting.status,
    createdBy: meeting.createdBy,
    createdAt: meeting.createdAt,
    projectId: meeting.project.id,
    projectTitle: meeting.project.title,
    canManage: meetingActionAllowed(
      { createdBy: meeting.createdBy, status: meeting.status },
      meeting.project.supervisorId,
      viewer
    ),
    participants,
  }
}

export type MeetingDetail = Awaited<ReturnType<typeof getMeetingDetail>>

/** Any participant may contribute shared minutes for the session. */
export async function updateMeetingNotes(
  meetingId: string,
  viewer: Viewer,
  notes: string
): Promise<void> {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: {
      project: { columns: { studentId: true, supervisorId: true } },
    },
  })
  if (!meeting) throw new Error("Meeting not found.")

  const isMember =
    meeting.project.studentId === viewer.id ||
    (meeting.project.supervisorId !== null &&
      meeting.project.supervisorId === viewer.id)
  if (viewer.role !== "admin" && !isMember) {
    throw new Error("Only meeting participants can edit the notes.")
  }

  await db
    .update(meetings)
    .set({ notes: notes.trim() || null, updatedAt: new Date() })
    .where(eq(meetings.id, meetingId))
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
  const cancelRecipients = participants.filter(p => p.userId !== viewer.id).map(p => p.userId)
  if (cancelRecipients.length > 0) {
    await db.insert(notifications).values(
      cancelRecipients.map((userId) => ({
        userId,
        type: "meeting_cancelled" as const,
        title: "Meeting cancelled",
        body: `"${meeting.title}" has been cancelled.`,
        link: `/meetings`,
      }))
    )
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
