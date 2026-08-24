import { describe, expect, it } from "vitest"

import { can, isUserRole, PERMISSIONS, USER_ROLES } from "@/lib/rbac"

describe("rbac", () => {
  it("grants admins the full administrative set", () => {
    expect(can("admin", "users:manage")).toBe(true)
    expect(can("admin", "departments:manage")).toBe(true)
    expect(can("admin", "categories:manage")).toBe(true)
    expect(can("admin", "projects:manage.all")).toBe(true)
    expect(can("admin", "resources:delete.all")).toBe(true)
    expect(can("admin", "analytics:view.system")).toBe(true)
  })

  it("denies students supervisory powers", () => {
    expect(can("student", "proposals:review")).toBe(false)
    expect(can("student", "submissions:review")).toBe(false)
    expect(can("student", "milestones:manage")).toBe(false)
    expect(can("student", "reports:view")).toBe(false)
  })

  it("lets every role send messages and upload resources", () => {
    for (const role of ["student", "supervisor", "admin"] as const) {
      expect(can(role, "messages:send")).toBe(true)
      expect(can(role, "resources:upload")).toBe(true)
    }
  })

  it("gives supervisors review powers but no user management", () => {
    expect(can("supervisor", "proposals:review")).toBe(true)
    expect(can("supervisor", "milestones:manage")).toBe(true)
    expect(can("supervisor", "users:manage")).toBe(false)
    expect(can("supervisor", "resources:delete.all")).toBe(false)
  })

  it("has a non-empty permission catalogue and valid roles", () => {
    expect(PERMISSIONS.length).toBeGreaterThan(15)
    for (const role of USER_ROLES) {
      expect(isUserRole(role)).toBe(true)
    }
  })
})
