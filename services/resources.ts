import { and, desc, eq, or } from "drizzle-orm"

import { db } from "@/db"
import { files, projects, resources, users } from "@/db/schema"
import type { UserRole } from "@/lib/rbac"
import {
  deleteStoredFile,
  uploadProjectFile,
} from "@/lib/storage/files"
import type { CreateResourceInput } from "@/validations/resources"

export interface ResourceListItem {
  id: string
  title: string
  description: string | null
  category: string
  visibility: string
  createdAt: Date
  fileId: string
  fileName: string
  sizeBytes: number
  mimeType: string
  uploaderName: string | null
  uploadedBy: string
  projectTitle: string | null
}

export async function listVisibleResources(
  viewerId: string,
  role: UserRole,
  limit = 100
): Promise<ResourceListItem[]> {
  const visibilityScope =
    role === "admin"
      ? undefined
      : or(
          eq(resources.visibility, "everyone"),
          eq(resources.uploadedBy, viewerId),
          and(
            eq(resources.visibility, "project"),
            // Member of the linked project (student or supervisor).
            or(
              eq(projects.studentId, viewerId),
              eq(projects.supervisorId, viewerId)
            )
          )
        )

  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      category: resources.category,
      visibility: resources.visibility,
      createdAt: resources.createdAt,
      fileId: files.id,
      fileName: files.fileName,
      sizeBytes: files.sizeBytes,
      mimeType: files.mimeType,
      uploaderName: users.name,
      uploadedBy: resources.uploadedBy,
      projectTitle: projects.title,
    })
    .from(resources)
    .innerJoin(files, eq(files.id, resources.fileId))
    .innerJoin(users, eq(users.id, resources.uploadedBy))
    .leftJoin(projects, eq(projects.id, resources.projectId))
    .where(visibilityScope)
    .orderBy(desc(resources.createdAt))
    .limit(limit)

  return rows
}

/** Projects the viewer can attach a resource to (active work). */
export async function listAttachableProjects(
  viewerId: string,
  role: UserRole
): Promise<Array<{ id: string; title: string }>> {
  const scope =
    role === "admin"
      ? undefined
      : role === "supervisor"
        ? eq(projects.supervisorId, viewerId)
        : eq(projects.studentId, viewerId)

  return db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(scope)
    .orderBy(desc(projects.createdAt))
    .limit(50)
}

async function isProjectMember(projectId: string, userId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { studentId: true, supervisorId: true },
  })
  return (
    !!project &&
    (project.studentId === userId ||
      (project.supervisorId !== null && project.supervisorId === userId))
  )
}

export async function createResource(
  viewer: { id: string; name?: string; role: UserRole },
  input: CreateResourceInput,
  file: File
): Promise<{ resourceId: string }> {
  if (file.size === 0) throw new Error("Choose a file to upload.")

  const projectId = input.projectId ?? null

  if (input.visibility === "everyone") {
    // Institutional library — supervisors and admins only.
    if (viewer.role === "student") {
      throw new Error("Only supervisors and admins can publish to everyone.")
    }
  }

  if (input.visibility === "project") {
    if (!projectId) {
      throw new Error("Pick a project for project-scoped resources.")
    }
    if (viewer.role !== "admin" && !(await isProjectMember(projectId, viewer.id))) {
      throw new Error("You are not a member of that project.")
    }
  }

  // Storage lives under projects/<uuid>/…; non-project uploads get a synthetic
  // namespace so the signed-url permission model stays uniform.
  const storageSegment =
    projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(projectId)
      ? projectId
      : crypto.randomUUID()
  const stored = await uploadProjectFile(file, storageSegment)

  const [fileRow] = await db
    .insert(files)
    .values({ ...stored, uploadedBy: viewer.id })
    .returning({ id: files.id })

  const [resource] = await db
    .insert(resources)
    .values({
      projectId:
        input.projectId && input.projectId !== "" ? input.projectId : null,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      visibility: input.visibility,
      fileId: fileRow.id,
      uploadedBy: viewer.id,
    })
    .returning({ id: resources.id })

  return { resourceId: resource.id }
}

export async function deleteResource(
  resourceId: string,
  viewer: { id: string; role: UserRole }
): Promise<void> {
  const row = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
    columns: { id: true, uploadedBy: true },
    with: { file: { columns: { id: true, storageKey: true } } },
  })
  if (!row) throw new Error("Resource not found.")
  if (viewer.role !== "admin" && row.uploadedBy !== viewer.id) {
    throw new Error("You can only delete your own resources.")
  }

  await deleteStoredFile(row.file.storageKey).catch(() => undefined) // best-effort
  // resources.file_id is ON DELETE RESTRICT — remove the resource first.
  await db.delete(resources).where(eq(resources.id, resourceId))
  await db.delete(files).where(eq(files.id, row.file.id))
}
