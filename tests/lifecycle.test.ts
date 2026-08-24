import { describe, expect, it } from "vitest"

import { allowedActions } from "@/services/projects"
import {
  proposalReviewActions,
  submissionReviewActions,
  studentCanSubmitProposals,
  studentCanSubmitDocuments,
} from "@/services/submissions"
import { meetingActionAllowed, splitMeetings } from "@/services/meetings"

describe("project lifecycle actions", () => {
  it("lets the owning student submit a draft but not approve", () => {
    const actions = allowedActions(
      { status: "draft", studentId: "s1", supervisorId: null },
      { id: "s1", role: "student" }
    )
    expect(actions).toContain("submit")
    expect(actions).not.toContain("approve")
  })

  it("gives admins full control at every stage", () => {
    for (const status of ["topic_submitted", "under_review", "approved"] as const) {
      const actions = allowedActions(
        { status, studentId: "s1", supervisorId: null },
        { id: "a1", role: "admin" }
      )
      expect(actions.length).toBeGreaterThan(0)
    }
  })

  it("blocks an unassigned supervisor from acting", () => {
    const actions = allowedActions(
      { status: "under_review", studentId: "s1", supervisorId: "sup2" },
      { id: "other-sup", role: "supervisor" }
    )
    expect(actions).toHaveLength(0)
  })
})

describe("submission review transitions", () => {
  it("offers review moves only after submission", () => {
    expect(proposalReviewActions("submitted").length).toBeGreaterThan(0)
    expect(proposalReviewActions("draft" as string)).toHaveLength(0)
  })

  it("documents start as submitted and then lock", () => {
    expect(submissionReviewActions("submitted").length).toBeGreaterThan(0)
    expect(submissionReviewActions("approved")).toHaveLength(0)
  })

  it("gates student uploads by project stage", () => {
    expect(studentCanSubmitDocuments("in_progress")).toBe(true)
    expect(studentCanSubmitDocuments("completed")).toBe(false)
    expect(studentCanSubmitProposals("approved")).toBe(true)
    expect(studentCanSubmitProposals("rejected")).toBe(false)
  })
})

describe("meeting helpers", () => {
  it("splits upcoming vs past with a grace window", () => {
    const now = Date.now()
    const meetings = [
      { id: "a", startAt: new Date(now + 86_400_000), status: "scheduled" },
      { id: "b", startAt: new Date(now - 3_600_000), status: "scheduled" },
      { id: "c", startAt: new Date(now + 86_400_000), status: "cancelled" },
    ]
    const { upcoming, past } = splitMeetings(meetings)
    expect(upcoming.map((m) => m.id)).toEqual(["a"])
    expect(past.map((m) => m.id).sort()).toEqual(["b", "c"])
  })

  it("only allows managing live scheduled meetings", () => {
    const viewer = { id: "sup1", role: "supervisor" as const }
    expect(
      meetingActionAllowed({ createdBy: "stu1", status: "scheduled" }, "sup1", viewer)
    ).toBe(true)
    expect(
      meetingActionAllowed({ createdBy: "stu1", status: "completed" }, "sup1", viewer)
    ).toBe(false)
    expect(
      meetingActionAllowed({ createdBy: "stu1", status: "scheduled" }, null, viewer)
    ).toBe(false)
  })
})
