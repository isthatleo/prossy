import { relations } from "drizzle-orm"

import {
  accounts,
  sessions,
  users,
  verifications,
} from "./auth"
import {
  departments,
  projectCategories,
  projects,
  studentProfiles,
  supervisorProfiles,
} from "./academics"
import {
  documentSubmissions,
  files,
  proposals,
  resources,
} from "./submissions"
import {
  conversationMembers,
  conversations,
  meetingParticipants,
  meetings,
  messages,
} from "./collaboration"
import { activityLogs, feedback, milestones, notifications } from "./tracking"

// ---- Auth ----

export const usersRelations = relations(users, ({ many, one }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  supervisorProfile: one(supervisorProfiles, {
    fields: [users.id],
    references: [supervisorProfiles.userId],
  }),
  sessions: many(sessions),
  accounts: many(accounts),
  projectsAsStudent: many(projects, { relationName: "projectStudent" }),
  projectsAsSupervisor: many(projects, { relationName: "projectSupervisor" }),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const verificationsRelations = relations(verifications, () => ({}))

// ---- Academics ----

export const departmentsRelations = relations(departments, ({ many }) => ({
  students: many(studentProfiles),
  supervisors: many(supervisorProfiles),
  projects: many(projects),
}))

export const studentProfilesRelations = relations(
  studentProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [studentProfiles.userId],
      references: [users.id],
    }),
    department: one(departments, {
      fields: [studentProfiles.departmentId],
      references: [departments.id],
    }),
  })
)

export const supervisorProfilesRelations = relations(
  supervisorProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [supervisorProfiles.userId],
      references: [users.id],
    }),
    department: one(departments, {
      fields: [supervisorProfiles.departmentId],
      references: [departments.id],
    }),
  })
)

export const projectCategoriesRelations = relations(
  projectCategories,
  ({ many }) => ({
    projects: many(projects),
  })
)

export const projectsRelations = relations(projects, ({ one, many }) => ({
  student: one(users, {
    fields: [projects.studentId],
    references: [users.id],
    relationName: "projectStudent",
  }),
  supervisor: one(users, {
    fields: [projects.supervisorId],
    references: [users.id],
    relationName: "projectSupervisor",
  }),
  category: one(projectCategories, {
    fields: [projects.categoryId],
    references: [projectCategories.id],
  }),
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
  proposals: many(proposals),
  submissions: many(documentSubmissions),
  resources: many(resources),
  milestones: many(milestones),
  meetings: many(meetings),
  feedback: many(feedback),
  activityLogs: many(activityLogs),
}))

// ---- Submissions ----

export const filesRelations = relations(files, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
}))

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  project: one(projects, {
    fields: [proposals.projectId],
    references: [projects.id],
  }),
  file: one(files, { fields: [proposals.fileId], references: [files.id] }),
  submitter: one(users, {
    fields: [proposals.submittedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [proposals.reviewedBy],
    references: [users.id],
  }),
  feedback: many(feedback),
}))

export const documentSubmissionsRelations = relations(
  documentSubmissions,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [documentSubmissions.projectId],
      references: [projects.id],
    }),
    file: one(files, {
      fields: [documentSubmissions.fileId],
      references: [files.id],
    }),
    submitter: one(users, {
      fields: [documentSubmissions.submittedBy],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [documentSubmissions.reviewedBy],
      references: [users.id],
    }),
    feedback: many(feedback),
  })
)

export const resourcesRelations = relations(resources, ({ one }) => ({
  project: one(projects, {
    fields: [resources.projectId],
    references: [projects.id],
  }),
  file: one(files, { fields: [resources.fileId], references: [files.id] }),
  uploader: one(users, {
    fields: [resources.uploadedBy],
    references: [users.id],
  }),
}))

// ---- Collaboration ----

export const conversationsRelations = relations(
  conversations,
  ({ many }) => ({
    members: many(conversationMembers),
    messages: many(messages),
  })
)

export const conversationMembersRelations = relations(
  conversationMembers,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMembers.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationMembers.userId],
      references: [users.id],
    }),
  })
)

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  file: one(files, { fields: [messages.fileId], references: [files.id] }),
}))

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  project: one(projects, {
    fields: [meetings.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [meetings.createdBy],
    references: [users.id],
  }),
  participants: many(meetingParticipants),
  feedback: many(feedback),
}))

export const meetingParticipantsRelations = relations(
  meetingParticipants,
  ({ one }) => ({
    meeting: one(meetings, {
      fields: [meetingParticipants.meetingId],
      references: [meetings.id],
    }),
    user: one(users, {
      fields: [meetingParticipants.userId],
      references: [users.id],
    }),
  })
)

// ---- Tracking ----

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
}))

export const feedbackRelations = relations(feedback, ({ one }) => ({
  project: one(projects, {
    fields: [feedback.projectId],
    references: [projects.id],
  }),
  proposal: one(proposals, {
    fields: [feedback.proposalId],
    references: [proposals.id],
  }),
  submission: one(documentSubmissions, {
    fields: [feedback.submissionId],
    references: [documentSubmissions.id],
  }),
  meeting: one(meetings, {
    fields: [feedback.meetingId],
    references: [meetings.id],
  }),
  author: one(users, {
    fields: [feedback.authorId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [feedback.recipientId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}))
