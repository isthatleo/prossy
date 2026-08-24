import { describe, expect, it } from "vitest"

import { createProjectSchema } from "@/validations/projects"
import { createProposalSchema, createDocumentSchema } from "@/validations/submissions"
import { createMilestoneSchema } from "@/validations/milestones"
import { scheduleMeetingSchema } from "@/validations/meetings"
import { addFeedbackSchema } from "@/validations/feedback"
import { sendMessageSchema } from "@/validations/messaging"
import { createResourceSchema } from "@/validations/resources"

const uuid = () => crypto.randomUUID()

describe("project validation", () => {
  it("accepts a well-formed project", () => {
    const parsed = createProjectSchema.safeParse({
      title: "Campus Lost & Found System",
      categoryId: uuid(),
      description:
        "A web platform where students report, search for and reclaim lost items on campus.",
    })
    expect(parsed.success).toBe(true)
  })

  it("rejects short titles and thin descriptions", () => {
    const shortTitle = createProjectSchema.safeParse({
      title: "ab",
      categoryId: uuid(),
      description: "A".repeat(40),
    })
    expect(shortTitle.success).toBe(false)

    const thinDescription = createProjectSchema.safeParse({
      title: "Valid Project Title Here",
      categoryId: uuid(),
      description: "too short",
    })
    expect(thinDescription.success).toBe(false)
  })
})

describe("proposal validation", () => {
  it("requires a meaningful title; text sections are optional (file-only allowed)", () => {
    const ok = createProposalSchema.safeParse({
      title: "Proposal v1 with a clear name",
      objectives: "Objectives.",
      methodology: "Methodology.",
    })
    expect(ok.success).toBe(true)

    const titleOnly = createProposalSchema.safeParse({ title: "Minimal but long enough" })
    expect(titleOnly.success).toBe(true)

    const missing = createProposalSchema.safeParse({ title: "hi" })
    expect(missing.success).toBe(false)
  })
})

describe("document validation", () => {
  it("only accepts known submission types", () => {
    const ok = createDocumentSchema.safeParse({
      type: "chapter_1",
      title: "Chapter One",
    })
    expect(ok.success).toBe(true)

    const bad = createDocumentSchema.safeParse({ type: "chapter_9", title: "X" })
    expect(bad.success).toBe(false)
  })
})

describe("milestone validation", () => {
  it("requires a meaningful title", () => {
    expect(createMilestoneSchema.safeParse({ title: "Lit review" }).success).toBe(true)
    expect(createMilestoneSchema.safeParse({ title: "" }).success).toBe(false)
  })
})

describe("meeting validation", () => {
  it("rejects past start times", () => {
    const parsed = scheduleMeetingSchema.safeParse({
      projectId: uuid(),
      title: "Weekly sync",
      startAt: new Date(Date.now() - 86_400_000).toISOString(),
      durationMinutes: "30",
    })
    expect(parsed.success).toBe(false)
  })

  it("coerces duration from strings and bounds it", () => {
    const ok = scheduleMeetingSchema.safeParse({
      projectId: uuid(),
      title: "Sync",
      startAt: new Date(Date.now() + 3_600_000).toISOString(),
      durationMinutes: "45",
    })
    expect(ok.success).toBe(true)
    if (ok.success) expect(ok.data.durationMinutes).toBe(45)

    const tooLong = scheduleMeetingSchema.safeParse({
      projectId: uuid(),
      title: "Sync",
      startAt: new Date(Date.now() + 3_600_000).toISOString(),
      durationMinutes: "500",
    })
    expect(tooLong.success).toBe(false)
  })
})

describe("feedback + messaging + resources validation", () => {
  it("requires feedback content of substance", () => {
    expect(
      addFeedbackSchema.safeParse({ recipientId: uuid(), content: "ok" }).success
    ).toBe(false)
    expect(
      addFeedbackSchema.safeParse({ recipientId: uuid(), content: "Please tighten chapter two." })
        .success
    ).toBe(true)
  })

  it("rejects empty messages", () => {
    expect(sendMessageSchema.safeParse({ body: "   " }).success).toBe(false)
    expect(sendMessageSchema.safeParse({ body: "Hello!" }).success).toBe(true)
  })

  it("restricts resource visibility values", () => {
    const base = { title: "Guidelines", category: "guideline" }
    expect(
      createResourceSchema.safeParse({ ...base, visibility: "everyone" }).success
    ).toBe(true)
    expect(
      createResourceSchema.safeParse({ ...base, visibility: "world" }).success
    ).toBe(false)
  })
})
