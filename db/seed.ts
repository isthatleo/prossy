/**
 * Development seed — creates a realistic demo dataset so every dashboard
 * looks alive immediately after migration.
 *
 * Note: seeded documents/resources reference placeholder file rows; real
 * uploads arrive with the storage module.
 *
 * Run: npm run db:seed   (requires DATABASE_URL / DIRECT_URL in .env.local)
 */
import { config } from "dotenv"
import { sql } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"

import { db } from "./index"
import {
  accounts,
  activityLogs,
  conversationMembers,
  conversations,
  departments,
  documentSubmissions,
  feedback,
  files,
  meetingParticipants,
  meetings,
  messages,
  milestones,
  notifications,
  projectCategories,
  projects,
  proposals,
  studentProfiles,
  supervisorProfiles,
  users,
} from "./schema"

config({ path: ".env.local" })

const DEMO_PASSWORD = "password123"
const uuid = () => crypto.randomUUID()

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)

async function createUser(input: {
  name: string
  email: string
  role: "student" | "supervisor" | "admin"
}) {
  const userId = uuid()
  const hashed = await hashPassword(DEMO_PASSWORD)

  await db.insert(users).values({
    id: userId,
    name: input.name,
    email: input.email,
    role: input.role,
    emailVerified: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(1),
  })

  await db.insert(accounts).values({
    id: uuid(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: hashed,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(90),
  })

  return userId
}

async function main() {
  console.log("→ Clearing existing data…")
  await db.execute(sql`
    truncate table
      activity_logs, notifications, feedback, milestones,
      meeting_participants, meetings, messages, conversation_members, conversations,
      document_submissions, proposals, projects, project_categories, resources,
      supervisor_profiles, student_profiles, departments,
      accounts, sessions, verifications, users
    restart identity cascade
  `)

  console.log("→ Creating departments…")
  const [deptCI] = await db
    .insert(departments)
    .values([
      { name: "Computing & Informatics", code: "CI" },
      { name: "Business Studies", code: "BUS" },
    ])
    .returning()

  console.log("→ Creating categories…")
  const [catWeb, catMobile] = await db
    .insert(projectCategories)
    .values([
      { name: "Web Systems", description: "Web platforms and services" },
      { name: "Mobile Computing", description: "Mobile applications" },
      {
        name: "Data & AI",
        description: "Data engineering and intelligent systems",
      },
    ])
    .returning()

  console.log("→ Creating users…")
  const adminId = await createUser({
    name: "Admin User",
    email: "admin@prossy.dev",
    role: "admin",
  })
  const sarahId = await createUser({
    name: "Dr. Sarah Mitchell",
    email: "sarah@prossy.dev",
    role: "supervisor",
  })
  const brianId = await createUser({
    name: "Brian Ochieng",
    email: "brian@prossy.dev",
    role: "supervisor",
  })
  const leonardId = await createUser({
    name: "Leonard Mwansa",
    email: "leonard@prossy.dev",
    role: "student",
  })
  const chilesheId = await createUser({
    name: "Chileshe Banda",
    email: "chileshe@prossy.dev",
    role: "student",
  })

  await db.insert(studentProfiles).values([
    {
      userId: leonardId,
      registrationNumber: "CI/2023/B/0021",
      departmentId: deptCI.id,
      yearOfStudy: 3,
    },
    {
      userId: chilesheId,
      registrationNumber: "CI/2023/B/0034",
      departmentId: deptCI.id,
      yearOfStudy: 3,
    },
  ])

  await db.insert(supervisorProfiles).values([
    {
      userId: sarahId,
      staffNumber: "CI/STF/014",
      title: "Dr.",
      departmentId: deptCI.id,
      specialization: "Software Engineering",
      officeLocation: "Block C, Office 12",
      maxStudents: 6,
    },
    {
      userId: brianId,
      staffNumber: "CI/STF/022",
      title: "Mr.",
      departmentId: deptCI.id,
      specialization: "Information Systems",
      officeLocation: "Block B, Office 05",
      maxStudents: 6,
    },
  ])

  console.log("→ Creating projects…")
  const [leonardProject, chilesheProject] = await db
    .insert(projects)
    .values([
      {
        title:
          "Web-Based Student Project Management, Supervision and Collaboration System",
        description:
          "A platform that digitises the entire final-year project lifecycle for students and supervisors.",
        problemStatement:
          "Project administration is manual, supervision records get lost, and students lack visibility of deadlines.",
        objectives:
          "Digitise submissions; centralise communication; track progress; surface at-risk projects early.",
        methodology: "Agile development with two-week iterations.",
        categoryId: catWeb.id,
        departmentId: deptCI.id,
        studentId: leonardId,
        supervisorId: sarahId,
        status: "in_progress",
        startDate: "2026-06-01",
        expectedEndDate: "2026-11-30",
        progressPercent: 45,
        healthScore: 78,
        academicYear: "2025/2026",
        createdAt: daysAgo(75),
        updatedAt: daysAgo(2),
      },
      {
        title: "Clinic Appointment Booking Platform",
        description:
          "Online booking system for campus clinic consultations.",
        problemStatement:
          "Long queues and paper-based booking at the campus clinic.",
        objectives:
          "Reduce waiting time; digitalise scheduling; send reminders.",
        methodology: "Prototyping with stakeholder interviews.",
        categoryId: catMobile.id,
        departmentId: deptCI.id,
        studentId: chilesheId,
        supervisorId: brianId,
        status: "approved",
        startDate: "2026-07-01",
        expectedEndDate: "2026-12-15",
        progressPercent: 25,
        healthScore: 85,
        academicYear: "2025/2026",
        createdAt: daysAgo(50),
        updatedAt: daysAgo(4),
      },
    ])
    .returning()

  console.log("→ Creating proposals…")
  await db.insert(proposals).values([
    {
      projectId: leonardProject.id,
      version: 1,
      title: leonardProject.title,
      abstract:
        "This project proposes a web platform managing the full lifecycle of student projects including supervision, messaging and analytics.",
      objectives: leonardProject.objectives,
      methodology: leonardProject.methodology,
      status: "approved",
      submittedBy: leonardId,
      reviewedBy: sarahId,
      reviewNotes:
        "Strong proposal. Sharpen the evaluation criteria for project health scoring before Chapter 3.",
      submittedAt: daysAgo(70),
      reviewedAt: daysAgo(66),
    },
    {
      projectId: chilesheProject.id,
      version: 1,
      title: chilesheProject.title,
      abstract:
        "Booking platform reducing patient wait times through online scheduling.",
      status: "approved",
      submittedBy: chilesheId,
      reviewedBy: brianId,
      reviewNotes:
        "Approved. Include data-protection considerations in methodology.",
      submittedAt: daysAgo(45),
      reviewedAt: daysAgo(42),
    },
  ])

  console.log("→ Creating document submission…")
  const [chapterFile] = await db
    .insert(files)
    .values({
      // Placeholder until the storage module lands — download links will
      // resolve once real uploads replace seed rows.
      storageKey: "seed/placeholders/chapter-1-v2.pdf",
      fileName: "chapter-1-v2.pdf",
      mimeType: "application/pdf",
      sizeBytes: 482_113,
      uploadedBy: leonardId,
      createdAt: daysAgo(3),
    })
    .returning()

  await db.insert(documentSubmissions).values({
    projectId: leonardProject.id,
    type: "chapter_1",
    version: 2,
    fileId: chapterFile.id,
    description: "Chapter 1 revision addressing scope comments.",
    status: "submitted",
    submittedBy: leonardId,
    submittedAt: daysAgo(3),
  })

  console.log("→ Creating milestones…")
  await db.insert(milestones).values([
    { projectId: leonardProject.id, title: "Topic approval", orderIndex: 1, status: "completed", completedAt: daysAgo(72), dueDate: daysAgo(74) },
    { projectId: leonardProject.id, title: "Proposal approval", orderIndex: 2, status: "completed", completedAt: daysAgo(66), dueDate: daysAgo(65) },
    { projectId: leonardProject.id, title: "Chapter 1 — Introduction", orderIndex: 3, status: "in_progress", dueDate: daysAhead(4) },
    { projectId: leonardProject.id, title: "Chapter 2 — Literature review", orderIndex: 4, status: "pending", dueDate: daysAhead(21) },
    { projectId: leonardProject.id, title: "Implementation", orderIndex: 5, status: "pending", dueDate: daysAhead(60) },
    { projectId: chilesheProject.id, title: "Proposal approval", orderIndex: 1, status: "completed", completedAt: daysAgo(42), dueDate: daysAgo(43) },
    { projectId: chilesheProject.id, title: "Requirements specification", orderIndex: 2, status: "in_progress", dueDate: daysAhead(10) },
  ])

  console.log("→ Creating conversations…")
  const [convSarah] = await db
    .insert(conversations)
    .values({ createdBy: sarahId, lastMessageAt: daysAgo(1) })
    .returning()
  await db.insert(conversationMembers).values([
    { conversationId: convSarah.id, userId: sarahId, lastReadAt: daysAgo(1) },
    { conversationId: convSarah.id, userId: leonardId, lastReadAt: daysAgo(2) },
  ])
  await db.insert(messages).values([
    {
      conversationId: convSarah.id,
      senderId: leonardId,
      body: "Good morning Dr. Sarah. I have uploaded the revised Chapter 1.",
      createdAt: daysAgo(3),
    },
    {
      conversationId: convSarah.id,
      senderId: sarahId,
      body: "Well received, Leonard. Please revise section 2.3 on the evaluation criteria before Friday.",
      createdAt: daysAgo(1),
    },
  ])

  console.log("→ Creating meetings…")
  const [m1, m2] = await db
    .insert(meetings)
    .values([
      {
        projectId: leonardProject.id,
        title: "Chapter 1 Review",
        agenda: "Walk through revised introduction and scope.",
        notes:
          "Agreed to tighten research questions. Student to resubmit by Friday.",
        location: "ICT Lab 2",
        startAt: daysAgo(7),
        endAt: daysAgo(7),
        status: "completed",
        createdBy: sarahId,
      },
      {
        projectId: leonardProject.id,
        title: "Methodology Planning",
        agenda: "Select evaluation metrics for the health algorithm.",
        location: "Block C, Office 12",
        startAt: daysAhead(3),
        endAt: daysAhead(3),
        status: "scheduled",
        createdBy: sarahId,
      },
    ])
    .returning()
  await db.insert(meetingParticipants).values([
    { meetingId: m1.id, userId: sarahId },
    { meetingId: m1.id, userId: leonardId },
    { meetingId: m2.id, userId: sarahId },
    { meetingId: m2.id, userId: leonardId },
  ])

  console.log("→ Creating feedback…")
  await db.insert(feedback).values([
    {
      projectId: leonardProject.id,
      authorId: sarahId,
      recipientId: leonardId,
      content:
        "Section 2.3 needs measurable evaluation criteria. Suggest milestone completion rate plus overdue count.",
      isResolved: false,
      createdAt: daysAgo(1),
    },
    {
      projectId: leonardProject.id,
      authorId: sarahId,
      recipientId: leonardId,
      content: "Introduction reads well now. Scope is clear.",
      isResolved: true,
      resolvedAt: daysAgo(6),
      createdAt: daysAgo(7),
    },
  ])

  console.log("→ Creating notifications…")
  await db.insert(notifications).values([
    {
      userId: leonardId,
      type: "message",
      title: "New message from Dr. Sarah Mitchell",
      body: "Please revise section 2.3 on the evaluation criteria before Friday.",
      link: "/messages",
      readAt: null,
      createdAt: daysAgo(1),
    },
    {
      userId: leonardId,
      type: "meeting_scheduled",
      title: "Meeting scheduled: Methodology Planning",
      body: "In 3 days · Block C, Office 12",
      link: "/meetings",
      readAt: null,
      createdAt: daysAgo(2),
    },
    {
      userId: leonardId,
      type: "project_status_changed",
      title: "Proposal approved",
      body: "Your proposal has been approved by Dr. Sarah Mitchell.",
      link: "/projects",
      readAt: daysAgo(60),
      createdAt: daysAgo(66),
    },
    {
      userId: sarahId,
      type: "document_reviewed",
      title: "Chapter 1 revision submitted",
      body: "Leonard Mwansa submitted a revision for review.",
      link: "/reviews",
      readAt: null,
      createdAt: daysAgo(3),
    },
    {
      userId: adminId,
      type: "system",
      title: "Welcome to Prossy",
      body: "Seed data loaded successfully.",
      link: "/dashboard",
      readAt: daysAgo(80),
      createdAt: daysAgo(85),
    },
  ])

  console.log("→ Creating activity log…")
  await db.insert(activityLogs).values([
    { projectId: leonardProject.id, actorId: leonardId, type: "project_created", summary: "Project created", createdAt: daysAgo(75) },
    { projectId: leonardProject.id, actorId: adminId, type: "supervisor_assigned", summary: "Dr. Sarah Mitchell assigned as supervisor", createdAt: daysAgo(73) },
    { projectId: leonardProject.id, actorId: leonardId, type: "proposal_submitted", summary: "Proposal v1 submitted", createdAt: daysAgo(70) },
    { projectId: leonardProject.id, actorId: sarahId, type: "proposal_approved", summary: "Proposal approved", createdAt: daysAgo(66) },
    { projectId: leonardProject.id, actorId: leonardId, type: "document_submitted", summary: "Chapter 1 v2 submitted for review", createdAt: daysAgo(3) },
    { projectId: leonardProject.id, actorId: sarahId, type: "meeting_scheduled", summary: "Meeting scheduled: Methodology Planning", createdAt: daysAgo(2) },
  ])

  console.log("\n✔ Seed complete!\n")
  console.log(`Demo accounts (password: ${DEMO_PASSWORD})`)
  console.log("──────────────────────────────────────────")
  console.log("Admin       → admin@prossy.dev")
  console.log("Supervisor  → sarah@prossy.dev")
  console.log("Supervisor  → brian@prossy.dev")
  console.log("Student     → leonard@prossy.dev")
  console.log("Student     → chileshe@prossy.dev")
  console.log("──────────────────────────────────────────")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("✖ Seed failed:", error)
    process.exit(1)
  })
