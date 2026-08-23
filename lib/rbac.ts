export const USER_ROLES = ["student", "supervisor", "admin"] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  )
}

/**
 * Permission catalogue. Format: "<domain>:<action>[:scope]"
 * Scope "own"   -> records belonging to the current user
 * Scope "all"   -> any record in the system
 */
export const PERMISSIONS = [
  // Projects & proposals
  "projects:create",
  "projects:view.own",
  "projects:view.assigned",
  "projects:view.all",
  "projects:manage.all",
  "proposals:submit",
  "proposals:review",
  // Documents & resources
  "submissions:upload",
  "submissions:review",
  "resources:upload",
  "resources:delete.own",
  "resources:delete.all",
  // Meetings, milestones & feedback
  "meetings:schedule",
  "milestones:manage",
  "feedback:create",
  // Messaging (any authenticated user may message)
  "messages:send",
  // Administration
  "users:manage",
  "users:assign-supervisor",
  "departments:manage",
  "categories:manage",
  "reports:view",
  "analytics:view.system",
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  student: [
    "projects:create",
    "projects:view.own",
    "proposals:submit",
    "submissions:upload",
    "resources:upload",
    "resources:delete.own",
    "messages:send",
  ],
  supervisor: [
    "projects:view.assigned",
    "projects:view.all",
    "proposals:review",
    "submissions:review",
    "resources:upload",
    "resources:delete.own",
    "meetings:schedule",
    "milestones:manage",
    "feedback:create",
    "messages:send",
    "reports:view",
  ],
  admin: [
    "projects:view.all",
    "projects:manage.all",
    "proposals:review",
    "submissions:review",
    "resources:upload",
    "resources:delete.own",
    "resources:delete.all",
    "meetings:schedule",
    "milestones:manage",
    "feedback:create",
    "messages:send",
    "users:manage",
    "users:assign-supervisor",
    "departments:manage",
    "categories:manage",
    "reports:view",
    "analytics:view.system",
  ],
}

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

// Single dashboard route; content adapts per role.
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  student: "/dashboard",
  supervisor: "/dashboard",
  admin: "/dashboard",
}
